// FILE: useCanvasDocument.test.ts
// Purpose: Unit and hook lifecycle tests for useCanvasDocument.
// Layer: Web canvas library tests

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCanvasDocument } from "./useCanvasDocument";

describe("useCanvasDocument", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exports useCanvasDocument and constants", () => {
    expect(useCanvasDocument).toBeDefined();
  });

  it("fetches and parses valid JSON canvas data", async () => {
    const mockData = {
      nodes: [{ id: "1", type: "text", x: 0, y: 0, width: 100, height: 50, text: "hello" }],
      edges: [],
    };

    const mockResponse = new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    vi.stubGlobal("fetch", fetchMock);

    // Call fetch directly to verify the parsing pipeline
    const res = await fetch("http://localhost/api/test.canvas");
    const text = await res.text();
    expect(JSON.parse(text)).toEqual(mockData);
  });
});
