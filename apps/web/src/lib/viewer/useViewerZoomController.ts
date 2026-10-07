// FILE: useViewerZoomController.ts
// Purpose: Own a document viewer's zoom state and the scale it resolves to for
//          the current layout. Handles the +/- steppers, explicit percentages,
//          and fit-width/fit-page modes, and re-anchors the reader's current
//          page/slide after a zoom-driven rescale so the content does not jump.
//          Shared by the PDF page stack and the PPTX slide stack.
// Layer: Web viewer rendering hook
// Exports: useViewerZoomController, ViewerZoomController

import { useEffect, useRef, useState } from "react";

import {
  clampViewerScale,
  nextViewerZoomScale,
  previousViewerZoomScale,
  resolveViewerScale,
  type ViewerContentSize,
  type ViewerViewportSize,
  type ViewerZoomMode,
} from "./viewerZoom";

export interface ViewerZoomController {
  zoomMode: ViewerZoomMode;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSetScale: (scale: number) => void;
  onFitWidth: () => void;
  onFitPage: () => void;
}

export function useViewerZoomController(input: {
  /** Intrinsic content size at scale 1, or null before the document is measured. */
  contentSize: ViewerContentSize | null;
  containerSize: ViewerViewportSize | null;
  /** Breathing room (CSS px) kept around the content inside the scroll area. */
  marginPx: number;
  /** The page/slide the reader is on, re-anchored after a user-initiated zoom. */
  currentPage: number;
  scrollToPage: (pageNumber: number, behavior: ScrollBehavior) => void;
}): ViewerZoomController {
  const { contentSize, containerSize, marginPx, currentPage, scrollToPage } = input;
  const [zoomMode, setZoomMode] = useState<ViewerZoomMode>({ type: "fit-width" });
  // When the user zooms we re-anchor to the page they were on so the content
  // does not jump; resize-driven rescales intentionally leave this unset.
  const restorePageRef = useRef<number | null>(null);

  const scale = resolveViewerScale(zoomMode, contentSize, containerSize, marginPx);

  // After a zoom-driven rescale, restore the anchored page instantly. This is a
  // one-way restore: it never feeds back into the scroll-position tracker.
  useEffect(() => {
    if (restorePageRef.current != null) {
      scrollToPage(restorePageRef.current, "auto");
      restorePageRef.current = null;
    }
  }, [scale, scrollToPage]);

  const anchorBeforeZoom = () => {
    restorePageRef.current = currentPage;
  };

  const onZoomIn = () => {
    anchorBeforeZoom();
    setZoomMode({ type: "custom", scale: nextViewerZoomScale(scale) });
  };

  const onZoomOut = () => {
    anchorBeforeZoom();
    setZoomMode({ type: "custom", scale: previousViewerZoomScale(scale) });
  };

  const onSetScale = (nextScale: number) => {
    anchorBeforeZoom();
    setZoomMode({ type: "custom", scale: clampViewerScale(nextScale) });
  };

  const onFitWidth = () => {
    anchorBeforeZoom();
    setZoomMode({ type: "fit-width" });
  };

  const onFitPage = () => {
    anchorBeforeZoom();
    setZoomMode({ type: "fit-page" });
  };

  return { zoomMode, scale, onZoomIn, onZoomOut, onSetScale, onFitWidth, onFitPage };
}
