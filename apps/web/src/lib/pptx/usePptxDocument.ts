// FILE: usePptxDocument.ts
// Purpose: React hook that fetches a .pptx's bytes from the allowlisted local-file
//          route and hands them to the pptx-preview renderer, which draws each
//          slide into a caller-owned container. Owns cancellation and teardown so
//          switching files never leaves a half-rendered deck or a live previewer
//          attached to a detached DOM node, and caches the bytes so a zoom
//          change re-renders without another round trip.
// Layer: Web PPTX rendering hook
// Exports: usePptxDocument, PptxDocumentState, MAX_PPTX_PREVIEW_BYTES

import { useEffect, useRef, useState } from "react";

import type { ViewerContentSize } from "../viewer/viewerZoom";
import {
  buildPptxShapeIndex,
  type PptxDocumentModel,
  type PptxSlideShapeIndex,
} from "./pptxShapes";

export type PptxDocumentStatus = "loading" | "ready" | "error";

export interface PptxDocumentState {
  status: PptxDocumentStatus;
  numSlides: number;
  /** Deck size in CSS px at scale 1, once the renderer has parsed it. */
  slideSize: ViewerContentSize | null;
  /** Per-slide shape identity and normalized bounds for annotation hit-testing. */
  slideShapes: PptxSlideShapeIndex[];
  error: string | null;
}

/**
 * Largest deck the viewer will read. A `.pptx` is a ZIP of XML, so the browser
 * holds the compressed file and every decompressed part at once; a cap keeps a
 * hostile or accidental multi-gigabyte file from freezing the tab.
 */
export const MAX_PPTX_PREVIEW_BYTES = 64 * 1024 * 1024;

/**
 * The subset of pptx-preview's surface this hook uses. Declared locally so the
 * dependency's shape is asserted in one place instead of leaking to call sites.
 */
interface PptxPreviewer {
  readonly slideCount: number;
  /**
   * The parsed deck. Its shape tree is the only addressable form of the slide
   * content — the renderer emits plain positioned DOM with no shape identity —
   * so annotations read their targets from here rather than from the pixels.
   */
  readonly pptx: PptxDocumentModel;
  preview(file: ArrayBuffer): Promise<unknown>;
  destroy(): void;
}

type PptxInit = (dom: HTMLElement, options: Record<string, unknown>) => PptxPreviewer;

interface PptxLoadState {
  url: string;
  /** Bumped on every visit, so A -> B -> A cannot revive A's stale render. */
  generation: number;
  state: PptxDocumentState;
}

const INITIAL_STATE: PptxDocumentState = {
  status: "loading",
  numSlides: 0,
  slideSize: null,
  slideShapes: [],
  error: null,
};

export function usePptxDocument(
  url: string,
  container: HTMLElement | null,
  /** Render width in CSS px; null until the scroll container is measured. */
  renderWidth: number | null,
): PptxDocumentState {
  const [storedLoad, setStoredLoad] = useState<PptxLoadState>(() => ({
    url,
    generation: 0,
    state: INITIAL_STATE,
  }));
  const load =
    storedLoad.url === url
      ? storedLoad
      : { url, generation: storedLoad.generation + 1, state: INITIAL_STATE };
  if (load !== storedLoad) {
    setStoredLoad(load);
  }

  // The previewer is imperative DOM that nothing renders from directly, so it
  // lives in a ref; only its parsed summary reaches React state.
  const previewerRef = useRef<PptxPreviewer | null>(null);
  // Deck bytes survive re-renders so a zoom change (which changes only the render
  // size) re-renders from memory instead of refetching the whole file.
  const bytesRef = useRef<{ url: string; bytes: ArrayBuffer } | null>(null);

  useEffect(() => {
    if (!container || !renderWidth) return;
    const session = { cancelled: false };
    const abortController = new AbortController();
    const generation = load.generation;

    void loadPptxIntoState(
      url,
      container,
      renderWidth,
      session,
      abortController,
      previewerRef,
      bytesRef,
      (next) => {
        setStoredLoad((current) =>
          current.url === url && current.generation === generation
            ? { ...current, state: next }
            : current,
        );
      },
    );

    return () => {
      session.cancelled = true;
      abortController.abort();
      destroyPreviewer(previewerRef);
    };
  }, [container, load.generation, renderWidth, url]);

  return load.state;
}

function destroyPreviewer(previewerRef: { current: PptxPreviewer | null }): void {
  const previewer = previewerRef.current;
  previewerRef.current = null;
  previewer?.destroy();
}

async function fetchPptxBytes(url: string, signal: AbortSignal): Promise<ArrayBuffer> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Failed to load presentation (${response.status})`);
  }
  const declaredBytes = Number(response.headers.get("content-length") ?? "");
  if (Number.isFinite(declaredBytes) && declaredBytes > MAX_PPTX_PREVIEW_BYTES) {
    throw new Error("This presentation is too large to preview in the app.");
  }
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > MAX_PPTX_PREVIEW_BYTES) {
    throw new Error("This presentation is too large to preview in the app.");
  }
  return bytes;
}

// Module-level so the try/catch stays outside the compiled hook body — React
// Compiler does not yet support try/catch and would otherwise skip optimizing
// the whole hook.
async function loadPptxIntoState(
  url: string,
  container: HTMLElement,
  renderWidth: number,
  session: { cancelled: boolean },
  abortController: AbortController,
  previewerRef: { current: PptxPreviewer | null },
  bytesRef: { current: { url: string; bytes: ArrayBuffer } | null },
  setState: (state: PptxDocumentState) => void,
): Promise<void> {
  try {
    const cached = bytesRef.current;
    let bytes: ArrayBuffer;
    if (cached && cached.url === url) {
      bytes = cached.bytes;
    } else {
      bytes = await fetchPptxBytes(url, abortController.signal);
      bytesRef.current = { url, bytes };
    }
    if (session.cancelled) return;

    const { init } = (await import("pptx-preview")) as unknown as { init: PptxInit };
    if (session.cancelled) return;

    // "list" renders every slide stacked into the container, so the deck scrolls
    // like the PDF viewer's page stack. The library's own "slide" mode injects
    // its own grey nav buttons and a `1/12` label, which would duplicate our
    // toolbar. It scales the deck to the width it is given, which is why zoom is
    // expressed as a render width rather than a page scale.
    const previewer = init(container, {
      width: Math.max(Math.round(renderWidth), 1),
      mode: "list",
    });
    previewerRef.current = previewer;
    // A copy every render: the renderer owns whatever buffer it is handed, so the
    // cached deck stays reusable across zoom changes.
    await previewer.preview(bytes.slice(0));
    if (session.cancelled) return;

    // A deck that parses to zero slides is a deck the renderer could not read
    // (every valid presentation has at least one). Reporting "ready" over an
    // empty pane would look like a rendering bug in the deck itself, so say what
    // actually happened instead.
    if (previewer.slideCount < 1) {
      throw new Error("No slides could be read from this presentation.");
    }

    setState({
      status: "ready",
      numSlides: previewer.slideCount,
      slideSize:
        typeof previewer.pptx?.width === "number" && typeof previewer.pptx?.height === "number"
          ? { width: previewer.pptx.width, height: previewer.pptx.height }
          : null,
      slideShapes: buildPptxShapeIndex(previewer.pptx ?? null),
      error: null,
    });
  } catch (error) {
    if (session.cancelled || abortController.signal.aborted) return;
    destroyPreviewer(previewerRef);
    setState({
      ...INITIAL_STATE,
      status: "error",
      error: error instanceof Error ? error.message : "Could not open this presentation.",
    });
  }
}
