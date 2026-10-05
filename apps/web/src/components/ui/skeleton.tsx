// FILE: skeleton.tsx
// Purpose: The loading placeholder shown while a surface's content resolves.
// Layer: UI primitive
// Exports: Skeleton

import { cn } from "~/lib/utils";

/**
 * M3's skeleton: a `surface-container-highest` block that breathes, rather than the
 * shadcn shimmer sweep. M3 has no shimmer — a travelling highlight reads as a progress
 * indicator, and this is a placeholder for content that has no progress to report.
 *
 * Reduced motion (m3.material.css) stops the pulse, so a loading row never flickers.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("m3-skeleton rounded-md bg-m3-surface-container-highest", className)}
      data-slot="skeleton"
      {...props}
    />
  );
}

export { Skeleton };
