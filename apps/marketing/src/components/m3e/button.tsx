// FILE: m3e/button.tsx — M3E Button (filled/tonal/elevated/outlined/text,
// morphing pill radius on press, ripple, Base UI primitive).
"use client";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Ripple } from "@/components/m3e/ripple";

const m3ButtonVariants = cva(
  "group/button state-layer focus-ring transition-shape relative inline-flex shrink-0 cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap outline-none select-none disabled:pointer-events-none disabled:bg-[color-mix(in_oklab,var(--md-sys-color-on-surface)_12%,transparent)]! disabled:text-[color-mix(in_oklab,var(--md-sys-color-on-surface)_38%,transparent)]! disabled:shadow-none! [&_svg]:pointer-events-none [&_svg]:shrink-0 [&>*:not([data-slot=ripple])]:relative",
  {
    variants: {
      variant: {
        filled: "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:shadow-[var(--md-sys-elevation-1)]",
        tonal: "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:shadow-[var(--md-sys-elevation-1)]",
        elevated: "bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-primary)] shadow-[var(--md-sys-elevation-1)] hover:shadow-[var(--md-sys-elevation-2)]",
        outlined: "border border-[var(--md-sys-color-outline-variant)] bg-transparent text-[var(--md-sys-color-on-surface-variant)] disabled:border-transparent!",
        text: "bg-transparent text-[var(--md-sys-color-primary)] disabled:bg-transparent!",
      },
      size: {
        xs: "h-8 gap-2 px-4 text-[13px] font-medium rounded-[16px] active:rounded-[8px] [&_svg:not([class*='size-'])]:size-[18px]",
        sm: "h-10 gap-2 px-4 text-sm font-medium rounded-[20px] active:rounded-[8px] [&_svg:not([class*='size-'])]:size-5",
        default: "h-10 gap-2 px-4 text-sm font-medium rounded-[20px] active:rounded-[8px] [&_svg:not([class*='size-'])]:size-5",
        md: "h-14 gap-2 px-6 text-[15px] font-medium rounded-[28px] active:rounded-[12px] [&_svg:not([class*='size-'])]:size-6",
        lg: "h-16 gap-3 px-8 text-base font-medium rounded-[32px] active:rounded-[16px] [&_svg:not([class*='size-'])]:size-6",
        "icon-sm": "size-10 rounded-[20px] active:rounded-[8px] [&_svg:not([class*='size-'])]:size-5",
        icon: "size-10 rounded-[20px] active:rounded-[8px] [&_svg:not([class*='size-'])]:size-5",
        "icon-md": "size-14 rounded-[28px] active:rounded-[12px] [&_svg:not([class*='size-'])]:size-6",
      },
      shape: { round: "", square: "rounded-[12px]! active:rounded-[12px]!" },
    },
    defaultVariants: { variant: "filled", size: "default", shape: "round" },
  },
);

function MButton({ className, variant = "filled", size = "default", shape = "round", disableRipple, children, ...props }: ButtonPrimitive.Props & VariantProps<typeof m3ButtonVariants> & { disableRipple?: boolean }) {
  return (
    <ButtonPrimitive data-slot="button" data-variant={variant} data-size={size} className={cn(m3ButtonVariants({ variant, size, shape, className }))} {...props}>
      <Ripple disabled={disableRipple || variant === "text"} />
      {children}
    </ButtonPrimitive>
  );
}

export { MButton, m3ButtonVariants };
