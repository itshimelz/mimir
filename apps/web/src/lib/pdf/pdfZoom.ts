// FILE: pdfZoom.ts
// Purpose: PDF-specific zoom geometry: the breathing room a page keeps inside
//          the scroll area and the fit-to-width / fit-to-page resolution that
//          turns a page's intrinsic size into a render scale. The scale
//          algebra itself (presets, clamping, stepping) is shared with the
//          PPTX viewer in ~/lib/viewer/viewerZoom.
// Layer: Web PDF rendering utility
// Exports: page margin, PDF scale resolution

import {
  resolveViewerScale,
  type ViewerContentSize,
  type ViewerViewportSize,
  type ViewerZoomMode,
} from "../viewer/viewerZoom";

/** Horizontal/vertical breathing room (CSS px) around a page inside the scroll area. */
export const PDF_PAGE_MARGIN_PX = 24;

/** Resolves a zoom mode to the concrete render scale for the current layout. */
export function resolvePdfScale(
  mode: ViewerZoomMode,
  page: ViewerContentSize | null,
  container: ViewerViewportSize | null,
): number {
  return resolveViewerScale(mode, page, container, PDF_PAGE_MARGIN_PX);
}
