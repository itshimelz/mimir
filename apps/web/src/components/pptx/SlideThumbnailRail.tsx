// FILE: SlideThumbnailRail.tsx
// Purpose: Collapsible and resizable left sidebar thumbnail rail for PPTX presentations,
//          mirroring ChatGPT's Popcorn presentation slide navigator with full
//          aspect-ratio responsiveness.
// Layer: Web PPTX viewer component
// Exports: SlideThumbnailRail

import { useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";
import { PanelLeftIcon } from "~/lib/icons";
import type { PptxSlideShapeIndex } from "~/lib/pptx/pptxShapes";

interface SlideThumbnailRailProps {
  numSlides: number;
  currentSlide: number;
  onSelectSlide: (slideNumber: number) => void;
  slideElements: ReadonlyArray<HTMLElement | null>;
  slideShapes?: ReadonlyArray<PptxSlideShapeIndex> | undefined;
  slideWidth?: number | null | undefined;
  slideHeight?: number | null | undefined;
  collapsed: boolean;
  onToggleCollapse: () => void;
  className?: string | undefined;
}

export function SlideThumbnailRail(props: SlideThumbnailRailProps) {
  const {
    numSlides,
    currentSlide,
    onSelectSlide,
    slideElements,
    slideShapes,
    slideWidth,
    slideHeight,
    collapsed,
    onToggleCollapse,
    className,
  } = props;

  if (collapsed) {
    return (
      <div
        className={cn(
          "flex shrink-0 flex-col border-r border-border/40 bg-muted/10 p-1.5",
          className,
        )}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground active:scale-95"
          title="Show slide thumbnails"
          aria-label="Show slide thumbnails"
        >
          <PanelLeftIcon className="size-4" />
        </button>
      </div>
    );
  }

  const cardAspectRatio =
    slideWidth && slideHeight && slideWidth > 0 && slideHeight > 0
      ? `${slideWidth} / ${slideHeight}`
      : "16 / 9";

  return (
    <aside
      className={cn(
        "flex w-48 shrink-0 flex-col border-r border-border/40 bg-muted/10 select-none overflow-hidden",
        className,
      )}
      aria-label="Slide thumbnails"
    >
      {/* Docked rail header */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border/30 px-3">
        <span className="text-ui-xs font-medium text-muted-foreground/90">
          {numSlides} {numSlides === 1 ? "slide" : "slides"}
        </span>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground active:scale-95"
          title="Collapse slide thumbnails"
          aria-label="Collapse slide thumbnails"
        >
          <PanelLeftIcon className="size-4" />
        </button>
      </div>

      {/* Slide thumbnails list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5 focus:outline-none">
        {Array.from({ length: numSlides }, (_, index) => {
          const slideNumber = index + 1;
          const isActive = slideNumber === currentSlide;
          const element = slideElements[index] ?? null;
          const shapes = slideShapes?.[index]?.shapes ?? [];
          const titleText =
            shapes
              .find((s) => s.placeholder === "title" || s.placeholder === "ctrTitle")
              ?.text?.trim() ||
            shapes.find((s) => s.text.trim().length > 0)?.text?.trim() ||
            `Slide ${slideNumber}`;

          return (
            <div
              key={slideNumber}
              onClick={() => onSelectSlide(slideNumber)}
              className={cn(
                "group flex items-center gap-2 rounded-xl p-1.5 transition-all cursor-pointer",
                isActive ? "bg-accent/40 ring-1 ring-primary/40 shadow-xs" : "hover:bg-muted/30",
              )}
            >
              <span
                className={cn(
                  "w-3.5 text-center text-ui-xs font-medium shrink-0",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground/70 group-hover:text-muted-foreground",
                )}
              >
                {slideNumber}
              </span>
              <div
                style={{ aspectRatio: cardAspectRatio }}
                className={cn(
                  "relative flex-1 rounded-lg overflow-hidden border bg-background transition-all shadow-xs",
                  isActive
                    ? "border-primary/60 ring-1 ring-primary/30"
                    : "border-border/60 group-hover:border-border",
                )}
              >
                <SlideMiniPreview
                  sourceElement={element}
                  fallbackTitle={titleText}
                  slideWidth={slideWidth}
                  slideHeight={slideHeight}
                />
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function SlideMiniPreview(props: {
  sourceElement: HTMLElement | null;
  fallbackTitle: string;
  slideWidth?: number | null | undefined;
  slideHeight?: number | null | undefined;
}) {
  const { sourceElement, fallbackTitle, slideWidth, slideHeight } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const outerRef = useRef<HTMLDivElement | null>(null);
  const [cardWidth, setCardWidth] = useState<number | null>(null);

  // The sourceElement in the DOM is rendered at renderWidth (scaled by page zoom).
  // For the thumbnail clone, we want the intrinsic unzoomed deck width/height so that
  // page zoom never alters the thumbnail's clone dimensions or relative scale.
  const intrinsicWidth = slideWidth || 960;
  const intrinsicHeight = slideHeight || Math.round((intrinsicWidth * 9) / 16);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setCardWidth(w);
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry && entry.contentRect.width > 0) {
        setCardWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    if (!sourceElement) {
      host.replaceChildren();
      return;
    }

    try {
      const clone = sourceElement.cloneNode(true) as HTMLElement;
      clone.classList.remove("pptx-preview-slide-wrapper");
      clone.classList.add("pptx-thumbnail-slide-wrapper");
      clone.style.pointerEvents = "none";
      clone.style.userSelect = "none";
      clone.style.margin = "0";
      clone.style.position = "absolute";
      clone.style.top = "0";
      clone.style.left = "0";
      clone.style.display = "block";
      clone.style.visibility = "visible";

      // If the rendered sourceElement is at a zoomed renderWidth, measure its rendered width
      // to determine the ratio between the rendered element and its clone.
      const renderedWidth =
        parseFloat(sourceElement.style.width) || sourceElement.offsetWidth || intrinsicWidth;
      const renderedHeight =
        parseFloat(sourceElement.style.height) || sourceElement.offsetHeight || intrinsicHeight;

      clone.style.width = `${renderedWidth}px`;
      clone.style.height = `${renderedHeight}px`;
      host.replaceChildren(clone);
    } catch {
      host.replaceChildren();
    }
  }, [intrinsicHeight, intrinsicWidth, sourceElement]);

  // Dynamically scale clone to fill 100% of card width regardless of page zoom
  const currentCardWidth = cardWidth ?? 138;
  const renderedWidth =
    (sourceElement ? parseFloat(sourceElement.style.width) || sourceElement.offsetWidth : 0) ||
    intrinsicWidth;
  const scale = renderedWidth > 0 ? currentCardWidth / renderedWidth : 0.16;

  return (
    <div ref={outerRef} className="relative w-full h-full overflow-hidden bg-background">
      <div
        ref={containerRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        className="pointer-events-none select-none"
      />
      {!sourceElement ? (
        <div className="flex h-full w-full items-center justify-center p-1 text-center">
          <span className="text-ui-xs line-clamp-2 text-muted-foreground/70 leading-tight">
            {fallbackTitle}
          </span>
        </div>
      ) : null}
    </div>
  );
}
