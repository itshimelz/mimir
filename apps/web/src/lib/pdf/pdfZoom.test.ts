import { describe, expect, it } from "vitest";

import { resolvePdfScale } from "./pdfZoom";
import { VIEWER_MAX_SCALE } from "../viewer/viewerZoom";

describe("resolvePdfScale", () => {
  const page = { width: 100, height: 200 };

  it("fits width using the usable container width minus margins", () => {
    // usable = 148 - 24*2 = 100; 100 / 100 = 1
    expect(resolvePdfScale({ type: "fit-width" }, page, { width: 148, height: 999 })).toBe(1);
  });

  it("fits page to the smaller of width-fit and height-fit", () => {
    // fit-width = 1; usable height = 148 - 48 = 100; 100/200 = 0.5 -> min = 0.5
    expect(resolvePdfScale({ type: "fit-page" }, page, { width: 148, height: 148 })).toBe(0.5);
  });

  it("uses the explicit (clamped) scale for custom mode regardless of layout", () => {
    expect(resolvePdfScale({ type: "custom", scale: 2 }, null, null)).toBe(2);
    expect(resolvePdfScale({ type: "custom", scale: 99 }, page, { width: 148, height: 148 })).toBe(
      VIEWER_MAX_SCALE,
    );
  });

  it("returns 1 when layout inputs are missing in a fit mode", () => {
    expect(resolvePdfScale({ type: "fit-width" }, null, null)).toBe(1);
    expect(resolvePdfScale({ type: "fit-page" }, page, null)).toBe(1);
  });
});
