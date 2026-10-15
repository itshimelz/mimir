// FILE: PptxFilePreview.tsx
// Purpose: In-app PPTX viewer surface. Matches OpenAI ChatGPT's presentation
//          viewing experience: left thumbnail rail, single-slide centered stage,
//          anchored speaker notes pane, presentation slideshow mode, and shape
//          annotation session that turns clicks into composer comments.
// Layer: Web chat/editor file-preview component
// Exports: PptxFilePreview

import { useEffect, useRef, useState } from "react";

import { basenameOfPath } from "~/file-icons";
import { Loader2Icon, TriangleAlertIcon } from "~/lib/icons";
import { buildLocalImageUrl } from "~/lib/localImageUrls";
import { useContainerSize } from "~/lib/viewer/useContainerSize";
import { usePptxDocument } from "~/lib/pptx/usePptxDocument";
import {
  createPptxAnnotationDraft,
  type PptxAnnotationDraft,
  type PptxAnnotationSelection,
} from "~/lib/pptxAnnotations";
import { useViewerPageNavigation } from "~/lib/viewer/useViewerPageNavigation";
import { useViewerZoomController } from "~/lib/viewer/useViewerZoomController";
import type { ViewerContentSize } from "~/lib/viewer/viewerZoom";
import { cn } from "~/lib/utils";
import { PptxPresentationModal } from "./pptx/PptxPresentationModal";
import { PptxSlideAnnotator, type PptxSlideAnnotatorHandle } from "./pptx/PptxSlideAnnotator";
import { PptxViewerToolbar } from "./pptx/PptxViewerToolbar";
import { SlideThumbnailRail } from "./pptx/SlideThumbnailRail";
import { SpeakerNotesPane } from "./pptx/SpeakerNotesPane";

/** Breathing room (CSS px) around a slide inside the scroll area. */
const PPTX_SLIDE_MARGIN_PX = 24;

/**
 * What the deck parse reports back, mirrored into state so the navigation and
 * zoom hooks — which run before the document hook — can read it. `slideSize` is
 * null until the renderer reports the deck's intrinsic size, and stays null for
 * a deck it cannot size, which leaves zoom at its 100% fallback.
 */
interface DeckGeometry {
  slideSize: ViewerContentSize | null;
  numSlides: number;
}

