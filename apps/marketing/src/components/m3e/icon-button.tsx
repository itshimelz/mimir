// FILE: m3e/icon-button.tsx — M3E IconButton (standard / filled / tonal / outlined).
"use client";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Ripple } from "@/components/m3e/ripple";

const m3IconButtonVariants = cva(
  "group/icon-button state-layer-circle focus-ring transition-shape relative inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none select-none disabled:pointer-events-none disabled:text-[color-mix(in_oklab,var(--md-sys-color-on-surface)_38%,transparent)] [&>*:not([data-slot=ripple])]:relative",
  {
    variants: {
      variant: {
        standard: "text-[var(--md-sys-color-on-surface-variant)]",
        filled: "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] disabled:bg-[color-mix(in_oklab,var(--md-sys-color-on-surface)_12%,transparent)]",
        "filled-tonal": "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] disabled:bg-[color-mix(in_oklab,var(--md-sys-color-on-surface)_12%,transparent)]",
        outlined: "border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)]",
      },
    },
    defaultVariants: { variant: "standard" },
  },
);

function MIconButton({ className, variant = "standard", children, ...props }: ButtonPrimitive.Props & VariantProps<typeof m3IconButtonVariants>) {
  return (
    <ButtonPrimitive data-slot="icon-button" data-variant={variant} className={cn(m3IconButtonVariants({ variant }), className)} {...props}>
      <Ripple />
      {children}
    </ButtonPrimitive>
  );
}

export { MIconButton, m3IconButtonVariants };
