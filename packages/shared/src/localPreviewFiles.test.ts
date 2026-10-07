// FILE: localPreviewFiles.test.ts
// Purpose: Locks the preview-file allowlist shared by the server's serving route
//          and the web client. A drift here would either 404 a file the UI can
//          render, or serve a type the client never asked for.
// Layer: Shared utility tests

import { describe, expect, it } from "vitest";

import {
  isSupportedLocalCanvasPath,
  isSupportedLocalImagePath,
  isSupportedLocalPdfPath,
  isSupportedLocalPptxPath,
  isSupportedLocalPreviewFilePath,
  SUPPORTED_LOCAL_IMAGE_EXTENSION_REGEX,
} from "./localPreviewFiles";

describe("local preview file allowlist", () => {
  it("accepts images, PDFs, .pptx decks, and .canvas files", () => {
    for (const previewable of [
      "diagram.png",
      "photo.JPEG",
      "report.pdf",
      "lecture.DECK.PPTX",
      "/Users/me/course/Outbox/quiz.pptx",
      "C:\\Users\\me\\deck.pptx",
      "mindmap.canvas",
      "FLOWCHART.CANVAS",
      "/workspace/notes/architecture.canvas",
    ]) {
      expect(isSupportedLocalPreviewFilePath(previewable), previewable).toBe(true);
    }
  });

  it("keeps the legacy binary .ppt format out of the preview allowlist", () => {
    // `.ppt` predates the ZIP/XML package, so the browser cannot read it; it must
    // keep falling through to the read-as-text path rather than 404ing.
    expect(isSupportedLocalPptxPath("slides.ppt")).toBe(false);
    expect(isSupportedLocalPreviewFilePath("slides.ppt")).toBe(false);
  });

  it("rejects other document and text types", () => {
    for (const rejected of [
      "notes.md",
      "script.ts",
      "deck.pptx.exe",
      "canvas.json",
      "archive.zip",
      "slides.pptx.bak",
      "noextension",
    ]) {
      expect(isSupportedLocalPreviewFilePath(rejected), rejected).toBe(false);
    }
  });

  it("separates the preview families", () => {
    expect(isSupportedLocalImagePath("chart.png")).toBe(true);
    expect(isSupportedLocalImagePath("report.pdf")).toBe(false);
    expect(isSupportedLocalPdfPath("deck.pptx")).toBe(false);
    expect(isSupportedLocalPptxPath("report.pdf")).toBe(false);
    expect(isSupportedLocalCanvasPath("flowchart.canvas")).toBe(true);
    expect(isSupportedLocalCanvasPath("flowchart.json")).toBe(false);
    expect(isSupportedLocalCanvasPath("deck.pptx")).toBe(false);
    expect(isSupportedLocalPptxPath("flowchart.canvas")).toBe(false);
  });

  it("keeps markdown image detection image-only", () => {
    // A `.pptx`, `.pdf`, or `.canvas` link in chat markdown must never be inlined as an <img>.
    expect(SUPPORTED_LOCAL_IMAGE_EXTENSION_REGEX.test("slide.pptx")).toBe(false);
    expect(SUPPORTED_LOCAL_IMAGE_EXTENSION_REGEX.test("report.pdf")).toBe(false);
    expect(SUPPORTED_LOCAL_IMAGE_EXTENSION_REGEX.test("board.canvas")).toBe(false);
    expect(SUPPORTED_LOCAL_IMAGE_EXTENSION_REGEX.test("chart.png")).toBe(true);
  });
});
