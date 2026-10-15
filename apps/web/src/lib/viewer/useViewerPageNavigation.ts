// FILE: useViewerPageNavigation.ts
// Purpose: Own a stacked document viewer's page<->scroll relationship: a
//          registry of page elements, scroll-to / jump-to helpers, and the
//          rAF-throttled tracker that reports the page the reader is currently
//          on. Shared by the PDF page stack and the PPTX slide stack, where
//          pages are 1-based.
// Layer: Web viewer rendering hook
// Exports: useViewerPageNavigation, ViewerPageNavigation

import { useCallback, useEffect, useRef, useState } from "react";

// The current page is the last one whose top has scrolled above this fraction
// of the viewport height (a line 25% down from the top of the scroll area).
const CURRENT_PAGE_PROBE_RATIO = 0.25;

export interface ViewerPageNavigation {
  currentPage: number;
  registerElement: (pageNumber: number, element: HTMLElement | null) => void;
  jumpToPage: (pageNumber: number) => void;
  scrollToPage: (pageNumber: number, behavior: ScrollBehavior) => void;
}

interface CurrentPageState {
  resetKey: unknown;
  page: number;
}

export function useViewerPageNavigation(input: {
  scrollRoot: HTMLElement | null;
  numPages: number;
  enabled: boolean;
  resetKey: unknown;
  /** Breathing room (CSS px) kept above a page when scrolling it into view. */
  marginPx: number;
}): ViewerPageNavigation {
  const { scrollRoot, numPages, enabled, resetKey, marginPx } = input;
  const [currentPageState, setCurrentPageState] = useState<CurrentPageState>({
    resetKey,
    page: 1,
  });
  const currentPage = Object.is(currentPageState.resetKey, resetKey) ? currentPageState.page : 1;
  const pageElementsRef = useRef(new Map<number, HTMLElement>());
  // Mirrored so scrollToPage keeps a stable identity across renders: the zoom
  // controller's re-anchor effect depends on it, and a fresh function each render
  // would re-run that effect forever.
  const scrollRootRef = useRef<HTMLElement | null>(scrollRoot);
  scrollRootRef.current = scrollRoot;

  const registerElement = useCallback((pageNumber: number, element: HTMLElement | null) => {
    if (element) {
      pageElementsRef.current.set(pageNumber, element);
    } else {
      pageElementsRef.current.delete(pageNumber);
    }
  }, []);

  const scrollToPage = useCallback(
    (pageNumber: number, behavior: ScrollBehavior) => {
      const container = scrollRootRef.current;
      const element = pageElementsRef.current.get(pageNumber);
      if (!container || !element) {
        return;
      }
      const top =
        element.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop -
        marginPx;
      container.scrollTo({ top, behavior });
    },
    [marginPx],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }
    // A new document should start at the top even when React reuses the same
    // viewer pane, otherwise stale scroll state can survive across files. The
    // page number itself derives from the resetKey guard above — no reset needed.
    scrollRoot?.scrollTo({ top: 0, behavior: "auto" });
  }, [enabled, numPages, resetKey, scrollRoot]);

  const jumpToPage = (pageNumber: number) => {
    const clamped = Math.min(Math.max(pageNumber, 1), Math.max(numPages, 1));
    setCurrentPageState({ resetKey, page: clamped });
    scrollToPage(clamped, "smooth");
  };

  // Track the page the reader is on from scroll position (rAF-throttled). Pages
  // stack top-to-bottom, so their tops are monotonic in page order: we scan
  // ascending and stop at the first page below the probe line, making each
  // frame O(currentPage) rather than O(numPages).
  useEffect(() => {
    const container = scrollRoot;
    if (!container || !enabled) {
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const containerTop = container.getBoundingClientRect().top;
      const probe = containerTop + container.clientHeight * CURRENT_PAGE_PROBE_RATIO;
      let nextPage = 1;
      for (let pageNumber = 1; pageNumber <= numPages; pageNumber += 1) {
        const element = pageElementsRef.current.get(pageNumber);
        if (!element) {
          continue;
        }
        if (element.getBoundingClientRect().top <= probe) {
          nextPage = pageNumber;
        } else {
          break;
        }
      }
      setCurrentPageState({ resetKey, page: nextPage });
    };
    const onScroll = () => {
      if (frame === 0) {
        frame = requestAnimationFrame(update);
      }
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      if (frame !== 0) {
        cancelAnimationFrame(frame);
      }
    };
  }, [enabled, numPages, resetKey, scrollRoot]);

  return { currentPage, registerElement, jumpToPage, scrollToPage };
}
