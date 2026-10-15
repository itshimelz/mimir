import { describe, expect, it } from "vitest";

import {
  buildPptxShapeIndex,
  formatPptxShapeName,
  hitTestPptxShape,
  type PptxDocumentModel,
} from "./pptxShapes";

function shapeXml(props: {
  id: string;
  name: string;
  x: number;
  y: number;
  cx: number;
  cy: number;
}) {
  return {
    "p:nvSpPr": { "p:cNvPr": { attrs: { id: props.id, name: props.name } } },
    "p:spPr": {
      "a:xfrm": {
        "a:off": { attrs: { x: String(props.x), y: String(props.y) } },
        "a:ext": { attrs: { cx: String(props.cx), cy: String(props.cy) } },
      },
    },
  };
}

// OOXML keeps inter-word spacing inside the runs themselves, so the fixture
// passes runs verbatim: ["Five ", "design ", "levers"] is one paragraph.
function textBodyModel(paragraphs: ReadonlyArray<ReadonlyArray<string>>) {
  return {
    paragraphs: paragraphs.map((rows) => ({ rows: rows.map((text) => ({ text })) })),
  };
}

const deck: PptxDocumentModel = {
  width: 1000,
  height: 500,
  slides: [
    {
      name: "ppt/slides/slide1.xml",
      nodes: [
        {
          source: shapeXml({ id: "5", name: "Title 4", x: 100, y: 40, cx: 800, cy: 100 }),
          offset: { x: 100, y: 40 },
          extend: { w: 800, h: 100 },
          order: 1,
          textBody: textBodyModel([["Five ", "design ", "levers"]]),
        },
        {
          source: shapeXml({ id: "7", name: "Card 6", x: 100, y: 200, cx: 400, cy: 200 }),
          offset: { x: 100, y: 200 },
          extend: { w: 400, h: 200 },
          order: 2,
          textBody: textBodyModel([["Card ", "body"], ["Second line"]]),
        },
        {
          source: {
            "p:nvPicPr": { "p:cNvPr": { attrs: { id: "9", name: "Photo 8" } } },
            "p:blipFill": { "a:blip": { attrs: { "r:embed": "rId2" } } },
            "p:spPr": {
              "a:xfrm": {
                "a:off": { attrs: { x: "200", y: "210" } },
                "a:ext": { attrs: { cx: "100", cy: "100" } },
              },
            },
          },
          offset: { x: 200, y: 210 },
          extend: { w: 100, h: 100 },
          order: 3,
        },
      ],
    },
    {
      name: "ppt/slides/slide2.xml",
      nodes: [
        {
          source: {
            "p:nvGrpSpPr": { "p:cNvPr": { attrs: { id: "20", name: "Group 19" } } },
            "p:grpSpPr": {
              "a:xfrm": {
                "a:off": { attrs: { x: "0", y: "0" } },
                "a:ext": { attrs: { cx: "1000", cy: "500" } },
              },
            },
            "p:spPr": {
              "a:xfrm": {
                "a:off": { attrs: { x: "0", y: "0" } },
                "a:ext": { attrs: { cx: "1000", cy: "500" } },
              },
            },
          },
          offset: { x: 0, y: 0 },
          extend: { w: 1000, h: 500 },
          order: 0,
          nodes: [
            {
              source: shapeXml({ id: "21", name: "Nested 22", x: 10, y: 10, cx: 50, cy: 20 }),
              offset: { x: 10, y: 10 },
              extend: { w: 50, h: 20 },
              order: 1,
            },
          ],
        },
      ],
    },
  ],
};

describe("buildPptxShapeIndex", () => {
  const index = buildPptxShapeIndex(deck);

  it("indexes every slide, numbered from one", () => {
    expect(index.map((slide) => slide.slideNumber)).toEqual([1, 2]);
    expect(index[0]?.partName).toBe("ppt/slides/slide1.xml");
  });

  it("captures shape identity, text, and normalized bounds", () => {
    expect(index[0]?.shapes[0]).toMatchObject({
      shapeId: "5",
      name: "Title 4",
      text: "Five design levers",

      kind: "shape",
      order: 1,
      bounds: { x: 0.1, y: 0.08, width: 0.8, height: 0.2 },
    });
  });

  it("classifies pictures by their non-visual properties", () => {
    expect(index[0]?.shapes[2]).toMatchObject({ shapeId: "9", kind: "picture" });
  });

  it("recurses into groups so nested shapes stay addressable", () => {
    expect(index[1]?.shapes.map((shape) => shape.shapeId)).toEqual(["20", "21"]);
    expect(index[1]?.shapes[0]?.kind).toBe("group");
  });

  it("returns no slides for an unparsed deck instead of throwing", () => {
    expect(buildPptxShapeIndex(null)).toEqual([]);
    expect(buildPptxShapeIndex({})).toEqual([]);
    expect(buildPptxShapeIndex({ width: 0, height: 0, slides: [{}] })).toEqual([
      { slideNumber: 1, partName: null, shapes: [] },
    ]);
  });

  it("skips shapes with no area so they cannot swallow clicks", () => {
    const [slide] = buildPptxShapeIndex({
      width: 100,
      height: 100,
      slides: [
        {
          nodes: [
            {
              source: shapeXml({ id: "1", name: "Zero", x: 0, y: 0, cx: 0, cy: 0 }),
              offset: { x: 0, y: 0 },
              extend: { w: 0, h: 0 },
            },
          ],
        },
      ],
    });
    expect(slide?.shapes).toEqual([]);
  });
});

describe("hitTestPptxShape", () => {
  const slide = buildPptxShapeIndex(deck)[0];

  it("resolves a point to the topmost shape containing it", () => {
    // Inside "Card 6" but also inside the picture painted above it.
    expect(hitTestPptxShape(slide, { x: 0.25, y: 0.5 })?.shapeId).toBe("9");
  });

  it("falls back to the shape underneath when the topmost is missed", () => {
    // Same card, just right of the picture (which spans x 0.2-0.3).
    expect(hitTestPptxShape(slide, { x: 0.35, y: 0.45 })?.shapeId).toBe("7");
  });

  it("returns null for a point on empty slide", () => {
    expect(hitTestPptxShape(slide, { x: 0.95, y: 0.9 })).toBeNull();
  });

  it("tolerates a missing slide", () => {
    expect(hitTestPptxShape(null, { x: 0.5, y: 0.5 })).toBeNull();
    expect(hitTestPptxShape(undefined, { x: 0.5, y: 0.5 })).toBeNull();
  });
});

describe("formatPptxShapeName", () => {
  it("prefers the authored name and falls back to the shape category", () => {
    expect(formatPptxShapeName({ kind: "shape", name: "Title 4" })).toBe("Title 4");
    expect(formatPptxShapeName({ kind: "picture", name: "  " })).toBe("Picture");
    expect(formatPptxShapeName({ kind: "chart", name: "" })).toBe("Chart");
    expect(formatPptxShapeName({ kind: "shape", name: "" })).toBe("Shape");
  });
});
