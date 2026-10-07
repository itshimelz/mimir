import { describe, expect, it } from "vitest";

import {
  clampViewerScale,
  formatZoomPercent,
  nextViewerZoomScale,
  previousViewerZoomScale,
  resolveViewerScale,
  VIEWER_MAX_SCALE,
  VIEWER_MIN_SCALE,
} from "./viewerZoom";

const MARGIN = 24;

describe("clampViewerScale", () => {
  it("clamps to the min/max bounds", () => {
    expect(clampViewerScale(10)).toBe(VIEWER_MAX_SCALE);
    expect(clampViewerScale(0.01)).toBe(VIEWER_MIN_SCALE);
    expect(clampViewerScale(1.5)).toBe(1.5);
  });

  it("falls back to 1 for invalid input", () => {
    expect(clampViewerScale(Number.NaN)).toBe(1);
    expect(clampViewerScale(-3)).toBe(1);
    expect(clampViewerScale(0)).toBe(1);
  });
});

describe("resolveViewerScale", () => {
  const content = { width: 100, height: 200 };

  it("fits width using the usable container width minus margins", () => {
    // usable = 148 - 24*2 = 100; 100 / 100 = 1
    expect(
      resolveViewerScale({ type: "fit-width" }, content, { width: 148, height: 999 }, MARGIN),
    ).toBe(1);
  });

  it("fits the page to the smaller of width-fit and height-fit", () => {
    // fit-width = 1; usable height = 148 - 48 = 100; 100/200 = 0.5 -> min = 0.5
    expect(
      resolveViewerScale({ type: "fit-page" }, content, { width: 148, height: 148 }, MARGIN),
    ).toBe(0.5);
  });

  it("uses the explicit (clamped) scale for custom mode regardless of layout", () => {
    expect(resolveViewerScale({ type: "custom", scale: 2 }, null, null, MARGIN)).toBe(2);
    expect(
      resolveViewerScale(
        { type: "custom", scale: 99 },
        content,
        { width: 148, height: 148 },
        MARGIN,
      ),
    ).toBe(VIEWER_MAX_SCALE);
  });

  it("returns 1 when layout inputs are missing in a fit mode", () => {
    expect(resolveViewerScale({ type: "fit-width" }, null, null, MARGIN)).toBe(1);
    expect(resolveViewerScale({ type: "fit-page" }, content, null, MARGIN)).toBe(1);
  });
});

describe("zoom stepping", () => {
  it("steps up to the next preset", () => {
    expect(nextViewerZoomScale(1)).toBe(1.25);
    expect(nextViewerZoomScale(0.5)).toBe(0.75);
  });

  it("caps zoom-in at the max scale when above the last preset", () => {
    expect(nextViewerZoomScale(4)).toBe(VIEWER_MAX_SCALE);
  });

  it("steps down to the previous preset", () => {
    expect(previousViewerZoomScale(1)).toBe(0.75);
    expect(previousViewerZoomScale(4)).toBe(3);
  });

  it("floors zoom-out at the min scale when below the first preset", () => {
    expect(previousViewerZoomScale(0.5)).toBe(VIEWER_MIN_SCALE);
  });
});

describe("formatZoomPercent", () => {
  it("renders the scale as a whole-number percentage", () => {
    expect(formatZoomPercent(1)).toBe("100%");
    expect(formatZoomPercent(1.25)).toBe("125%");
    expect(formatZoomPercent(0.335)).toBe("34%");
  });
});
