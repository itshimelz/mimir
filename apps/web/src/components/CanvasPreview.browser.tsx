// FILE: CanvasPreview.browser.tsx
// Purpose: Component tests for CanvasFilePreview (.canvas files):
//          loading state, error handling, node/edge rendering, and toolbar controls.
// Layer: Focused component lifecycle tests

import "../index.css";

import { page as browserPage } from "vitest/browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { CanvasFilePreview } from "./CanvasFilePreview";

vi.mock("./chat/OpenInPicker", () => ({ OpenInPicker: () => null }));

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
}

let fetchRequests: Map<string, Deferred<Response>[]>;

beforeEach(() => {
  fetchRequests = new Map();
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      const request = deferred<Response>();
      const requests = fetchRequests.get(url) ?? [];
      requests.push(request);
      fetchRequests.set(url, requests);
      return request.promise;
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("CanvasFilePreview", () => {
  it("renders toolbar and nodes when canvas JSON is loaded", async () => {
    const ready = vi.fn();
    const error = vi.fn();

    await render(
      <CanvasFilePreview
        filePath="diagram.canvas"
        cwd="/workspace"
        openInTarget={null}
        onPreviewReady={ready}
        onPreviewError={error}
      />,
    );

    await vi.waitFor(() => {
      const requests = Array.from(fetchRequests.values()).flat();
      expect(requests.length).toBeGreaterThan(0);
    });

    const canvasJson = JSON.stringify({
      nodes: [
        {
          id: "node1",
          type: "text",
          x: 10,
          y: 10,
          width: 200,
          height: 100,
          text: "Architecture Spec",
        },
        {
          id: "node2",
          type: "link",
          x: 250,
          y: 10,
          width: 220,
          height: 80,
          url: "https://example.com",
        },
      ],
      edges: [{ id: "edge1", fromNode: "node1", toNode: "node2", label: "points to" }],
    });

    const requests = Array.from(fetchRequests.values()).flat();
    requests[0]!.resolve(
      new Response(canvasJson, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await vi.waitFor(() => {
      expect(ready).toHaveBeenCalled();
    });

    await vi.waitFor(() => {
      expect(browserPage.getByText("CANVAS")).toBeDefined();
      expect(browserPage.getByText("2 nodes · 1 edge")).toBeDefined();
      expect(browserPage.getByText("Architecture Spec")).toBeDefined();
    });
  });

  it("surfaces error state when loading fails", async () => {
    const ready = vi.fn();
    const error = vi.fn();

    await render(
      <CanvasFilePreview
        filePath="missing.canvas"
        cwd="/workspace"
        openInTarget={null}
        onPreviewReady={ready}
        onPreviewError={error}
      />,
    );

    await vi.waitFor(() => {
      const requests = Array.from(fetchRequests.values()).flat();
      expect(requests.length).toBeGreaterThan(0);
    });

    const requests = Array.from(fetchRequests.values()).flat();
    requests[0]!.resolve(
      new Response("Not Found", {
        status: 404,
        statusText: "Not Found",
      }),
    );

    await vi.waitFor(() => {
      expect(error).toHaveBeenCalled();
      expect(browserPage.getByText("Failed to load canvas (404 Not Found).")).toBeDefined();
    });
  });
});
