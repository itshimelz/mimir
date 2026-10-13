// FILE: PptxPreview.browser.tsx
// Purpose: Browser regressions for the in-app PPTX viewer: switching decks must
//          not revive a destroyed previewer, a failed read must offer a reload and
//          notify its owner, zoom must re-render from cached bytes instead of
//          refetching, and a click on a slide shape must produce a
//          shape-anchored annotation.
// Layer: Focused component lifecycle tests

import "../index.css";

import { useState } from "react";
import { page as browserPage } from "vitest/browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { usePptxDocument } from "~/lib/pptx/usePptxDocument";
import type { PptxAnnotationDraft, PptxAnnotationSelection } from "~/lib/pptxAnnotations";
import { PptxFilePreview } from "./PptxFilePreview";

const { initMock, previewers } = vi.hoisted(() => {
  const created: Array<{
    destroy: ReturnType<typeof vi.fn>;
    slides: number;
    width: number;
    id: number;
  }> = [];
  // Mirrors the parts of the renderer the viewer actually depends on: a wrapper
  // per deck, one positioned element per slide, and a parsed model carrying each
  // slide's shape identity and bounds.
  const shapeXml = (id: string, name: string, x: number, y: number, cx: number, cy: number) => ({
    "p:nvSpPr": { "p:cNvPr": { attrs: { id, name } } },
    "p:spPr": {
      "a:xfrm": {
        "a:off": { attrs: { x: String(x), y: String(y) } },
        "a:ext": { attrs: { cx: String(cx), cy: String(cy) } },
      },
    },
  });
  const deckModel = {
    width: 1000,
    height: 500,
    slides: [
      {
        name: "ppt/slides/slide1.xml",
        nodes: [
          {
            source: shapeXml("5", "Title 4", 100, 50, 800, 100),
            offset: { x: 100, y: 50 },
            extend: { w: 800, h: 100 },
            order: 1,
          },
          {
            source: shapeXml("7", "Card 6", 100, 300, 400, 150),
            offset: { x: 100, y: 300 },
            extend: { w: 400, h: 150 },
            order: 2,
          },
        ],
      },
      { name: "ppt/slides/slide2.xml", nodes: [] },
      { name: "ppt/slides/slide3.xml", nodes: [] },
    ],
  };
  return {
    previewers: created,
    initMock: vi.fn((dom: HTMLElement, options: Record<string, unknown>) => {
      const id = created.length + 1;
      const destroy = vi.fn();
      const width = Number(options.width ?? 0);
      const slides = 3;
      created.push({ id, destroy, slides, width });
      const wrapper = dom.ownerDocument.createElement("div");
      wrapper.className = "pptx-preview-wrapper";
      dom.append(wrapper);
      for (let slide = 0; slide < slides; slide += 1) {
        const slideWrapper = dom.ownerDocument.createElement("div");
        slideWrapper.className = `pptx-preview-slide-wrapper pptx-preview-slide-wrapper-${slide}`;
        slideWrapper.style.width = `${width}px`;
        slideWrapper.style.height = `${(width * deckModel.height) / deckModel.width}px`;
        wrapper.append(slideWrapper);
      }
      return {
        pptx: deckModel,
        get slideCount() {
          return slides;
        },
        preview: () => Promise.resolve(),
        destroy: () => {
          destroy();
          // Real pptx-preview library does NOT remove its wrapper in destroy().
        },
      };
    }),
  };
});

vi.mock("pptx-preview", () => ({ init: initMock }));

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

function okResponse(): Response {
  return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
}

