import { describe, expect, it } from "vitest";
import JSZip from "jszip";

import { extractPptxSpeakerNotes, parseNotesXmlText } from "./pptxNotes";

describe("pptxNotes", () => {
  it("parses notes XML text from standard body placeholder", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="2" name="Slide Image Placeholder 1"/>
          <p:nvPr><p:ph type="sldImg"/></p:nvPr>
        </p:nvSpPr>
      </p:sp>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="3" name="Notes Placeholder 2"/>
          <p:nvPr><p:ph type="body"/></p:nvPr>
        </p:nvSpPr>
        <p:txBody>
          <a:p>
            <a:r><a:t>Opening slide.</a:t></a:r>
            <a:r><a:t> The abstract cover art is an original illustration.</a:t></a:r>
          </a:p>
          <a:p>
            <a:r><a:t>Second paragraph note.</a:t></a:r>
          </a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:notes>`;

    const text = parseNotesXmlText(xml);
    expect(text).toBe(
      "Opening slide. The abstract cover art is an original illustration.\nSecond paragraph note.",
    );
  });

  it("extracts speaker notes across slides from zip archive", async () => {
    const zip = new JSZip();
    zip.file(
      "ppt/slides/_rels/slide1.xml.rels",
      `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide1.xml"/>
</Relationships>`,
    );
    zip.file(
      "ppt/notesSlides/notesSlide1.xml",
      `<p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:sp>
    <p:nvSpPr><p:cNvPr id="3" name="Notes"/><p:nvPr><p:ph type="body"/></p:nvPr></p:nvSpPr>
    <p:txBody><a:p><a:r><a:t>Slide 1 notes text.</a:t></a:r></a:p></p:txBody>
  </p:sp></p:spTree></p:cSld>
</p:notes>`,
    );

    const buffer = await zip.generateAsync({ type: "arraybuffer" });
    const notesMap = await extractPptxSpeakerNotes(buffer);

    expect(notesMap.size).toBe(1);
    expect(notesMap.get(1)).toBe("Slide 1 notes text.");
    expect(notesMap.get(2)).toBeUndefined();
  });
});
