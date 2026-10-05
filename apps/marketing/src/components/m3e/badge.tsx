// FILE: m3e/badge.tsx — M3E Badge (small / large, error container).
import { cn } from "@/lib/utils";

export function MBadge({ className, label, size = "small", ...props }: React.ComponentProps<"span"> & { label?: string; size?: "small" | "large" }) {
  return (
    <span data-slot="badge" className={cn("inline-flex items-center justify-center rounded-full bg-[var(--md-sys-color-error)] font-medium text-[var(--md-sys-color-on-error)]", size === "small" ? "size-[6px]" : "h-4 min-w-4 px-1 text-[11px]", className)} {...props}>
      {size === "large" ? label : null}
    </span>
  );
}