export function PptxFilePreview(props: {
  /** Workspace-relative path of the deck, or an allowlisted absolute path. */
  filePath: string;
  cwd: string | null | undefined;
  previewGrant?: string | null | undefined;
  cacheKey?: string | number | undefined;
  /** Pre-resolved target for the "Open in editor" control in the toolbar. */
  openInTarget: string | null;
  /** Shape comments already attached to this thread's composer draft. */
  annotations?: ReadonlyArray<PptxAnnotationDraft> | undefined;
  onAddAnnotation?: ((annotation: PptxAnnotationSelection) => void) | undefined;
  className?: string;
  onReload?: (() => void) | undefined;
  onPreviewReady?: (() => void) | undefined;
  onPreviewError?: (() => void) | undefined;
}) {
  const previewUrl = buildLocalImageUrl({
    src: props.filePath,
    cwd: props.cwd ?? undefined,
    grant: props.previewGrant,
    cacheKey: props.cacheKey,
  });
  const fileName = basenameOfPath(props.filePath);
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const [slideHost, setSlideHost] = useState<HTMLDivElement | null>(null);
  const [slideElements, setSlideElements] = useState<ReadonlyArray<HTMLElement | null>>([]);
  const [deck, setDeck] = useState<DeckGeometry | null>(null);
  const [annotating, setAnnotating] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const annotatorRef = useRef<PptxSlideAnnotatorHandle | null>(null);
  const containerSize = useContainerSize(scrollRoot);

  // Zoom and page tracking both read the parsed deck, and the deck renders at
  // the width zoom resolves to — so the parse result is mirrored into state that
  // feeds those two hooks, and they in turn feed the next render width.
  const navigation = useViewerPageNavigation({
    scrollRoot,
    numPages: deck?.numSlides ?? 0,
    enabled: deck !== null,
    resetKey: previewUrl,
    marginPx: PPTX_SLIDE_MARGIN_PX,
  });

  // The renderer scales the deck to the width it is given, so PPTX zoom is a
  // render width rather than a page scale: "fit width" is the pane minus the
  // slide margins, and every other mode is a multiple of that. Expressing the
  // content size this way keeps 100% meaning "fills the pane" — and keeps the
  // first render at the final width, so a deck is parsed once, not twice.
  const fitWidthPx =
    containerSize === null ? null : Math.max(containerSize.width - PPTX_SLIDE_MARGIN_PX * 2, 1);
  const slideAspect =
    deck?.slideSize && deck.slideSize.width > 0 && deck.slideSize.height > 0
      ? deck.slideSize.width / deck.slideSize.height
      : 16 / 9;
  const contentSize =
    containerSize === null || fitWidthPx === null
      ? null
      : {
          width: containerSize.width,
          height: fitWidthPx / slideAspect,
        };
  const zoom = useViewerZoomController({
    contentSize,
    containerSize,
    marginPx: PPTX_SLIDE_MARGIN_PX,
    currentPage: navigation.currentPage,
    scrollToPage: navigation.scrollToPage,
    initialMode: { type: "fit-page" },
  });
  const renderWidth = fitWidthPx === null ? null : Math.max(Math.round(fitWidthPx * zoom.scale), 1);
  const doc = usePptxDocument(previewUrl, slideHost, renderWidth);

  useEffect(() => {
    const slideSize = doc.slideSize;
    setDeck((current) =>
      current !== null &&
      current.slideSize?.width === slideSize?.width &&
      current.slideSize?.height === slideSize?.height &&
      current.numSlides === doc.numSlides
        ? current
        : { slideSize, numSlides: doc.numSlides },
    );
  }, [doc.numSlides, doc.slideSize]);

  const { onPreviewError, onPreviewReady } = props;
  useEffect(() => {
    if (doc.status === "ready") {
      onPreviewReady?.();
    } else if (doc.status === "error") {
      onPreviewError?.();
    }
  }, [doc.status, onPreviewError, onPreviewReady]);

  // pptx-preview paints into the host imperatively, so the rendered slides are
  // discovered from the DOM and registered with the shared page navigator. The
  // render revision covers every case where the renderer replaces its DOM:
  // another file, a reload, or a zoom-driven re-render.
  const renderRevision = `${previewUrl}:${doc.numSlides}:${doc.renderedWidth ?? 0}`;
  const { registerElement } = navigation;
  useEffect(() => {
    if (doc.status !== "ready" || !slideHost) {
      setSlideElements([]);
      return;
    }
    const discovered = Array.from(
      slideHost.querySelectorAll<HTMLElement>(".pptx-preview-slide-wrapper"),
    );
    setSlideElements(discovered);
    discovered.forEach((element, index) => registerElement(index + 1, element));
    return () => {
      discovered.forEach((_element, index) => registerElement(index + 1, null));
    };
  }, [doc.status, registerElement, renderRevision, slideHost]);

  // ChatGPT single-slide stage: display the active slide wrapper and hide the others.
  useEffect(() => {
    if (!slideHost) return;
    const wrappers = slideHost.querySelectorAll<HTMLElement>(".pptx-preview-slide-wrapper");
    wrappers.forEach((el, index) => {
      if (index + 1 === navigation.currentPage) {
        el.style.display = "";
      } else {
        el.style.display = "none";
      }
    });
  }, [navigation.currentPage, renderRevision, slideHost]);

  // Scroll stage back to top smoothly when switching slides.
  useEffect(() => {
    scrollRoot?.scrollTo({ top: 0, behavior: "smooth" });
  }, [navigation.currentPage, scrollRoot]);

  // Keyboard navigation on stage: Left/Right arrows and PageUp/PageDown.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || annotating || presenting) return;
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (
        activeTag === "input" ||
        activeTag === "textarea" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        if (navigation.currentPage < doc.numSlides) {
          event.preventDefault();
          navigation.jumpToPage(navigation.currentPage + 1);
        }
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        if (navigation.currentPage > 1) {
          event.preventDefault();
          navigation.jumpToPage(navigation.currentPage - 1);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [annotating, doc.numSlides, navigation, presenting]);

  const annotations = props.annotations ?? [];
  // Markers are projected by the path the comment was captured against, so a
  // deck opened by a different reference (say an absolute scratch path) shows
  // no markers rather than the wrong ones.
  const deckAnnotations = annotations.filter((annotation) => annotation.path === props.filePath);

  useEffect(() => {
    if (!annotating) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) {
        return;
      }
      event.preventDefault();
      annotatorRef.current?.cancel();
      setAnnotating(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [annotating]);

  const outerClassName = cn(
    "flex h-full min-h-0 min-w-0 flex-1 flex-col app-content-surface",
    props.className,
  );

  if (doc.status === "error") {
    return (
      <div className={outerClassName}>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <TriangleAlertIcon className="size-5 text-destructive/80" aria-hidden="true" />
          <p className="text-ui text-muted-foreground">
            {doc.error ?? "Could not open this presentation."}
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
      </div>
    );
  }

  const activeNotes = doc.slideNotes.get(navigation.currentPage) ?? "";

  return (
    <div className={outerClassName}>
      <PptxViewerToolbar
        fileName={fileName}
        currentSlide={navigation.currentPage}
        numSlides={doc.numSlides}
        onJumpToSlide={navigation.jumpToPage}
        zoomMode={zoom.zoomMode}
        scale={zoom.scale}
        onZoomIn={zoom.onZoomIn}
        onZoomOut={zoom.onZoomOut}
        onSetScale={zoom.onSetScale}
        onFitWidth={zoom.onFitWidth}
        onFitPage={zoom.onFitPage}
        canAnnotate={doc.status === "ready" && doc.slideShapes.length > 0}
        annotating={annotating}
        annotationCount={deckAnnotations.length}
        onToggleAnnotate={() => setAnnotating((current) => !current)}
        openInTarget={props.openInTarget}
        onPresent={() => setPresenting(true)}
        onReload={props.onReload}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Docked thumbnail rail on left */}
        <SlideThumbnailRail
          numSlides={doc.numSlides}
          currentSlide={navigation.currentPage}
          onSelectSlide={navigation.jumpToPage}
          slideElements={slideElements}
          slideShapes={doc.slideShapes}
          slideWidth={deck?.slideSize?.width ?? null}
          slideHeight={deck?.slideSize?.height ?? null}
          collapsed={railCollapsed}
          onToggleCollapse={() => setRailCollapsed((curr) => !curr)}
        />

        {/* Center stage viewport */}
        <div
          ref={setScrollRoot}
          className="pdf-viewer-scroll relative flex min-h-0 flex-1 flex-col items-center overflow-auto p-6 bg-muted/5"
        >
          <div
            className="relative flex flex-col items-center max-w-full transition-all"
            style={{ width: renderWidth ? `${renderWidth}px` : "100%" }}
          >
            <div
              className="relative w-full overflow-hidden rounded-xl border border-border/60 bg-background shadow-xs"
              style={{
                aspectRatio:
                  deck?.slideSize && deck.slideSize.width > 0 && deck.slideSize.height > 0
                    ? `${deck.slideSize.width} / ${deck.slideSize.height}`
                    : "16 / 9",
              }}
            >
              <div ref={setSlideHost} />
              <PptxSlideAnnotator
                ref={annotatorRef}
                slideElements={slideElements}
                slides={doc.slideShapes}
                annotations={deckAnnotations}
                active={annotating}
                renderRevision={`${renderRevision}:${navigation.currentPage}`}
                onSubmit={(target) => {
                  const draft = createPptxAnnotationDraft({
                    path: props.filePath,
                    slideNumber: target.slideNumber,
                    shapeId: target.shape.shapeId,
                    shapeName: target.shape.name,
                    shapeText: target.shape.text,
                    region: target.region,
                    comment: target.comment,
                  });
                  if (!draft) {
                    return;
                  }
                  props.onAddAnnotation?.({
                    path: draft.path,
                    slideNumber: draft.slideNumber,
                    shapeId: draft.shapeId,
                    shapeName: draft.shapeName,
                    shapeText: draft.shapeText,
                    region: draft.region,
                    comment: draft.comment,
                  });
                }}
              />
            </div>

            {/* Attached speaker notes pane directly beneath the active slide */}
            <SpeakerNotesPane
              notes={activeNotes}
              slideNumber={navigation.currentPage}
              className="w-full max-w-4xl"
            />
          </div>

          {doc.status === "loading" ? (
            <div
              className="flex min-h-full items-center justify-center"
              role="status"
              aria-label="Loading presentation..."
            >
              <Loader2Icon className="size-4 animate-spin opacity-60" aria-hidden="true" />
            </div>
          ) : null}
        </div>
      </div>

      {/* Fullscreen presentation slideshow modal */}
      <PptxPresentationModal
        isOpen={presenting}
        onClose={() => setPresenting(false)}
        numSlides={doc.numSlides}
        currentSlide={navigation.currentPage}
        onSelectSlide={navigation.jumpToPage}
        slideElements={slideElements}
        notes={activeNotes}
        slideWidth={renderWidth ?? deck?.slideSize?.width ?? null}
        slideHeight={contentSize?.height ?? deck?.slideSize?.height ?? null}
      />
    </div>
  );
}
