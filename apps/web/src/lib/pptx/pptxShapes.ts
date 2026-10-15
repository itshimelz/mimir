// FILE: pptxShapes.ts
// Purpose: Turn the renderer's parsed slide model into a flat shape index — the
//          `p:cNvPr` id and name, placeholder type, text, z-order, and bounds
//          normalized to the slide — and hit-test a point against it. The
//          preview renders HTML, not an addressable object model, so a click
//          carries no identity of its own; this index is what turns "the user
//          clicked here" into "the user meant this shape".
// Layer: Web PPTX rendering utility
// Exports: shape index types, buildPptxShapeIndex, hitTestPptxShape, label helpers

/** Shape category as the preview's model reports it, coarsened for the UI. */
export type PptxShapeKind = "shape" | "picture" | "group" | "table" | "chart" | "diagram";

/** Bounds relative to the slide, 0..1 on both axes so they survive any zoom. */
export interface PptxShapeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PptxShapeRef {
  /** `p:cNvPr/@id`. Kept as the authored string; python-pptx matches on it. */
  shapeId: string;
  /** `p:cNvPr/@name` — what PowerPoint's selection pane shows. */
  name: string;
  /** `p:nvPr/p:ph/@type` when the shape fills a layout placeholder. */
  placeholder: string | null;
  /** Concatenated text of the shape's own text body (empty for pictures). */
  text: string;
  kind: PptxShapeKind;
  /** Render order within the slide; higher paints on top. */
  order: number;
  bounds: PptxShapeBounds;
}

export interface PptxSlideShapeIndex {
  /** 1-based slide number, matching both the toolbar and python-pptx indexing. */
  slideNumber: number;
  /** The slide part name, e.g. `ppt/slides/slide3.xml`, when the model exposes it. */
  partName: string | null;
  shapes: PptxShapeRef[];
}

interface PptxTextRunModel {
  text?: string;
  isBr?: boolean;
}

interface PptxParagraphModel {
  rows?: PptxTextRunModel[];
}

interface PptxTextBodyModel {
  paragraphs?: PptxParagraphModel[];
}

export interface PptxNodeModel {
  source?: unknown;
  offset?: { x?: number; y?: number };
  extend?: { w?: number; h?: number };
  order?: number;
  nodes?: PptxNodeModel[];
  textBody?: PptxTextBodyModel;
}

export interface PptxSlideModel {
  name?: string;
  nodes?: PptxNodeModel[];
}

export interface PptxDocumentModel {
  width?: number;
  height?: number;
  slides?: PptxSlideModel[];
}

