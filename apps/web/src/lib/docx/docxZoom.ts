// FILE: docxZoom.ts
// Purpose: DOCX-specific zoom geometry: breathing room kept around a page inside
//          the scroll area and scale resolution helpers.
// Layer: Web DOCX rendering utility
// Exports: DOCX_PAGE_MARGIN_PX, DEFAULT_DOCX_PAGE_SIZE, resolveDocxScale

import {
  resolveViewerScale,
  type ViewerContentSize,
  type ViewerViewportSize,
  type ViewerZoomMode,
} from "../viewer/viewerZoom";

/** Breathing room (CSS px) around pages inside the scroll area. */
export const DOCX_PAGE_MARGIN_PX = 24;

/** Standard Letter / A4 fallback page size at 96 DPI. */
export const DEFAULT_DOCX_PAGE_SIZE: ViewerContentSize = {
  width: 816,
  height: 1056,
};

export function resolveDocxScale(
  mode: ViewerZoomMode,
  page: ViewerContentSize | null,
  container: ViewerViewportSize | null,
): number {
  return resolveViewerScale(mode, page ?? DEFAULT_DOCX_PAGE_SIZE, container, DOCX_PAGE_MARGIN_PX);
}
