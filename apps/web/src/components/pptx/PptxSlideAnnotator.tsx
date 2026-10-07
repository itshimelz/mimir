// FILE: PptxSlideAnnotator.tsx
// Purpose: The click layer that turns a click on a rendered slide into a
//          shape-anchored "Local comment". It owns hover/active shape
//          projection, existing-annotation markers, and the comment box. Every
//          hit test and marker is positioned from normalized shape bounds, so
//          targets stay correct at any zoom level and across re-renders.
// Layer: Web PPTX viewer interaction UI
// Exports: PptxSlideAnnotator, PptxSlideAnnotatorHandle, PptxSlideAnnotationTarget

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";

import {
  formatPptxShapeName,
  hitTestPptxShape,
  type PptxShapeBounds,
  type PptxShapeRef,
  type PptxSlideShapeIndex,
} from "~/lib/pptx/pptxShapes";
import { LocalCommentBox } from "../chat/LocalCommentBox";
import { cn } from "~/lib/utils";

interface SlideBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface PendingComment {
  shape: PptxShapeRef;
  /** Click position inside the slide, normalized, for anchoring the box. */
  point: { x: number; y: number };
}

export interface PptxSlideAnnotationTarget {
  slideNumber: number;
  shape: PptxShapeRef;
  region: PptxShapeBounds;
  comment: string;
}

export interface PptxSlideAnnotatorHandle {
  /** Leaves an open comment box without submitting it. */
  cancel: () => void;
}

interface PptxSlideAnnotatorProps {
  ref?: React.Ref<PptxSlideAnnotatorHandle> | undefined;
  /** Rendered slide elements, in slide order. */
  slideElements: ReadonlyArray<HTMLElement | null>;
  slides: ReadonlyArray<PptxSlideShapeIndex>;
  /** Comments already attached to this draft, projected back onto the slides. */
  annotations: ReadonlyArray<{
    id: string;
    slideNumber: number;
    region: PptxShapeBounds;
  }>;
  active: boolean;
  /** Changes whenever the deck re-renders (zoom, resize, reload). */
  renderRevision: string;
  onSubmit: (target: PptxSlideAnnotationTarget) => void;
}

function boundsStyle(bounds: PptxShapeBounds) {
  return {
    left: `${bounds.x * 100}%`,
    top: `${bounds.y * 100}%`,
    width: `${bounds.width * 100}%`,
    height: `${bounds.height * 100}%`,
  };
}

