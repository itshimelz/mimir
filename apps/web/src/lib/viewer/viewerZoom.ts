// FILE: viewerZoom.ts
// Purpose: Renderer-agnostic zoom math shared by the in-app document viewers
//          (PDF pages, PPTX slides) — preset scales, fit-width / fit-page
//          resolution against a measured scroll container, clamping, and
//          percentage formatting. Kept side-effect free so it is unit-testable
//          and shared by the shared toolbar control, the zoom controller, and
//          whichever renderer paints the content.
// Layer: Web viewer rendering utility
// Exports: zoom presets, scale resolution + step helpers, percentage formatting

export const VIEWER_MIN_SCALE = 0.25;
export const VIEWER_MAX_SCALE = 5;

/** Discrete zoom stops used by the +/- buttons and the dropdown percentages. */
export const VIEWER_ZOOM_PRESETS: readonly number[] = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4];

/**
 * How a viewer derives its render scale. `fit-width` / `fit-page` recompute on
 * container resize; `custom` pins an explicit scale chosen via the zoom controls.
 */
export type ViewerZoomMode =
  | { readonly type: "fit-width" }
  | { readonly type: "fit-page" }
  | { readonly type: "custom"; readonly scale: number };

/** Intrinsic content size in CSS px at scale 1 (PDF points, slide EMU/12700). */
export interface ViewerContentSize {
  readonly width: number;
  readonly height: number;
}

export interface ViewerViewportSize {
  readonly width: number;
  readonly height: number;
}

export function clampViewerScale(scale: number): number {
  if (!Number.isFinite(scale) || scale <= 0) {
    return 1;
  }
  return Math.min(VIEWER_MAX_SCALE, Math.max(VIEWER_MIN_SCALE, scale));
}

function fitWidthScale(
  content: ViewerContentSize,
  container: ViewerViewportSize,
  marginPx: number,
): number {
  const usable = container.width - marginPx * 2;
  if (usable <= 0 || content.width <= 0) {
    return 1;
  }
  return clampViewerScale(usable / content.width);
}

function fitPageScale(
  content: ViewerContentSize,
  container: ViewerViewportSize,
  marginPx: number,
): number {
  const usableHeight = container.height - marginPx * 2;
  if (usableHeight <= 0 || content.height <= 0) {
    return fitWidthScale(content, container, marginPx);
  }
  return clampViewerScale(
    Math.min(fitWidthScale(content, container, marginPx), usableHeight / content.height),
  );
}

/** Resolves a zoom mode to the concrete render scale for the current layout. */
export function resolveViewerScale(
  mode: ViewerZoomMode,
  content: ViewerContentSize | null,
  container: ViewerViewportSize | null,
  marginPx: number,
): number {
  if (mode.type === "custom") {
    return clampViewerScale(mode.scale);
  }
  if (!content || !container) {
    return 1;
  }
  return mode.type === "fit-page"
    ? fitPageScale(content, container, marginPx)
    : fitWidthScale(content, container, marginPx);
}

/** Next preset strictly above `scale` (for the zoom-in button). */
export function nextViewerZoomScale(scale: number): number {
  for (const preset of VIEWER_ZOOM_PRESETS) {
    if (preset > scale + 0.001) {
      return clampViewerScale(preset);
    }
  }
  return clampViewerScale(VIEWER_MAX_SCALE);
}

/** Previous preset strictly below `scale` (for the zoom-out button). */
export function previousViewerZoomScale(scale: number): number {
  for (let index = VIEWER_ZOOM_PRESETS.length - 1; index >= 0; index -= 1) {
    const preset = VIEWER_ZOOM_PRESETS[index];
    if (preset !== undefined && preset < scale - 0.001) {
      return clampViewerScale(preset);
    }
  }
  return clampViewerScale(VIEWER_MIN_SCALE);
}

export function formatZoomPercent(scale: number): string {
  return `${Math.round(scale * 100)}%`;
}
