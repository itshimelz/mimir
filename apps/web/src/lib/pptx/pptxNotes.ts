// FILE: pptxNotes.ts
// Purpose: Extract speaker notes from OpenXML presentation (.pptx) ZIP parts,
//          mapping 1-based slide numbers to plain-text speaker notes.
// Layer: Web PPTX parsing utility
// Exports: extractPptxSpeakerNotes, parseNotesXmlText

import JSZip from "jszip";

/**
 * Extracts speaker notes from a PPTX ArrayBuffer, returning a map from
 * 1-based slide number to notes string.
 */
export async function extractPptxSpeakerNotes(bytes: ArrayBuffer): Promise<Map<number, string>> {
  const notesMap = new Map<number, string>();
  if (!bytes || bytes.byteLength === 0) {
    return notesMap;
  }

  try {
    const zip = await JSZip.loadAsync(bytes);
    const slideRelsRegex = /^ppt\/slides\/_rels\/slide(\d+)\.xml\.rels$/i;

    // Check slide relationship files for exact 1-to-1 notesSlide relationships
    for (const [filename, fileEntry] of Object.entries(zip.files)) {
      const match = filename.match(slideRelsRegex);
      if (!match || !match[1]) continue;
      const slideNum = Number.parseInt(match[1], 10);
      if (Number.isNaN(slideNum)) continue;

      try {
        const relsXml = await fileEntry.async("string");
        const parser = new DOMParser();
        const doc = parser.parseFromString(relsXml, "application/xml");
        const relationships = doc.querySelectorAll("Relationship");
        let targetNotesFile: string | null = null;

        for (const rel of Array.from(relationships)) {
          const type = rel.getAttribute("Type") ?? "";
          const target = rel.getAttribute("Target") ?? "";
          if (type.includes("notesSlide")) {
            const resolved = target.startsWith("../")
              ? `ppt/${target.slice(3)}`
              : target.startsWith("notesSlides/")
                ? `ppt/${target}`
                : target;
            targetNotesFile = resolved;
            break;
          }
        }

        const notesFile = targetNotesFile ? zip.file(targetNotesFile) : null;
        if (notesFile) {
          const notesXml = await notesFile.async("string");
          const notesText = parseNotesXmlText(notesXml);
          if (notesText) {
            notesMap.set(slideNum, notesText);
          }
        }
      } catch {
        // Continue if single slide rel fails
      }
    }

    // Fallback if rels were not present or notes are numbered conventionally
    if (notesMap.size === 0) {
      const notesSlideRegex = /^ppt\/notesSlides\/notesSlide(\d+)\.xml$/i;
      for (const [filename, fileEntry] of Object.entries(zip.files)) {
        const match = filename.match(notesSlideRegex);
        if (!match || !match[1]) continue;
        const slideNum = Number.parseInt(match[1], 10);
        if (Number.isNaN(slideNum)) continue;

        try {
          const notesXml = await fileEntry.async("string");
          const notesText = parseNotesXmlText(notesXml);
          if (notesText) {
            notesMap.set(slideNum, notesText);
          }
        } catch {
          // Ignore
        }
      }
    }
  } catch {
    // If ZIP fails to load
  }

  return notesMap;
}

/**
 * Parses speaker notes plain text from a `notesSlide*.xml` content string.
 */
export function parseNotesXmlText(xmlContent: string): string {
  if (!xmlContent) return "";

  if (typeof DOMParser !== "undefined") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlContent, "application/xml");

      const allElements = Array.from(doc.querySelectorAll("*"));
      const shapes = allElements.filter((el) => el.localName === "sp");

      for (const shape of shapes) {
        const childElements = Array.from(shape.querySelectorAll("*"));
        const ph = childElements.find((el) => el.localName === "ph");
        const phType = ph?.getAttribute("type");

        // "body" is the standard speaker notes body placeholder in OOXML
        if (phType === "body") {
          const paragraphs = childElements.filter((el) => el.localName === "p");
          const lines: string[] = [];
          for (const p of paragraphs) {
            const pChildren = Array.from(p.querySelectorAll("*"));
            const runs = pChildren.filter((el) => el.localName === "t");
            const lineText = runs.map((r) => r.textContent ?? "").join("");
            if (lineText.length > 0) {
              lines.push(lineText);
            }
          }
          const text = lines.join("\n").trim();
          if (text) return text;
        }
      }

      // Fallback: search for any shape text excluding thumbnail/slide number
      for (const shape of shapes) {
        const childElements = Array.from(shape.querySelectorAll("*"));
        const ph = childElements.find((el) => el.localName === "ph");
        const phType = ph?.getAttribute("type");
        if (phType === "sldImg" || phType === "sldNum" || phType === "dt") {
          continue;
        }
        const paragraphs = childElements.filter((el) => el.localName === "p");
        const lines: string[] = [];
        for (const p of paragraphs) {
          const pChildren = Array.from(p.querySelectorAll("*"));
          const runs = pChildren.filter((el) => el.localName === "t");
          const lineText = runs.map((r) => r.textContent ?? "").join("");
          if (lineText.length > 0) {
            lines.push(lineText);
          }
        }
        const text = lines.join("\n").trim();
        if (text) return text;
      }
    } catch {
      // Fallback to regex parser
    }
  }

  // Regex fallback (runs in Node/non-DOM environments or on DOMParser failure)
  try {
    // Isolate body shape if possible: <p:sp> ... <p:ph type="body"/> ... </p:sp>
    const bodyShapeMatch = xmlContent.match(/<(?:p:)?sp[\s\S]*?type="body"[\s\S]*?<\/(?:p:)?sp>/);
    const targetXml = bodyShapeMatch ? bodyShapeMatch[0] : xmlContent;

    const paragraphMatches = Array.from(
      targetXml.matchAll(/<(?:a:)?p(?:\s[^>]*)?>([\s\S]*?)<\/(?:a:)?p>/g),
    );
    const lines: string[] = [];
    for (const pMatch of paragraphMatches) {
      const pContent = pMatch[1] ?? "";
      const textMatches = Array.from(
        pContent.matchAll(/<(?:a:)?t(?:\s[^>]*)?>([\s\S]*?)<\/(?:a:)?t>/g),
      );
      const line = textMatches.map((m) => m[1] ?? "").join("");
      if (line.length > 0) {
        lines.push(line);
      }
    }
    const text = lines.join("\n").trim();
    if (text) return text;
  } catch {
    // Ignore
  }

  return "";
}
