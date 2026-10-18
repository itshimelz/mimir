// FILE: localPreviewFiles.ts
// Purpose: Single source of truth for the /api/local-image route shape consumed by
//          both the server (HTTP route + filesystem allowlist) and the web client
//          (URL builder + markdown image source detection). The route serves every
//          allowlisted preview file: images (rendered via <img>), PDFs (rendered by
//          pdf.js), and .pptx presentations (unzipped and drawn in the browser).
// Layer: Shared utility (no runtime dependencies)
// Exports: route path, preview-file extension allowlists, and helper predicates
//          derived from them.

export const LOCAL_IMAGE_ROUTE_PATH = "/api/local-image" as const;

// Lower-case extensions (with leading dot) that the server is willing to serve and
// the web client is willing to treat as local-image markdown sources. Keep these in
// sync with the MIME allowlist used elsewhere; this list is the canonical answer.
export const SUPPORTED_LOCAL_IMAGE_EXTENSIONS = [
  ".avif",
  ".bmp",
  ".gif",
  ".heic",
  ".heif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".tiff",
  ".webp",
] as const;

const SUPPORTED_LOCAL_IMAGE_EXTENSIONS_SET: ReadonlySet<string> = new Set(
  SUPPORTED_LOCAL_IMAGE_EXTENSIONS,
);

/** Lower-cased extension (with leading dot) of a path, or null when there is none. */
export function lowerCaseExtensionOf(filePath: string): string | null {
  const dot = filePath.lastIndexOf(".");
  if (dot < 0) return null;
  return filePath.slice(dot).toLowerCase();
}

export function isSupportedLocalImagePath(filePath: string): boolean {
  const extension = lowerCaseExtensionOf(filePath);
  return extension !== null && SUPPORTED_LOCAL_IMAGE_EXTENSIONS_SET.has(extension);
}

export const SUPPORTED_LOCAL_PDF_EXTENSION = ".pdf" as const;

export function isSupportedLocalPdfPath(filePath: string): boolean {
  return lowerCaseExtensionOf(filePath) === SUPPORTED_LOCAL_PDF_EXTENSION;
}

/**
 * PowerPoint presentations. Only the OOXML `.pptx` container is previewable: the
 * legacy binary `.ppt` format predates the ZIP/XML package and cannot be read in
 * the browser, so it stays out of this list and keeps its read-as-text path.
 */
export const SUPPORTED_LOCAL_PPTX_EXTENSIONS = [".pptx"] as const;

const SUPPORTED_LOCAL_PPTX_EXTENSIONS_SET: ReadonlySet<string> = new Set(
  SUPPORTED_LOCAL_PPTX_EXTENSIONS,
);

export function isSupportedLocalPptxPath(filePath: string): boolean {
  const extension = lowerCaseExtensionOf(filePath);
  return extension !== null && SUPPORTED_LOCAL_PPTX_EXTENSIONS_SET.has(extension);
}

/**
 * JSON Canvas files (.canvas) following the open specification (jsoncanvas.org).
 */
export const SUPPORTED_LOCAL_CANVAS_EXTENSIONS = [".canvas"] as const;

const SUPPORTED_LOCAL_CANVAS_EXTENSIONS_SET: ReadonlySet<string> = new Set(
  SUPPORTED_LOCAL_CANVAS_EXTENSIONS,
);

export function isSupportedLocalCanvasPath(filePath: string): boolean {
  const extension = lowerCaseExtensionOf(filePath);
  return extension !== null && SUPPORTED_LOCAL_CANVAS_EXTENSIONS_SET.has(extension);
}

/**
 * Word documents. Only the OOXML `.docx` container is previewable: the legacy
 * binary `.doc` format predates the ZIP/XML package and cannot be read in the
 * browser, so it stays out of this list and keeps its read-as-text path.
 */
export const SUPPORTED_LOCAL_DOCX_EXTENSIONS = [".docx"] as const;

const SUPPORTED_LOCAL_DOCX_EXTENSIONS_SET: ReadonlySet<string> = new Set(
  SUPPORTED_LOCAL_DOCX_EXTENSIONS,
);

export function isSupportedLocalDocxPath(filePath: string): boolean {
  const extension = lowerCaseExtensionOf(filePath);
  return extension !== null && SUPPORTED_LOCAL_DOCX_EXTENSIONS_SET.has(extension);
}

// Full allowlist for the /api/local-image serving route. Markdown image source
// detection (below) intentionally stays image-only: a `.pdf` link in chat
// markdown must never be inlined as an <img>.
export function isSupportedLocalPreviewFilePath(filePath: string): boolean {
  return (
    isSupportedLocalImagePath(filePath) ||
    isSupportedLocalPdfPath(filePath) ||
    isSupportedLocalPptxPath(filePath) ||
    isSupportedLocalDocxPath(filePath) ||
    isSupportedLocalCanvasPath(filePath)
  );
}

// Built from the canonical extensions list so the web regex never drifts from the
// server allowlist. Anchored at end-of-string to match `.png`-style suffixes only.
export const SUPPORTED_LOCAL_IMAGE_EXTENSION_REGEX: RegExp = (() => {
  const escaped = SUPPORTED_LOCAL_IMAGE_EXTENSIONS.map((extension) =>
    extension.slice(1).replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  return new RegExp(`\\.(?:${escaped.join("|")})$`, "i");
})();
