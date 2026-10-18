// FILE: useDocxDocument.ts
// Purpose: React hook that fetches a .docx file's bytes and parses the OpenXML
//          package with docx-preview. Supports dual-layer rendering (clean vs
//          redlines / tracked changes), lazy redlines compilation, link sanitization,
//          page geometry, and memory capping to match the ChatGPT desktop docx experience.
// Layer: Web DOCX rendering hook
// Exports: useDocxDocument, DocxDocumentState, MAX_DOCX_PREVIEW_BYTES, detectDocxRedlines

import { useEffect, useRef, useState } from "react";
import type { ViewerContentSize } from "../viewer/viewerZoom";
import { DEFAULT_DOCX_PAGE_SIZE } from "./docxZoom";

export type DocxDocumentStatus = "loading" | "ready" | "error";

export interface DocxDocumentState {
  status: DocxDocumentStatus;
  numPages: number;
  pageSize: ViewerContentSize | null;
  /** True when the document contains tracked revisions (insertions, deletions). */
  hasRedlines: boolean;
  error: string | null;
}

/**
 * Largest docx the viewer will load. A .docx is a compressed ZIP of XML parts;
 * a 64MB cap prevents hostile or accidental gigabyte-scale documents from
 * freezing the tab.
 */
export const MAX_DOCX_PREVIEW_BYTES = 64 * 1024 * 1024;

export const DOCX_PREVIEW_CLASS_NAME = "mimir-docx-preview";

interface DocxLoadState {
  url: string;
  generation: number;
  state: DocxDocumentState;
}

const INITIAL_STATE: DocxDocumentState = {
  status: "loading",
  numPages: 1,
  pageSize: null,
  hasRedlines: false,
  error: null,
};

/**
 * Checks whether the parsed docx AST contains tracked revisions (redlines).
 */
export function detectDocxRedlines(doc: unknown): boolean {
  if (!doc || typeof doc !== "object") return false;
  const parts = (doc as { parts?: unknown[] }).parts;
  if (!Array.isArray(parts)) return false;

  const checkElement = (el: unknown): boolean => {
    if (!el || typeof el !== "object") return false;
    if (Array.isArray(el)) return el.some(checkElement);
    const item = el as { type?: string; children?: unknown[] };
    if (item.type === "inserted" || item.type === "deleted" || item.type === "deletedText") {
      return true;
    }
    if (Array.isArray(item.children)) {
      return item.children.some(checkElement);
    }
    return false;
  };

  for (const part of parts) {
    if (!part || typeof part !== "object") continue;
    const p = part as { body?: unknown; rootElement?: unknown; notes?: unknown[] };
    if (checkElement(p.body) || checkElement(p.rootElement)) return true;
    if (Array.isArray(p.notes) && p.notes.some(checkElement)) return true;
  }
  return false;
}

/**
 * Security pass: sanitizes all anchor tags in the rendered document so that
 * only legitimate http/https links can navigate, preventing javascript: or file:
 * injection.
 */
export function sanitizeDocxLinks(container: HTMLElement): void {
  for (const a of container.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href");
    if (href) {
      try {
        const protocol = new URL(href, window.location.href).protocol;
        if (protocol === "http:" || protocol === "https:") {
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener noreferrer");
          continue;
        }
      } catch {
        // Discard malformed URLs
      }
      a.removeAttribute("href");
    }
  }
}

const BASE_DOCX_OPTIONS = {
  className: DOCX_PREVIEW_CLASS_NAME,
  inWrapper: true,
  ignoreHeight: false,
  ignoreWidth: false,
  ignoreFonts: false,
  breakPages: true,
  debug: false,
  experimental: false,
  hideWrapperOnPrint: false,
  trimXmlDeclaration: true,
  ignoreLastRenderedPageBreak: true,
  renderHeaders: true,
  renderFooters: true,
  renderFootnotes: true,
  renderEndnotes: true,
  renderAltChunks: true,
  useBase64URL: true,
};

export interface UseDocxDocumentInput {
  url: string;
  cleanContainer: HTMLElement | null;
  redlinesContainer: HTMLElement | null;
  showRedlines?: boolean;
}

