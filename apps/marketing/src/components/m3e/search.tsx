// FILE: m3e/search.tsx — M3E Search bar (rounded-full container-high).
"use client";
import { cn } from "@/lib/utils";
import { MIcon } from "@/components/m3e/icon";

export function MSearchBar({ className, placeholder = "Search", value, onChange, ...props }: React.ComponentProps<"div"> & { placeholder?: string; value?: string; onChange?: (v: string) => void }) {
  return (
    <div data-slot="search-bar" role="search" className={cn("flex h-14 w-full items-center gap-1 rounded-full bg-[var(--md-sys-color-surface-container-high)] px-1 text-[var(--md-sys-color-on-surface-variant)] shadow-[var(--md-sys-elevation-1)]", className)} {...props}>
      <span className="flex size-12 items-center justify-center"><MIcon name="search" size={24} /></span>
      <input value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-[16px] text-[var(--md-sys-color-on-surface)] outline-none placeholder:text-[var(--md-sys-color-on-surface-variant)]" />
      {value ? (
        <button type="button" aria-label="Clear search" onClick={() => onChange?.("")} className="state-layer-circle flex size-10 items-center justify-center rounded-full">
          <MIcon name="close" size={20} />
        </button>
      ) : null}
    </div>
  );
}