beforeEach(() => {
  fetchRequests = new Map();
  previewers.length = 0;
  initMock.mockClear();
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

describe("PPTX preview resource generations", () => {
  it("does not revive a destroyed deck after A -> B -> A", async () => {
    function PptxHarness() {
      const [url, setUrl] = useState("/a.pptx");
      const [host, setHost] = useState<HTMLDivElement | null>(null);
      const deck = usePptxDocument(url, host, 800);
      return (
        <>
          <button type="button" onClick={() => setUrl("/b.pptx")}>
            Show B
          </button>
          <button type="button" onClick={() => setUrl("/a.pptx")}>
            Show A
          </button>
          <div ref={setHost} />
          <output data-testid="pptx-state">{`${deck.status}:${deck.numSlides}`}</output>
        </>
      );
    }

    await render(<PptxHarness />);
    await vi.waitFor(() => expect(fetchRequests.get("/a.pptx")).toHaveLength(1));
    fetchRequests.get("/a.pptx")?.[0]?.resolve(okResponse());
    await vi.waitFor(() =>
      expect(document.querySelector('[data-testid="pptx-state"]')?.textContent).toBe("ready:3"),
    );
    const firstA = previewers[0]!;

    await browserPage.getByRole("button", { name: "Show B" }).click();
    await vi.waitFor(() => expect(firstA.destroy).toHaveBeenCalledOnce());
    await browserPage.getByRole("button", { name: "Show A" }).click();
    // B never resolves, so the only new previewer is A's second render — served
    // from the byte cache, without another fetch.
    await vi.waitFor(() => expect(previewers).toHaveLength(2));

    await vi.waitFor(() =>
      expect(document.querySelector('[data-testid="pptx-state"]')?.textContent).toBe("ready:3"),
    );
    expect(firstA.destroy).toHaveBeenCalledOnce();
    expect(fetchRequests.get("/a.pptx")).toHaveLength(1);
  });

  it("offers a reload after a read failure and requests a fresh resource", async () => {
    function PptxReloadHarness() {
      const [revision, setRevision] = useState(0);
      return (
        <PptxFilePreview
          filePath="deck.pptx"
          cwd="/repo"
          openInTarget={null}
          cacheKey={revision}
          onReload={() => setRevision((value) => value + 1)}
        />
      );
    }

    await render(<PptxReloadHarness />);
    await vi.waitFor(() => expect(fetchRequests.size).toBe(1));
    const initialUrl = [...fetchRequests.keys()][0]!;
    fetchRequests.get(initialUrl)?.[0]?.resolve(new Response(null, { status: 404 }));
    await browserPage.getByRole("button", { name: "Reload file from disk" }).click();
    await vi.waitFor(() => expect(fetchRequests.size).toBe(2));
    const urls = [...fetchRequests.keys()].map((url) => new URL(url, window.location.href));
    expect(urls.map((url) => url.searchParams.get("v"))).toEqual(["0", "1"]);
    expect(urls.map((url) => url.searchParams.get("path"))).toEqual(["deck.pptx", "deck.pptx"]);
  });

  it("reports a deck load failure to its preview owner", async () => {
    const onPreviewError = vi.fn();

    await render(
      <PptxFilePreview
        filePath="missing.pptx"
        cwd="/workspace"
        openInTarget={null}
        onPreviewError={onPreviewError}
      />,
    );
    await vi.waitFor(() => expect([...fetchRequests.values()].flat()).toHaveLength(1));
    [...fetchRequests.values()][0]?.[0]?.resolve(new Response(null, { status: 404 }));

    await vi.waitFor(() => expect(onPreviewError).toHaveBeenCalledOnce());
  });

  it("renders the deck with slide navigation once it parses", async () => {
    await render(<PptxFilePreview filePath="deck.pptx" cwd="/workspace" openInTarget={null} />);
    await vi.waitFor(() => expect([...fetchRequests.values()].flat()).toHaveLength(1));
    [...fetchRequests.values()][0]?.[0]?.resolve(okResponse());

    await vi.waitFor(() =>
      expect(document.querySelectorAll(".pptx-preview-slide-wrapper").length).toBe(3),
    );
    expect(document.body.textContent).toContain("/ 3");
    await browserPage.getByRole("button", { name: "Next slide" }).click();
    await vi.waitFor(() =>
      expect(document.querySelector<HTMLInputElement>('[aria-label="Current slide"]')?.value).toBe(
        "2",
      ),
    );
  });

  it("re-renders a zoomed deck from cached bytes without refetching", async () => {
    await render(<PptxFilePreview filePath="deck.pptx" cwd="/workspace" openInTarget={null} />);
    await vi.waitFor(() => expect([...fetchRequests.values()].flat()).toHaveLength(1));
    [...fetchRequests.values()][0]?.[0]?.resolve(okResponse());
    await vi.waitFor(() => expect(previewers).toHaveLength(1));
    const fitWidth = previewers[0]!.width;

    await browserPage.getByRole("button", { name: "Zoom in" }).click();
    await vi.waitFor(() => expect(previewers).toHaveLength(2));
    expect(previewers[1]!.width).toBeGreaterThan(fitWidth);
    expect([...fetchRequests.values()].flat()).toHaveLength(1);
    await vi.waitFor(() =>
      expect(document.querySelectorAll(".pptx-preview-slide-wrapper").length).toBe(3),
    );
  });
});

describe("PPTX shape annotations", () => {
  function PptxAnnotationHarness() {
    const [annotations, setAnnotations] = useState<PptxAnnotationDraft[]>([]);
    const [selection, setSelection] = useState<PptxAnnotationSelection | null>(null);
    return (
      <>
        <PptxFilePreview
          filePath="deck.pptx"
          cwd="/workspace"
          openInTarget={null}
          annotations={annotations}
          onAddAnnotation={(annotation) => {
            setSelection(annotation);
            setAnnotations((current) => [
              ...current,
              {
                ...annotation,
                id: `draft-${current.length + 1}`,
                capturedAt: new Date().toISOString(),
              },
            ]);
          }}
        />
        <output data-testid="annotation-selection">
          {selection === null ? "none" : JSON.stringify(selection)}
        </output>
      </>
    );
  }

  async function renderAnnotationHarness() {
    await render(<PptxAnnotationHarness />);
    await vi.waitFor(() => expect([...fetchRequests.values()].flat()).toHaveLength(1));
    [...fetchRequests.values()][0]?.[0]?.resolve(okResponse());
    await vi.waitFor(() =>
      expect(document.querySelectorAll(".pptx-preview-slide-wrapper").length).toBe(3),
    );
  }

  it("turns a click on a shape into a shape-anchored annotation", async () => {
    await renderAnnotationHarness();
    await browserPage.getByRole("button", { name: /Comment on a slide shape/ }).click();

    const layer = browserPage.getByTestId("pptx-annotate-layer-1");
    await expect.element(layer).toBeInTheDocument();
    // Shape bounds are normalized to the slide, so the click target is a fraction
    // of the rendered slide: "Card 6" spans y 0.6-0.9, "Title 4" spans 0.1-0.3.
    const layerRect = document
      .querySelector<HTMLElement>('[data-testid="pptx-annotate-layer-1"]')!
      .getBoundingClientRect();
    await layer.click({
      position: { x: layerRect.width * 0.2, y: layerRect.height * 0.75 },
    });

    const box = document.querySelector<HTMLTextAreaElement>(".local-comment__input");
    expect(box).not.toBeNull();
    expect(document.body.textContent).toContain("slide 1 · Card 6");

    await browserPage.getByPlaceholder("Request change").fill("Make this label bigger");
    await layer.getByRole("button", { name: "Comment" }).click();

    await vi.waitFor(() => {
      const selection = document.querySelector('[data-testid="annotation-selection"]')?.textContent;
      expect(selection).toContain('"shapeId":"7"');
      expect(selection).toContain('"slideNumber":1');
      expect(selection).toContain('"comment":"Make this label bigger"');
    });
    // The toolbar count reads from the same draft the harness holds, so the
    // armed toggle now reports one added comment.
    await vi.waitFor(() =>
      expect(
        browserPage.getByRole("button", { name: "Stop commenting on slides · 1 added" }),
      ).toBeInTheDocument(),
    );
  });

  it("keeps annotations off the DOM until annotate mode is armed", async () => {
    await renderAnnotationHarness();
    expect(document.querySelector('[data-testid="pptx-annotate-layer-1"]')).toBeNull();
  });
});
