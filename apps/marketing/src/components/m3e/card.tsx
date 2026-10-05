// FILE: m3e/card.tsx — M3E Card (filled/elevated/outlined, M3 type roles).
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const m3CardVariants = cva(
  "group/card transition-shape relative flex flex-col gap-[var(--card-spacing)] overflow-hidden rounded-[12px] py-[var(--card-spacing)] text-[15px] leading-[1.5] text-[var(--md-sys-color-on-surface)] [--card-spacing:calc(var(--spacing)*4)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:calc(var(--spacing)*3)] data-[size=lg]:[--card-spacing:calc(var(--spacing)*6)]",
  {
    variants: {
      variant: {
        filled: "bg-[var(--md-sys-color-surface-container-highest)]",
        elevated: "bg-[var(--md-sys-color-surface-container-low)] shadow-[var(--md-sys-elevation-1)]",
        outlined: "border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]",
      },
      interactive: { true: "state-layer cursor-pointer", false: "" },
    },
    defaultVariants: { variant: "filled", interactive: false },
  },
);

function MCard({ className, size = "default", variant, interactive, ...props }: React.ComponentProps<"div"> & { size?: "default" | "sm" | "lg" } & VariantProps<typeof m3CardVariants>) {
  return <div data-slot="card" data-size={size} data-variant={variant ?? "filled"} className={cn(m3CardVariants({ variant, interactive }), className)} {...props} />;
}
function MCardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("grid auto-rows-min items-start gap-1 px-[var(--card-spacing)]", className)} {...props} />;
}
function MCardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-title" className={cn("text-[19px] leading-[1.4] font-medium tracking-[-0.01em]", className)} {...props} />;
}
function MCardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-[14px] leading-[1.6] text-[var(--md-sys-color-on-surface-variant)]", className)} {...props} />;
}
function MCardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-[var(--card-spacing)]", className)} {...props} />;
}
function MCardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center gap-2 px-[var(--card-spacing)]", className)} {...props} />;
}

export { MCard, MCardHeader, MCardFooter, MCardTitle, MCardDescription, MCardContent, m3CardVariants };
