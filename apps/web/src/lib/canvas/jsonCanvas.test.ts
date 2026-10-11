// FILE: jsonCanvas.test.ts
// Purpose: Unit tests for JSON Canvas parsing, color mappings, and geometry calculations.
// Layer: Web canvas library tests

import { describe, expect, it } from "vitest";

import {
  computeCanvasBounds,
  computeEdgePath,
  computeFitToView,
  getNodeAnchorPoint,
  inferNaturalSides,
  parseJsonCanvas,
  resolveCanvasColor,
  type CanvasData,
  type CanvasNode,
} from "./jsonCanvas";

describe("parseJsonCanvas", () => {
  it("rejects empty or whitespace inputs", () => {
    expect(parseJsonCanvas("").error).toBeTruthy();
    expect(parseJsonCanvas("   ").error).toBeTruthy();
  });

  it("rejects malformed JSON", () => {
    const res = parseJsonCanvas("{ nodes: [invalid] }");
    expect(res.data).toBeNull();
    expect(res.error).toContain("Invalid JSON Canvas file");
  });

  it("rejects non-object root", () => {
    const res = parseJsonCanvas("[]");
    expect(res.data).toBeNull();
    expect(res.error).toContain("Root must be a JSON object");
  });

  it("parses valid nodes of each type", () => {
    const raw = JSON.stringify({
      nodes: [
        {
          id: "text1",
          type: "text",
          x: 10,
          y: 20,
          width: 200,
          height: 100,
          text: "# Heading\nBody",
        },
        {
          id: "file1",
          type: "file",
          x: 250,
          y: 20,
          width: 180,
          height: 120,
          file: "docs/spec.md",
          subpath: "#section",
        },
        {
          id: "link1",
          type: "link",
          x: 450,
          y: 20,
          width: 220,
          height: 80,
          url: "https://jsoncanvas.org",
        },
        {
          id: "group1",
          type: "group",
          x: 0,
          y: 0,
          width: 700,
          height: 300,
          label: "Overview Group",
        },
      ],
      edges: [
        {
          id: "edge1",
          fromNode: "text1",
          toNode: "file1",
          fromSide: "right",
          toSide: "left",
          label: "references",
        },
      ],
    });

    const res = parseJsonCanvas(raw);
    expect(res.error).toBeNull();
    expect(res.data).not.toBeNull();
    const data = res.data as CanvasData;

    expect(data.nodes).toHaveLength(4);
    expect(data.nodes[0]).toEqual({
      id: "text1",
      type: "text",
      x: 10,
      y: 20,
      width: 200,
      height: 100,
      color: undefined,
      text: "# Heading\nBody",
    });
    expect(data.nodes[1]!.type).toBe("file");
    expect(data.nodes[2]!.type).toBe("link");
    expect(data.nodes[3]!.type).toBe("group");

    expect(data.edges).toHaveLength(1);
    expect(data.edges[0]!.fromNode).toBe("text1");
    expect(data.edges[0]!.toNode).toBe("file1");
    expect(data.edges[0]!.label).toBe("references");
    expect(data.edges[0]!.toEnd).toBe("arrow");
  });

  it("tolerates missing nodes or edges arrays", () => {
    const res1 = parseJsonCanvas(JSON.stringify({ nodes: [] }));
    expect(res1.error).toBeNull();
    expect(res1.data?.nodes).toEqual([]);
    expect(res1.data?.edges).toEqual([]);

    const res2 = parseJsonCanvas(JSON.stringify({ edges: [] }));
    expect(res2.error).toBeNull();
    expect(res2.data?.nodes).toEqual([]);
    expect(res2.data?.edges).toEqual([]);
  });

  it("skips nodes with missing id or invalid types", () => {
    const raw = JSON.stringify({
      nodes: [
        { id: "", type: "text", text: "no id" },
        { id: "valid", type: "text", text: "has id" },
        { id: "unknownType", type: "unsupported" },
      ],
    });
    const res = parseJsonCanvas(raw);
    expect(res.data?.nodes).toHaveLength(1);
    expect(res.data?.nodes[0]!.id).toBe("valid");
  });
});

describe("resolveCanvasColor", () => {
  it("resolves spec preset colors 1 through 6", () => {
    for (const preset of ["1", "2", "3", "4", "5", "6"]) {
      const resolved = resolveCanvasColor(preset);
      expect(resolved).not.toBeNull();
      expect(resolved?.border).toBeTruthy();
      expect(resolved?.accent).toBeTruthy();
    }
  });

  it("resolves valid hex colors", () => {
    const resolved = resolveCanvasColor("#3b82f6");
    expect(resolved).not.toBeNull();
    expect(resolved?.border).toBe("#3b82f6");
    expect(resolved?.accent).toBe("#3b82f6");
  });

  it("returns null for invalid or missing colors", () => {
    expect(resolveCanvasColor(undefined)).toBeNull();
    expect(resolveCanvasColor("")).toBeNull();
    expect(resolveCanvasColor("invalid-color")).toBeNull();
  });
});

describe("geometry and routing", () => {
  const nodeA: CanvasNode = {
    id: "a",
    type: "text",
    x: 100,
    y: 100,
    width: 200,
    height: 100,
    text: "A",
  };
  const nodeB: CanvasNode = {
    id: "b",
    type: "text",
    x: 500,
    y: 100,
    width: 200,
    height: 100,
    text: "B",
  };

  it("calculates anchor points correctly", () => {
    expect(getNodeAnchorPoint(nodeA, "top")).toEqual({ x: 200, y: 100 });
    expect(getNodeAnchorPoint(nodeA, "bottom")).toEqual({ x: 200, y: 200 });
    expect(getNodeAnchorPoint(nodeA, "left")).toEqual({ x: 100, y: 150 });
    expect(getNodeAnchorPoint(nodeA, "right")).toEqual({ x: 300, y: 150 });
  });

  it("infers natural sides when horizontal", () => {
    const sides = inferNaturalSides(nodeA, nodeB);
    expect(sides).toEqual({ fromSide: "right", toSide: "left" });
  });

  it("computes cubic bezier path between two nodes", () => {
    const edge = { id: "e1", fromNode: "a", toNode: "b" };
    const res = computeEdgePath(nodeA, nodeB, edge);
    expect(res.path).toMatch(/^M 300 150 C \d+ 150, \d+ 150, 500 150$/);
    expect(res.labelPoint.x).toBeGreaterThan(300);
    expect(res.labelPoint.x).toBeLessThan(500);
    expect(res.labelPoint.y).toBe(150);
  });

  it("computes bounding box with padding", () => {
    const bounds = computeCanvasBounds([nodeA, nodeB], 50);
    expect(bounds.minX).toBe(100 - 50);
    expect(bounds.minY).toBe(100 - 50);
    expect(bounds.maxX).toBe(700 + 50);
    expect(bounds.maxY).toBe(200 + 50);
  });

  it("computes fit to view correctly", () => {
    const bounds = computeCanvasBounds([nodeA, nodeB], 0);
    // bounds width = 600 (from 100 to 700), height = 100 (from 100 to 200)
    const viewport = { width: 1200, height: 600 };
    const fit = computeFitToView(bounds, viewport);
    expect(fit.scale).toBeGreaterThan(0);
    expect(fit.scale).toBeLessThanOrEqual(1.75);
    expect(Number.isFinite(fit.panX)).toBe(true);
    expect(Number.isFinite(fit.panY)).toBe(true);
  });
});
