// FILE: spinner.tsx
// Purpose: The busy indicator (M3 circular progress, indeterminate).
// Layer: UI primitive
// Exports: Spinner

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

export { Spinner };
