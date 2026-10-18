// FILE: DocxFilePreview.tsx
// Purpose: In-app Word (.docx) document viewer surface. Renders our own toolbar
//          (file name, page navigation, redlines toggle, ChatGPT-style Request Edits,
//          zoom) over a continuously-scrolling, centered stack of docx-rendered
//          pages. Supports dual-layer rendering (clean vs tracked changes) with
//          instant zero-latency switching, page registration, and selection-driven
//          composer commentary.
// Layer: Web chat/editor file-preview component
// Exports: DocxFilePreview

import { useEffect, useState, useCallback } from "react";

import { basenameOfPath } from "~/file-icons";
import { Loader2Icon, TriangleAlertIcon } from "~/lib/icons";
import { buildLocalImageUrl } from "~/lib/localImageUrls";
import { useContainerSize } from "~/lib/viewer/useContainerSize";
import { useViewerPageNavigation } from "~/lib/viewer/useViewerPageNavigation";
import { useViewerZoomController } from "~/lib/viewer/useViewerZoomController";
import { DOCX_PAGE_MARGIN_PX, DEFAULT_DOCX_PAGE_SIZE } from "~/lib/docx/docxZoom";
import { useDocxDocument, DOCX_PREVIEW_CLASS_NAME } from "~/lib/docx/useDocxDocument";
import type { ChatFileReference } from "~/lib/chatReferences";
import type { FileCommentSelection } from "~/lib/fileComments";
import { cn } from "~/lib/utils";
import { DocxViewerToolbar } from "./docx/DocxViewerToolbar";

export interface DocxFilePreviewProps {
  /**
   * Workspace-relative path of the DOCX (resolved server-side against cwd), or an
   * allowlisted absolute path (e.g. inside a session's scratch workspace).
   */
  filePath: string;
  cwd: string | null | undefined;
  previewGrant?: string | null | undefined;
  cacheKey?: string | number | undefined;
  /** Pre-resolved target for the "Open in editor" control in the toolbar. */
  openInTarget: string | null;
  className?: string;
  onReload?: (() => void) | undefined;
  onPreviewReady?: (() => void) | undefined;
  onPreviewError?: (() => void) | undefined;
  onReferenceInChat?: ((reference: ChatFileReference) => void) | undefined;
  onAskWhyInChat?: ((reference: ChatFileReference) => void) | undefined;
  onCommentInChat?: ((comment: FileCommentSelection) => void) | undefined;
}

