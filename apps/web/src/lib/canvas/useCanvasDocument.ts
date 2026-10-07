// FILE: useCanvasDocument.ts
// Purpose: React hook that fetches a .canvas file from the local preview route,
//          validates and parses it according to the JSON Canvas 1.0 specification,
//          and maintains loading/ready/error state with abort handling.
// Layer: Web canvas rendering hook
// Exports: useCanvasDocument, CanvasDocumentStatus, CanvasDocumentState

import { useEffect, useState } from "react";

import { parseJsonCanvas, type CanvasData } from "./jsonCanvas";

export type CanvasDocumentStatus = "loading" | "ready" | "error";

export interface CanvasDocumentState {
  status: CanvasDocumentStatus;
  data: CanvasData | null;
  rawJson: string | null;
  error: string | null;
}

/**
 * Largest .canvas file the viewer will parse (16 MB cap).
 */
export const MAX_CANVAS_PREVIEW_BYTES = 16 * 1024 * 1024;

interface CanvasLoadState {
  url: string;
  generation: number;
  state: CanvasDocumentState;
}

const INITIAL_STATE: CanvasDocumentState = {
  status: "loading",
  data: null,
  rawJson: null,
  error: null,
};

export function useCanvasDocument(url: string): CanvasDocumentState {
  const [storedLoad, setStoredLoad] = useState<CanvasLoadState>(() => ({
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

  useEffect(() => {
    let cancelled = false;
    const abortController = new AbortController();
    const generation = load.generation;

    async function fetchAndParse() {
      try {
        const response = await fetch(url, { signal: abortController.signal });
        if (!response.ok) {
          if (!cancelled) {
            setStoredLoad((current) =>
              current.url === url && current.generation === generation
                ? {
                    ...current,
                    state: {
                      status: "error",
                      data: null,
                      rawJson: null,
                      error: `Failed to load canvas (${response.status} ${response.statusText}).`,
                    },
                  }
                : current,
            );
          }
          return;
        }

        const contentLength = response.headers.get("content-length");
        if (contentLength && Number(contentLength) > MAX_CANVAS_PREVIEW_BYTES) {
          if (!cancelled) {
            setStoredLoad((current) =>
              current.url === url && current.generation === generation
                ? {
                    ...current,
                    state: {
                      status: "error",
                      data: null,
                      rawJson: null,
                      error: `Canvas file is too large to preview (> ${MAX_CANVAS_PREVIEW_BYTES / (1024 * 1024)}MB).`,
                    },
                  }
                : current,
            );
          }
          return;
        }

        const text = await response.text();
        if (cancelled) return;

        const parseResult = parseJsonCanvas(text);
        if (parseResult.error || !parseResult.data) {
          setStoredLoad((current) =>
            current.url === url && current.generation === generation
              ? {
                  ...current,
                  state: {
                    status: "error",
                    data: null,
                    rawJson: text,
                    error: parseResult.error ?? "Failed to parse canvas.",
                  },
                }
              : current,
          );
          return;
        }

        setStoredLoad((current) =>
          current.url === url && current.generation === generation
            ? {
                ...current,
                state: {
                  status: "ready",
                  data: parseResult.data,
                  rawJson: text,
                  error: null,
                },
              }
            : current,
        );
      } catch (err) {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Failed to load canvas";
        setStoredLoad((current) =>
          current.url === url && current.generation === generation
            ? {
                ...current,
                state: {
                  status: "error",
                  data: null,
                  rawJson: null,
                  error: message,
                },
              }
            : current,
        );
      }
    }

    void fetchAndParse();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [load.generation, url]);

  return load.state;
}
