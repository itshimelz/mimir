// FILE: m3e/segmented-button.tsx — M3E Segmented buttons (single-select).
"use client";
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { cn } from "@/lib/utils";
import { MIcon } from "@/components/m3e/icon";
import { Ripple } from "@/components/m3e/ripple";

export function MSegmentedGroup({ className, ...props }: ToggleGroupPrimitive.Props) {
  return <ToggleGroupPrimitive data-slot="segmented-group" className={cn("inline-flex items-stretch gap-[2px] rounded-full", className)} {...props} />;
}

export function MSegmentedItem({ className, icon, children, value, ...props }: TogglePrimitive.Props & { icon?: string }) {
  return (
    <TogglePrimitive data-slot="segmented-item" value={value} className={cn("group/seg state-layer focus-ring transition-shape relative inline-flex h-10 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full border border-[var(--md-sys-color-outline-variant)] px-4 text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] outline-none select-none first:rounded-l-full last:rounded-r-full data-pressed:border-transparent data-pressed:bg-[var(--md-sys-color-secondary-container)] data-pressed:text-[var(--md-sys-color-on-secondary-container)]", className)} {...props}>
      <Ripple />
      {icon ? <MIcon name={icon} size={18} className="hidden group-data-pressed:inline-flex" /> : null}
      {children}
    </TogglePrimitive>
  );
}