/** Text kept per shape in the index; long bodies are truncated for context only. */
export const PPTX_SHAPE_TEXT_MAX_CHARS = 280;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function numberAt(source: object | null | undefined, key: string): number | null {
  const value = source ? (source as Record<string, unknown>)[key] : undefined;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringAt(source: object | null | undefined, key: string): string | null {
  const value = source ? (source as Record<string, unknown>)[key] : undefined;
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

/**
 * The parsed slide XML keeps its element tree keyed by tag name, so the
 * non-visual identity of a shape lives under whichever `p:nv*Pr` sibling the
 * element carries (`p:nvSpPr`, `p:nvPicPr`, `p:nvGrpSpPr`, …).
 */
function readShapeIdentity(source: unknown): { shapeId: string; name: string } | null {
  if (!isRecord(source)) {
    return null;
  }
  for (const [tag, value] of Object.entries(source)) {
    if (!tag.startsWith("p:nv") || !isRecord(value)) {
      continue;
    }
    const cNvPr = value["p:cNvPr"];
    if (!isRecord(cNvPr)) {
      continue;
    }
    const attrs = isRecord(cNvPr.attrs) ? cNvPr.attrs : undefined;
    const shapeId = stringAt(attrs, "id");
    if (shapeId === null) {
      continue;
    }
    return { shapeId, name: stringAt(attrs, "name") ?? "" };
  }
  return null;
}

function readPlaceholderType(source: unknown): string | null {
  if (!isRecord(source)) {
    return null;
  }
  for (const [tag, value] of Object.entries(source)) {
    if (!tag.startsWith("p:nv") || !isRecord(value)) {
      continue;
    }
    const nvPr = value["p:nvPr"];
    const ph = isRecord(nvPr) ? nvPr["p:ph"] : undefined;
    const attrs = isRecord(ph) && isRecord(ph.attrs) ? ph.attrs : undefined;
    const type = stringAt(attrs, "type");
    if (type !== null) {
      return type;
    }
  }
  return null;
}

function readShapeText(textBody: PptxTextBodyModel | undefined): string {
  const paragraphs = textBody?.paragraphs;
  if (!Array.isArray(paragraphs)) {
    return "";
  }
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const rows = Array.isArray(paragraph?.rows) ? paragraph.rows : [];
    let line = "";
    for (const row of rows) {
      if (row?.isBr === true) {
        lines.push(line);
        line = "";
        continue;
      }
      if (typeof row?.text === "string") {
        line += row.text;
      }
    }
    lines.push(line);
  }
  return lines.join("\n").replace(/\s+$/u, "").trim();
}

/**
 * The parsed source is the *contents* of one `p:spTree` child, so the element
 * type is read from the properties that element owns rather than from a tag:
 * groups carry a group-properties sibling, pictures a blip fill, and tables,
 * charts, and diagrams a graphic-data URI.
 */
function readShapeKind(source: Record<string, unknown>): PptxShapeKind {
  if (source["p:grpSpPr"] !== undefined) {
    return "group";
  }
  if (source["p:blipFill"] !== undefined) {
    return "picture";
  }
  const graphicData = readGraphicDataUri(source);
  if (graphicData?.endsWith("/table")) {
    return "table";
  }
  if (graphicData?.endsWith("/chart")) {
    return "chart";
  }
  if (graphicData?.endsWith("/diagram")) {
    return "diagram";
  }
  return "shape";
}

function readGraphicDataUri(source: Record<string, unknown>): string | null {
  const graphic = source["a:graphic"];
  const graphicData = isRecord(graphic) ? graphic["a:graphicData"] : undefined;
  const attrs =
    isRecord(graphicData) && isRecord(graphicData.attrs) ? graphicData.attrs : undefined;
  return stringAt(attrs, "uri");
}

function normalizeBounds(
  node: PptxNodeModel,
  slideWidth: number,
  slideHeight: number,
): PptxShapeBounds | null {
  const x = numberAt(node.offset, "x");
  const y = numberAt(node.offset, "y");
  const width = numberAt(node.extend, "w");
  const height = numberAt(node.extend, "h");
  if (x === null || y === null || width === null || height === null) {
    return null;
  }
  if (slideWidth <= 0 || slideHeight <= 0 || width <= 0 || height <= 0) {
    return null;
  }
  const left = Math.min(Math.max(x / slideWidth, 0), 1);
  const top = Math.min(Math.max(y / slideHeight, 0), 1);
  return {
    x: left,
    y: top,
    width: Math.min(Math.max(width / slideWidth, 0), 1 - left),
    height: Math.min(Math.max(height / slideHeight, 0), 1 - top),
  };
}

function collectShapes(
  nodes: readonly PptxNodeModel[] | undefined,
  slideWidth: number,
  slideHeight: number,
  shapes: PptxShapeRef[],
): void {
  if (!Array.isArray(nodes)) {
    return;
  }
  for (const node of nodes) {
    const source = isRecord(node?.source) ? node.source : undefined;
    if (!source) {
      continue;
    }
    const identity = readShapeIdentity(source);
    const bounds = normalizeBounds(node, slideWidth, slideHeight);
    if (identity && bounds) {
      const text = readShapeText(node.textBody);
      shapes.push({
        shapeId: identity.shapeId,
        name: identity.name,
        placeholder: readPlaceholderType(source),
        text: text.slice(0, PPTX_SHAPE_TEXT_MAX_CHARS),
        kind: readShapeKind(source),
        order: numberAt(node, "order") ?? 0,
        bounds,
      });
    }
    // Groups, charts, and diagrams own their children in the same model, and a
    // nested shape is as addressable as a top-level one.
    collectShapes(node.nodes, slideWidth, slideHeight, shapes);
  }
}

/**
 * Builds one shape index per slide. The renderer has already parsed the deck by
 * the time this runs, so no second ZIP/XML pass is needed; anything the model
 * cannot describe is simply absent from the index rather than guessed at.
 */
export function buildPptxShapeIndex(model: PptxDocumentModel | null): PptxSlideShapeIndex[] {
  const slideWidth = numberAt(model, "width") ?? 0;
  const slideHeight = numberAt(model, "height") ?? 0;
  const slides = Array.isArray(model?.slides) ? model.slides : [];
  return slides.map((slide, slideOffset) => {
    const shapes: PptxShapeRef[] = [];
    collectShapes(slide?.nodes, slideWidth, slideHeight, shapes);
    return {
      slideNumber: slideOffset + 1,
      partName: typeof slide?.name === "string" ? slide.name : null,
      shapes,
    };
  });
}

/**
 * The shape under a normalized slide point: the last one painted at or above it
 * in z-order, so a caption inside a card resolves to the caption and empty
 * space inside a card resolves to the card. Bounds are axis-aligned, which
 * ignores shape rotation — a rotated shape is still selectable through its
 * bounding box rather than becoming unclickable.
 */
export function hitTestPptxShape(
  slide: PptxSlideShapeIndex | null | undefined,
  point: { x: number; y: number },
): PptxShapeRef | null {
  const shapes = slide?.shapes;
  if (!shapes || shapes.length === 0) {
    return null;
  }
  let hit: PptxShapeRef | null = null;
  for (const shape of shapes) {
    const { x, y, width, height } = shape.bounds;
    const contains = point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height;
    if (!contains) {
      continue;
    }
    if (hit === null || shape.order >= hit.order) {
      hit = shape;
    }
  }
  return hit;
}

/** Short human label for a shape: its authored name, else its category. */
export function formatPptxShapeName(shape: Pick<PptxShapeRef, "kind" | "name">): string {
  if (shape.name.trim().length > 0) {
    return shape.name;
  }
  switch (shape.kind) {
    case "picture":
      return "Picture";
    case "table":
      return "Table";
    case "chart":
      return "Chart";
    case "diagram":
      return "Diagram";
    default:
      return "Shape";
  }
}
