// FILE: m3e/chip.tsx — M3E Assist / Filter / Input chips.
"use client";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { MIcon } from "@/components/m3e/icon";
import { Ripple } from "@/components/m3e/ripple";

const m3ChipVariants = cva(
  "group/chip state-layer focus-ring transition-shape relative inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-[8px] px-4 text-sm font-medium whitespace-nowrap outline-none select-none disabled:pointer-events-none disabled:opacity-38 has-data-[slot=chip-leading]:pl-3",
  {
    variants: {
      variant: { flat: "border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)]", elevated: "bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] shadow-[var(--md-sys-elevation-1)]" },
      size: { default: "", lg: "h-14 px-6 text-[15px] has-data-[slot=chip-leading]:pl-4" },
    },
    defaultVariants: { variant: "flat", size: "default" },
  },
);

function MAssistChip({ className, variant, size, icon, children, ...props }: ButtonPrimitive.Props & VariantProps<typeof m3ChipVariants> & { icon?: string | React.ReactNode }) {
  return (
    <ButtonPrimitive data-slot="chip" className={cn(m3ChipVariants({ variant, size }), className)} {...props}>
      <Ripple />
      {icon ? <span data-slot="chip-leading" className="inline-flex text-[var(--md-sys-color-primary)]">{typeof icon === "string" ? <MIcon name={icon} size={20} /> : icon}</span> : null}
      {children}
    </ButtonPrimitive>
  );
}

function MFilterChip({ className, variant, size, icon, pressed, children, ...props }: TogglePrimitive.Props & VariantProps<typeof m3ChipVariants> & { icon?: string | React.ReactNode }) {
  return (
    <TogglePrimitive data-slot="filter-chip" data-pressed={pressed ? "" : undefined} className={cn(m3ChipVariants({ variant, size }), "group data-pressed:border-transparent data-pressed:bg-[var(--md-sys-color-secondary-container)] data-pressed:text-[var(--md-sys-color-on-secondary-container)]", className)} pressed={pressed} {...props}>
      <Ripple />
      <span data-slot="chip-leading" className="inline-flex data-pressed:text-[var(--md-sys-color-on-secondary-container)]">
        <span className="hidden group-data-pressed:inline-flex"><MIcon name="check" size={20} /></span>
        <span className="inline-flex group-data-pressed:hidden">{typeof icon === "string" ? <MIcon name={icon} size={20} /> : (icon ?? null)}</span>
      </span>
      {children}
    </TogglePrimitive>
  );
}

export { MAssistChip, MFilterChip, m3ChipVariants };
