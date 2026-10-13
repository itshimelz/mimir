// FILE: PptxPresentationModal.tsx
// Purpose: Fullscreen slideshow presentation mode for PPTX files,
//          mirroring ChatGPT's Popcorn presentation viewer.
// Layer: Web PPTX viewer component
// Exports: PptxPresentationModal

import { useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PageTextIcon, XIcon } from "~/lib/icons";
import { cn } from "~/lib/utils";

interface PptxPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  numSlides: number;
  currentSlide: number;
  onSelectSlide: (slideNumber: number) => void;
  slideElements: ReadonlyArray<HTMLElement | null>;
  notes?: string | undefined;
  slideWidth?: number | null | undefined;
  slideHeight?: number | null | undefined;
}

export function PptxPresentationModal(props: PptxPresentationModalProps) {
  const {
    isOpen,
    onClose,
    numSlides,
    currentSlide,
    onSelectSlide,
    slideElements,
    notes,
    slideWidth,
    slideHeight,
  } = props;

  const [showNotes, setShowNotes] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const slideHostRef = useRef<HTMLDivElement | null>(null);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keyboard navigation during presentation mode
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (
        event.key === "ArrowRight" ||
        event.key === " " ||
        event.key === "Enter" ||
        event.key === "PageDown"
      ) {
        event.preventDefault();
        onSelectSlide(Math.min(currentSlide + 1, numSlides));
      } else if (event.key === "ArrowLeft" || event.key === "Backspace" || event.key === "PageUp") {
        event.preventDefault();
        onSelectSlide(Math.max(currentSlide - 1, 1));
      } else if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        setShowNotes((curr) => !curr);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, isOpen, numSlides, onClose, onSelectSlide]);

  // Clone active slide into stage
  const activeElement = slideElements[currentSlide - 1] ?? null;
  const baseWidth = slideWidth || activeElement?.offsetWidth || 960;
  const baseHeight = slideHeight || activeElement?.offsetHeight || Math.round((baseWidth * 9) / 16);

  useEffect(() => {
    const host = slideHostRef.current;
    if (!host || !isOpen) return;

    if (!activeElement) {
      host.replaceChildren();
      return;
    }

    try {
      const clone = activeElement.cloneNode(true) as HTMLElement;
      clone.classList.remove("pptx-preview-slide-wrapper");
      clone.classList.add("pptx-presentation-slide-wrapper");
      clone.style.pointerEvents = "none";
      clone.style.userSelect = "none";
      clone.style.margin = "0";
      clone.style.position = "absolute";
      clone.style.top = "0";
      clone.style.left = "0";
      clone.style.display = "block";
      clone.style.visibility = "visible";
      clone.style.width = `${baseWidth}px`;
      clone.style.height = `${baseHeight}px`;
      host.replaceChildren(clone);
    } catch {
      host.replaceChildren();
    }
  }, [activeElement, baseHeight, baseWidth, isOpen]);

  // Auto-hide bottom floating bar after 3 seconds of mouse inactivity
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Presentation mode"
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black select-none overflow-hidden"
    >
      {/* Slide stage container with responsive aspect ratio fit */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: "min(92vw, calc(88vh * (16 / 9)))",
          aspectRatio: `${baseWidth} / ${baseHeight}`,
          maxHeight: "88vh",
        }}
      >
        <div
          ref={slideHostRef}
          className="relative w-full h-full overflow-hidden rounded-md shadow-2xl bg-background"
        />
      </div>

      {/* Optional speaker notes overlay toggleable via 'N' or button */}
      {showNotes && notes && notes.trim().length > 0 ? (
        <aside
          aria-label="Speaker notes"
          className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-2xl w-[90vw] rounded-xl border border-white/20 bg-black/85 p-4 text-white shadow-2xl backdrop-blur-md"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-ui-xs font-semibold uppercase tracking-wider text-white/70">
              Speaker Notes · Slide {currentSlide}
            </span>
            <button
              type="button"
              onClick={() => setShowNotes(false)}
              className="rounded p-1 text-white/70 hover:text-white hover:bg-white/10"
              aria-label="Close notes"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto text-ui leading-relaxed text-white/90 whitespace-pre-wrap select-text">
            {notes}
          </div>
        </aside>
      ) : null}

      {/* Floating controls bar */}
      <nav
        aria-label="Presentation controls"
        className={cn(
          "absolute bottom-6 flex items-center gap-3 rounded-full border border-white/15 bg-black/80 px-4 py-2 text-white shadow-xl backdrop-blur-md transition-opacity duration-300",
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <button
          type="button"
          onClick={() => onSelectSlide(Math.max(currentSlide - 1, 1))}
          disabled={currentSlide <= 1}
          className="flex size-7 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
          title="Previous slide (Left arrow)"
          aria-label="Previous slide"
        >
          <ChevronLeftIcon className="size-4" />
        </button>

        <span className="text-ui-xs font-medium text-white/90 min-w-16 text-center tabular-nums">
          {currentSlide} / {numSlides}
        </span>

        <button
          type="button"
          onClick={() => onSelectSlide(Math.min(currentSlide + 1, numSlides))}
          disabled={currentSlide >= numSlides}
          className="flex size-7 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
          title="Next slide (Right arrow)"
          aria-label="Next slide"
        >
          <ChevronRightIcon className="size-4" />
        </button>

        <div className="h-4 w-px bg-white/20 mx-1" />

        <button
          type="button"
          onClick={() => setShowNotes((curr) => !curr)}
          className={cn(
            "flex size-7 items-center justify-center rounded-full transition",
            showNotes ? "bg-white text-black" : "text-white/80 hover:bg-white/15 hover:text-white",
          )}
          title="Toggle speaker notes (N)"
          aria-label="Toggle speaker notes"
        >
          <PageTextIcon className="size-4" />
        </button>

        <button
          type="button"
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
          title="Exit presentation (Esc)"
          aria-label="Exit presentation"
        >
          <XIcon className="size-4" />
        </button>
      </nav>
    </div>
  );
}