export function useDocxDocument(input: UseDocxDocumentInput): DocxDocumentState {
  const { url, cleanContainer, redlinesContainer, showRedlines } = input;

  const [storedLoad, setStoredLoad] = useState<DocxLoadState>(() => ({
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

  const bytesRef = useRef<{ url: string; bytes: ArrayBuffer } | null>(null);
  const parsedDocRef = useRef<{ url: string; doc: unknown } | null>(null);
  const redlinesRenderedRef = useRef(false);

  // 1. Fetch bytes, parse OpenXML AST, and render clean container
  useEffect(() => {
    const session = { cancelled: false };
    const abortController = new AbortController();
    const generation = load.generation;
    redlinesRenderedRef.current = false;

    void (async () => {
      try {
        let bytes: ArrayBuffer;
        const cachedBytes = bytesRef.current;
        if (cachedBytes && cachedBytes.url === url) {
          bytes = cachedBytes.bytes;
        } else {
          const response = await fetch(url, { signal: abortController.signal });
          if (!response.ok) {
            throw new Error(`Failed to load document (${response.status})`);
          }
          const declaredBytes = Number(response.headers.get("content-length") ?? "");
          if (Number.isFinite(declaredBytes) && declaredBytes > MAX_DOCX_PREVIEW_BYTES) {
            throw new Error("This document is too large to preview in the app.");
          }
          bytes = await response.arrayBuffer();
          if (bytes.byteLength > MAX_DOCX_PREVIEW_BYTES) {
            throw new Error("This document is too large to preview in the app.");
          }
          bytesRef.current = { url, bytes };
        }

        if (session.cancelled) return;

        // Dynamically import docx-preview so it is completely code-split
        const docx = await import("docx-preview");
        if (session.cancelled) return;

        // Parse once into AST
        let parsedDoc: unknown;
        const cachedDoc = parsedDocRef.current;
        if (cachedDoc && cachedDoc.url === url) {
          parsedDoc = cachedDoc.doc;
        } else {
          parsedDoc = await docx.parseAsync(bytes, BASE_DOCX_OPTIONS);
          parsedDocRef.current = { url, doc: parsedDoc };
        }
        if (session.cancelled) return;

        const hasRedlines = detectDocxRedlines(parsedDoc);

        // Render clean version if container is mounted
        if (cleanContainer) {
          const cleanNodes = await docx.renderDocument(parsedDoc, {
            ...BASE_DOCX_OPTIONS,
            renderChanges: false,
          });
          if (session.cancelled) return;

          cleanContainer.replaceChildren();
          for (const node of cleanNodes) {
            cleanContainer.appendChild(node);
          }
          sanitizeDocxLinks(cleanContainer);
        }

        // Measure page count and size from cleanContainer
        let numPages = 1;
        let pageSize: ViewerContentSize | null = null;
        if (cleanContainer) {
          const sections = cleanContainer.querySelectorAll<HTMLElement>(
            `section.${DOCX_PREVIEW_CLASS_NAME}`,
          );
          numPages = Math.max(sections.length, 1);
          if (sections.length > 0) {
            const first = sections[0];
            if (first) {
              const rect = first.getBoundingClientRect();
              const styleWidth = parseFloat(first.style.width);
              const styleHeight =
                parseFloat(first.style.minHeight) || parseFloat(first.style.height);
              const width =
                (Number.isFinite(styleWidth) && styleWidth > 0 ? styleWidth : rect.width) ||
                DEFAULT_DOCX_PAGE_SIZE.width;
              const height =
                (Number.isFinite(styleHeight) && styleHeight > 0 ? styleHeight : rect.height) ||
                DEFAULT_DOCX_PAGE_SIZE.height;
              pageSize = {
                width: Math.round(width),
                height: Math.round(height),
              };
            }
          }
        }

        setStoredLoad((current) =>
          current.url === url && current.generation === generation
            ? {
                ...current,
                state: {
                  status: "ready",
                  numPages,
                  pageSize,
                  hasRedlines,
                  error: null,
                },
              }
            : current,
        );
      } catch (err: unknown) {
        if (session.cancelled) return;
        const message = err instanceof Error ? err.message : "Could not open this document.";
        setStoredLoad((current) =>
          current.url === url && current.generation === generation
            ? {
                ...current,
                state: {
                  status: "error",
                  numPages: 0,
                  pageSize: null,
                  hasRedlines: false,
                  error: message,
                },
              }
            : current,
        );
      }
    })();

    return () => {
      session.cancelled = true;
      abortController.abort();
    };
  }, [cleanContainer, load.generation, url]);

  // 2. Lazy compilation of redlines layer on demand
  useEffect(() => {
    if (!showRedlines || !redlinesContainer || redlinesRenderedRef.current) return;
    const cached = parsedDocRef.current;
    if (!cached || cached.url !== url) return;

    let cancelled = false;
    void (async () => {
      try {
        const docx = await import("docx-preview");
        if (cancelled) return;
        const redlineNodes = await docx.renderDocument(cached.doc, {
          ...BASE_DOCX_OPTIONS,
          renderChanges: true,
        });
        if (cancelled) return;
        redlinesContainer.replaceChildren();
        for (const node of redlineNodes) {
          redlinesContainer.appendChild(node);
        }
        sanitizeDocxLinks(redlinesContainer);
        redlinesRenderedRef.current = true;
      } catch {
        // Redlines rendering failure fallback
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [redlinesContainer, showRedlines, url]);

  return load.state;
}