export function PptxSlideAnnotator(props: PptxSlideAnnotatorProps) {
  const { ref } = props;
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [boxes, setBoxes] = useState<ReadonlyArray<SlideBox | null>>([]);
  const [hovered, setHovered] = useState<{ slideIndex: number; shape: PptxShapeRef } | null>(null);
  const [pending, setPending] = useState<{ slideIndex: number; comment: PendingComment } | null>(
    null,
  );

  useImperativeHandle(
    ref,
    () => ({
      cancel: () => {
        setPending(null);
        setHovered(null);
      },
    }),
    [],
  );

  // The overlay sits in the scrolled content, so a slide's box is a plain rect
  // delta against the overlay — independent of scroll position, and re-measured
  // whenever the deck re-renders or the pane resizes.
  useLayoutEffect(() => {
    const measure = () => {
      const overlay = overlayRef.current;
      if (!overlay) {
        return;
      }
      const overlayRect = overlay.getBoundingClientRect();
      setBoxes(
        props.slideElements.map((slideElement) => {
          if (!slideElement) {
            return null;
          }
          const rect = slideElement.getBoundingClientRect();
          return {
            left: rect.left - overlayRect.left,
            top: rect.top - overlayRect.top,
            width: rect.width,
            height: rect.height,
          };
        }),
      );
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(measure);
    for (const slideElement of props.slideElements) {
      if (slideElement) {
        observer.observe(slideElement);
      }
    }
    return () => observer.disconnect();
    // `active` is a dependency because the overlay only exists while annotating:
    // arming the mode has to measure a freshly mounted node, not a detached one.
  }, [props.active, props.renderRevision, props.slideElements]);

  // A re-render or a different deck invalidates an open comment: the shape it
  // named belongs to slides that are no longer on screen.
  useEffect(() => {
    setPending(null);
    setHovered(null);
  }, [props.renderRevision]);

  if (!props.active) {
    return null;
  }

  return (
    <div ref={overlayRef} className="pointer-events-none absolute inset-0 z-10">
      {boxes.map((box, slideIndex) => {
        const slide = props.slides[slideIndex];
        if (!box || !slide) {
          return null;
        }
        const slideNumber = slide.slideNumber;
        const isTargetSlide = pending?.slideIndex === slideIndex;
        const shape = isTargetSlide
          ? pending.comment.shape
          : hovered?.slideIndex === slideIndex
            ? hovered.shape
            : null;
        const markers = props.annotations.filter(
          (annotation) => annotation.slideNumber === slideNumber,
        );
        return (
          <div
            key={slideNumber}
            className="pointer-events-auto absolute"
            style={box}
            data-testid={`pptx-annotate-layer-${slideNumber}`}
            onMouseMove={(event) => {
              if (isTargetSlide) {
                return;
              }
              const rect = event.currentTarget.getBoundingClientRect();
              if (rect.width === 0 || rect.height === 0) {
                return;
              }
              const shape = hitTestPptxShape(slide, {
                x: (event.clientX - rect.left) / rect.width,
                y: (event.clientY - rect.top) / rect.height,
              });
              // Pointer moves are far more frequent than shape changes: only
              // commit when the hovered shape actually differs.
              setHovered((current) =>
                current?.slideIndex === slideIndex && current.shape.shapeId === shape?.shapeId
                  ? current
                  : shape === null
                    ? null
                    : { slideIndex, shape },
              );
            }}
            onMouseLeave={() => {
              if (!isTargetSlide) {
                setHovered(null);
              }
            }}
            onClick={(event) => {
              if (isTargetSlide) {
                return;
              }
              const rect = event.currentTarget.getBoundingClientRect();
              if (rect.width === 0 || rect.height === 0) {
                return;
              }
              const x = (event.clientX - rect.left) / rect.width;
              const y = (event.clientY - rect.top) / rect.height;
              const shape = hitTestPptxShape(slide, { x, y });
              if (!shape) {
                return;
              }
              setHovered(null);
              setPending({ slideIndex, comment: { shape, point: { x, y } } });
            }}
          >
            {markers.map((annotation, markerIndex) => (
              <span
                key={annotation.id}
                className={cn(
                  "absolute flex size-5 items-center justify-center rounded-full border",
                  "border-[color:var(--color-border)] bg-[var(--color-background-elevated-primary-opaque)]",
                  "text-ui-xs font-semibold text-muted-foreground shadow-sm",
                )}
                style={{
                  left: `calc(${annotation.region.x * 100}% - 0.625rem)`,
                  top: `calc(${annotation.region.y * 100}% - 0.625rem)`,
                }}
                aria-hidden="true"
              >
                {markerIndex + 1}
              </span>
            ))}
            {shape ? (
              <span
                className={cn(
                  "pointer-events-none absolute rounded-[3px]",
                  isTargetSlide
                    ? "bg-[color:var(--color-text-accent)]/12 ring-2 ring-inset ring-[color:var(--color-text-accent)]"
                    : "ring-1 ring-inset ring-[color:var(--color-text-accent)]/70",
                )}
                style={boundsStyle(shape.bounds)}
                aria-hidden="true"
              />
            ) : null}
            {isTargetSlide && pending ? (
              <LocalCommentBox
                targetLabel={`slide ${slideNumber} · ${formatPptxShapeName(pending.comment.shape)}`}
                // Anchor under the click on both axes, then clamp inside the slide
                // so the box never opens off the edge or spills onto the next one.
                top={`min(calc(${pending.comment.point.y * 100}% + 0.5rem), calc(100% - 9rem))`}
                left={`clamp(0.75rem, ${pending.comment.point.x * 100}%, calc(100% - 22rem))`}
                width="min(22rem, calc(100% - 1.5rem))"
                onCancel={() => setPending(null)}
                onSubmit={(comment) => {
                  if (pending) {
                    props.onSubmit({
                      slideNumber,
                      shape: pending.comment.shape,
                      region: pending.comment.shape.bounds,
                      comment,
                    });
                  }
                  setPending(null);
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
