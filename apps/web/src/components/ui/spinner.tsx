// FILE: spinner.tsx
// Purpose: The busy indicator (M3 circular progress, indeterminate).
// Layer: UI primitive
// Exports: Spinner, LiveStatusSpinner

import { useRef } from "react";

import { useTimelineSynchronizedAnimations } from "~/lib/animationTimelineSync";
import { LoaderIcon } from "~/lib/icons";
import { cn } from "~/lib/utils";

/**
 * M3's indeterminate circular progress: a single round-capped arc that grows to ~75% and
 * shrinks back while the whole ring rotates once. Drawn as a pathLength=100 circle so the
 * `stroke-dashoffset` values are percentages, which is what makes the animation readable
 * in CSS.
 *
 * Inherits `currentColor`, so callers that already set a text color keep it; the default
 * is `primary`. The reduced-motion rules (m3.material.css) freeze both animations and
 * park the arc at a visible offset, so it still reads as busy without moving.
 */
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 48 48"
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("m3-spinner size-5 text-primary", className)}
      {...props}
    >
      <circle
        cx="24"
        cy="24"
        r="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        pathLength={100}
        className="m3-spinner-arc origin-center [stroke-dasharray:100]"
      />
    </svg>
  );
}

// Status glyph for live work that can stay on screen for minutes (running tasks,
// subagents, workflow runs). A continuous `animate-spin` repaints on every display
// frame, 180 times a second on a 180 Hz monitor, and these glyphs sit under the
// composer's backdrop blur. The stepped token and timeline sync match the sidebar
// spinners (see ThreadRunningSpinner), so all live glyphs redraw in the same frames.
function LiveStatusSpinner({ className }: { className?: string }) {
  const ref = useRef<SVGSVGElement | null>(null);
  useTimelineSynchronizedAnimations(ref);
  return (
    <LoaderIcon
      ref={ref}
      aria-hidden
      className={cn("animate-spin-stepped motion-reduce:animate-none", className)}
    />
  );
}

export { LiveStatusSpinner, Spinner };
