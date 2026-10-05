// FILE: m3e/icon.tsx — Material Symbols passthrough with M3E sizing.
import { cn } from "@/lib/utils";

export function MIcon({ name, size = 20, className }: { name: string; size?: number; className?: string }) {
  return (
    <span aria-hidden data-slot="m3-icon" className={cn("material-symbols-rounded inline-flex shrink-0", className)} style={{ fontSize: size, lineHeight: 1 }}>
      {name}
    </span>
  );
}