export function DocxFilePreview(props: DocxFilePreviewProps) {
  const previewUrl = buildLocalImageUrl({
    src: props.filePath,
    cwd: props.cwd ?? undefined,
    grant: props.previewGrant,
    cacheKey: props.cacheKey,
  });
  const fileName = basenameOfPath(props.filePath);

  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const [cleanContainer, setCleanContainer] = useState<HTMLDivElement | null>(null);
  const [redlinesContainer, setRedlinesContainer] = useState<HTMLDivElement | null>(null);
  const [showRedlines, setShowRedlines] = useState(false);
  const [selectedText, setSelectedText] = useState<string | null>(null);

  const doc = useDocxDocument({
    url: previewUrl,
    cleanContainer,
    redlinesContainer,
    showRedlines,
  });

  const { onPreviewError, onPreviewReady } = props;
  useEffect(() => {
    if (doc.status === "ready") {
      onPreviewReady?.();
    } else if (doc.status === "error") {
      onPreviewError?.();
    }
  }, [doc.status, onPreviewError, onPreviewReady]);

  const containerSize = useContainerSize(scrollRoot);

  const navigation = useViewerPageNavigation({
    scrollRoot,
    numPages: doc.numPages,
    enabled: doc.status === "ready",
    resetKey: previewUrl,
    marginPx: DOCX_PAGE_MARGIN_PX,
  });

  const zoom = useViewerZoomController({
    contentSize: doc.pageSize ?? DEFAULT_DOCX_PAGE_SIZE,
    containerSize,
    marginPx: DOCX_PAGE_MARGIN_PX,
    currentPage: navigation.currentPage,
    scrollToPage: navigation.scrollToPage,
    initialMode: { type: "fit-page" },
  });

  // Register rendered page sections with the page navigation hook
  useEffect(() => {
    const activeRoot = showRedlines ? redlinesContainer : cleanContainer;
    if (doc.status !== "ready" || !activeRoot) return;

    const sections = activeRoot.querySelectorAll<HTMLElement>(`section.${DOCX_PREVIEW_CLASS_NAME}`);
    sections.forEach((section, index) => {
      navigation.registerElement(index + 1, section);
    });

    return () => {
      sections.forEach((_, index) => {
        navigation.registerElement(index + 1, null);
      });
    };
  }, [doc.status, cleanContainer, redlinesContainer, showRedlines, navigation.registerElement]);

  // Track selection for "Request edits" / comment in chat
  const handleContainerMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    setSelectedText(text && text.length > 0 ? text : null);
  }, []);

  // Support Ctrl / Cmd + Wheel zooming over document
  useEffect(() => {
    const root = scrollRoot;
    if (!root) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      if (e.deltaY < 0) {
        zoom.onZoomIn();
      } else if (e.deltaY > 0) {
        zoom.onZoomOut();
      }
    };

    root.addEventListener("wheel", handleWheel, { passive: false });
    return () => root.removeEventListener("wheel", handleWheel);
  }, [scrollRoot, zoom]);

  const handleRequestEdits = useCallback(() => {
    if (selectedText) {
      if (props.onCommentInChat) {
        props.onCommentInChat({
          path: props.filePath,
          startLine: navigation.currentPage,
          endLine: navigation.currentPage,
          text: selectedText,
        });
        return;
      }
      if (props.onReferenceInChat) {
        props.onReferenceInChat({
          path: props.filePath,
          snippet: selectedText,
        });
        return;
      }
    }
    // Fallback if no specific text is highlighted: reference the file
    props.onReferenceInChat?.({ path: props.filePath });
  }, [navigation.currentPage, props, selectedText]);

  const outerClassName = cn(
    "flex h-full min-h-0 min-w-0 flex-1 flex-col app-content-surface",
    props.className,
  );

  return (
    <div className={outerClassName}>
      <DocxViewerToolbar
        fileName={fileName}
        currentPage={navigation.currentPage}
        numPages={doc.numPages}
        onJumpToPage={navigation.jumpToPage}
        hasRedlines={doc.hasRedlines}
        showRedlines={showRedlines}
        onToggleRedlines={() => setShowRedlines((prev) => !prev)}
        zoomMode={zoom.zoomMode}
        scale={zoom.scale}
        onZoomIn={zoom.onZoomIn}
        onZoomOut={zoom.onZoomOut}
        onSetScale={zoom.onSetScale}
        onFitWidth={zoom.onFitWidth}
        onFitPage={zoom.onFitPage}
        openInTarget={props.openInTarget}
        onReload={props.onReload}
        onRequestEdits={
          props.onCommentInChat || props.onReferenceInChat ? handleRequestEdits : undefined
        }
        hasActiveSelection={Boolean(selectedText)}
      />

      <div
        ref={setScrollRoot}
        onMouseUp={handleContainerMouseUp}
        className="docx-viewer-scroll relative min-h-0 flex-1 overflow-auto"
      >
        {/* Loading spinner overlay */}
        {doc.status === "loading" ? (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-xs"
            role="status"
            aria-label="Loading document..."
          >
            <Loader2Icon
              className="size-5 animate-spin opacity-60 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        ) : null}

        {/* Error overlay */}
        {doc.status === "error" ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <TriangleAlertIcon className="size-5 text-destructive/80" aria-hidden="true" />
            <p className="text-ui text-muted-foreground">
              {doc.error ?? "Could not open this document."}
            </p>
            {props.onReload ? (
              <button
                type="button"
                className="rounded-md px-2 py-1 text-ui leading-snug hover:bg-foreground/8"
                onClick={props.onReload}
              >
                Reload file from disk
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Scaled page stack (containers remain unconditionally mounted) */}
        <div
          className={cn(
            "relative flex flex-col items-center w-full min-h-full",
            doc.status !== "ready" && "invisible pointer-events-none",
          )}
          style={
            {
              "--mimir-docx-preview-zoom": `${zoom.scale}`,
            } as React.CSSProperties
          }
        >
          {/* Clean layer */}
          <div
            ref={setCleanContainer}
            className={cn(
              "w-full flex flex-col items-center",
              showRedlines ? "invisible pointer-events-none absolute inset-0" : "visible relative",
            )}
            data-testid={!showRedlines ? "docx-preview-panel" : undefined}
          />

          {/* Redlines / tracked changes layer */}
          <div
            ref={setRedlinesContainer}
            className={cn(
              "w-full flex flex-col items-center",
              !showRedlines ? "invisible pointer-events-none absolute inset-0" : "visible relative",
            )}
            data-testid={showRedlines ? "docx-preview-panel" : undefined}
          />
        </div>
      </div>
    </div>
  );
}
