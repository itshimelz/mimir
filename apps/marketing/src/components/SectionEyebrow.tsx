// FILE: SectionEyebrow.tsx
// Purpose: The small label that heads a page or a section on the sponsor
//          pages — "SPONSORS", "TOP DONORS", "MONTHLY TIERS" — using the
//          M3E label-large type role.
// Layer: Presentational component
// Depends on: lib/m3e/cn (cn)
// Note: `as` exists because the same treatment is a page eyebrow (a <p> above
//       the <h1>) in one spot and a real section heading (<h2>) in another —
//       the styling is shared, the document outline shouldn't be.

import { cn } from "@/lib/m3e/cn";

export function SectionEyebrow({
  children,
  as: Tag = "h2",
  className,
}: {
  children: React.ReactNode;
  as?: "h2" | "h3" | "p";
  className?: string;
}) {
  return (
    <Tag className={cn("text-label-large text-primary", className)}>
      {children}
    </Tag>
  );
}
