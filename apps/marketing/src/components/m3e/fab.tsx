// FILE: m3e/fab.tsx — M3E FAB (container tones, expressive radius).
"use client";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Ripple } from "@/components/m3e/ripple";

const m3FabVariants = cva(
  "group/fab state-layer focus-ring transition-shape relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 overflow-hidden font-medium whitespace-nowrap shadow-[var(--md-sys-elevation-3)] outline-none select-none hover:shadow-[var(--md-sys-elevation-4,0_6px_10px_4px_rgb(0_0_0/0.1))] disabled:pointer-events-none disabled:bg-[color-mix(in_oklab,var(--md-sys-color-on-surface)_12%,transparent)] disabled:text-[color-mix(in_oklab,var(--md-sys-color-on-surface)_38%,transparent)] disabled:shadow-none [&>*:not([data-slot=ripple])]:relative",
  {
    variants: {
      color: {
        "primary-container": "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]",
        "secondary-container": "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]",
        "tertiary-container": "bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]",
        primary: "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]",
      },
      size: {
        small: "h-10 min-w-10 gap-1.5 rounded-[12px] px-3 text-[13px] active:rounded-[8px] [&_svg:not([class*='size-'])]:size-5",
        medium: "h-14 min-w-14 gap-2 rounded-[16px] px-4 text-sm active:rounded-[12px] [&_svg:not([class*='size-'])]:size-6",
        large: "h-24 min-w-24 flex-col gap-1 rounded-[28px] px-4 text-[15px] active:rounded-[20px] [&_svg:not([class*='size-'])]:size-9",
        extended: "h-14 gap-3 rounded-[16px] px-5 text-sm active:rounded-[12px] [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: { color: "primary-container", size: "medium" },
  },
);

function MFab({ className, color, size, children, ...props }: ButtonPrimitive.Props & VariantProps<typeof m3FabVariants>) {
  return (
    <ButtonPrimitive data-slot="fab" className={cn(m3FabVariants({ color, size }), className)} {...props}>
      <Ripple />
      {children}
    </ButtonPrimitive>
  );
}

export { MFab, m3FabVariants };
