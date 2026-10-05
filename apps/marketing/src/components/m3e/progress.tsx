// FILE: m3e/progress.tsx — M3E Linear progress (wavy expressive track).
"use client";
import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { cn } from "@/lib/utils";

export function MProgress({ className, value, ...props }: ProgressPrimitive.Root.Props & { value?: number | null }) {
  return (
    <ProgressPrimitive.Root data-slot="progress" value={value} className={cn("relative h-1 w-full overflow-hidden rounded-full bg-[var(--md-sys-color-surface-container-highest)]", className)} {...props}>
      <ProgressPrimitive.Track className="block h-full w-full">
        <ProgressPrimitive.Indicator className="block h-full rounded-full bg-[var(--md-sys-color-primary)] transition-[width] duration-300" />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}

export function MLoadingIndicator({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span role="progressbar" aria-label={label} data-slot="loading-indicator" className={cn("m3-loading inline-flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="m3-loading-dot size-[5px] rounded-full bg-[var(--md-sys-color-primary)]" style={{ animationDelay: `${i * 0.16}s` }} />
      ))}
      <style>{`.m3-loading-dot{animation:m3-loading 1.1s infinite ease-in-out}@keyframes m3-loading{0%,100%{transform:scale(0.6);opacity:.5}50%{transform:scale(1.15);opacity:1}}@media (prefers-reduced-motion:reduce){.m3-loading-dot{animation:none}}`}</style>
    </span>
  );
}
