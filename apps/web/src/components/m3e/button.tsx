"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { Ripple } from "@/components/m3e/ripple";
import { cn } from "~/lib/utils";

/*
 * M3 Expressive button.
 *
 * Icon sizes (icon-*) also take width="narrow" | "wide" (M3E icon button widths).
 *
 * Each size sets three corner radii as CSS variables:
 *   --btn-r          resting corner (round = half the height, square = size-specific)
 *   --btn-r-pressed  corner while pressed (the M3E shape morph)
 *   --btn-r-selected corner of a selected toggle (round ↔ square swap)
 */
const buttonVariants = cva(
  "group/button state-layer relative inline-flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-(--btn-r) border border-transparent whitespace-nowrap focus-ring transition-shape outline-none select-none disabled:pointer-events-none disabled:cursor-default disabled:border-transparent! disabled:bg-m3-on-surface/10! disabled:text-m3-on-surface/38! disabled:shadow-none! aria-invalid:border-m3-error data-press:rounded-(--btn-r-pressed) [&_svg]:pointer-events-none [&_svg]:shrink-0 [&>*:not([data-slot=ripple])]:relative [&>*:not([data-slot=ripple])]:z-1",
  {
    variants: {
      variant: {
        /* M3 names */
        filled: "bg-m3-primary text-m3-on-primary hover:shadow-elevation-1 data-press:shadow-none",
        tonal:
          "bg-m3-secondary-container text-m3-on-secondary-container hover:shadow-elevation-1 data-press:shadow-none",
        elevated:
          "bg-m3-surface-container-low text-m3-primary shadow-elevation-1 hover:shadow-elevation-2 data-press:shadow-elevation-1",
        outlined:
          "border-m3-outline-variant bg-transparent text-m3-on-surface-variant hover:bg-m3-surface-container-high/60 disabled:border-m3-on-surface/12! aria-expanded:bg-m3-surface-container-high",
        text: "bg-transparent text-m3-primary hover:bg-m3-surface-container-high/60 disabled:bg-transparent! aria-expanded:bg-m3-surface-container-high",
        /* shadcn names */
        default: "bg-m3-primary text-m3-on-primary hover:shadow-elevation-1 data-press:shadow-none",
        secondary:
          "bg-m3-secondary-container text-m3-on-secondary-container hover:shadow-elevation-1 data-press:shadow-none",
        tertiary:
          "bg-m3-surface-container-high text-m3-on-surface hover:shadow-elevation-1 data-press:shadow-none",
        outline:
          "border-m3-outline-variant bg-transparent text-m3-on-surface-variant hover:bg-m3-surface-container-high/60 disabled:border-m3-on-surface/12! aria-expanded:bg-m3-surface-container-high",
        ghost:
          "bg-transparent text-m3-on-surface-variant hover:bg-m3-surface-container-high hover:text-m3-on-surface disabled:bg-transparent! aria-expanded:bg-m3-surface-container-high",
        destructive: "bg-m3-error text-m3-on-error hover:shadow-elevation-1 data-press:shadow-none",
        link: "state-layer-transparent bg-transparent text-m3-primary underline-offset-4 hover:underline disabled:bg-transparent!",
      },
      size: {
        xs: "h-8 gap-2 px-3 text-ui font-medium [--btn-h2:16px] [--btn-r-pressed:var(--radius-sm)] [--btn-r-square:var(--radius-md)] [--btn-r:16px] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-4",
        sm: "h-9 gap-2 px-3.5 text-ui font-medium [--btn-h2:18px] [--btn-r-pressed:var(--radius-sm)] [--btn-r-square:var(--radius-md)] [--btn-r:18px] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-4.5",
        default:
          "h-10 gap-2 px-4 text-ui font-medium [--btn-h2:20px] [--btn-r-pressed:var(--radius-sm)] [--btn-r-square:var(--radius-md)] [--btn-r:20px] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-5",
        md: "h-12 gap-2 px-6 text-ui font-medium [--btn-h2:24px] [--btn-r-pressed:var(--radius-md)] [--btn-r-square:var(--radius-lg)] [--btn-r:24px] has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5 [&_svg:not([class*='size-'])]:size-6",
        lg: "h-14 gap-3 px-8 text-ui-lg font-medium [--btn-h2:28px] [--btn-r-pressed:var(--radius-lg)] [--btn-r-square:var(--radius-2xl)] [--btn-r:28px] data-[variant=outline]:border-2 data-[variant=outlined]:border-2 [&_svg:not([class*='size-'])]:size-6",
        xl: "h-16 gap-4 px-10 text-ui-lg font-medium [--btn-h2:32px] [--btn-r-pressed:var(--radius-lg)] [--btn-r-square:var(--radius-2xl)] [--btn-r:32px] data-[variant=outline]:border-2 data-[variant=outlined]:border-2 [&_svg:not([class*='size-'])]:size-8",
        /* icon buttons */
        "icon-xs":
          "size-7 [--btn-h2:14px] [--btn-r-pressed:var(--radius-sm)] [--btn-r-square:var(--radius-md)] [--btn-r:14px] [&_svg:not([class*='size-'])]:size-4",
        "icon-sm":
          "size-8 [--btn-h2:16px] [--btn-r-pressed:var(--radius-sm)] [--btn-r-square:var(--radius-md)] [--btn-r:16px] [&_svg:not([class*='size-'])]:size-4.5",
        icon: "size-9 [--btn-h2:18px] [--btn-r-pressed:var(--radius-sm)] [--btn-r-square:var(--radius-md)] [--btn-r:18px] [&_svg:not([class*='size-'])]:size-5",
        "icon-md":
          "size-12 [--btn-h2:24px] [--btn-r-pressed:var(--radius-md)] [--btn-r-square:var(--radius-lg)] [--btn-r:24px] [&_svg:not([class*='size-'])]:size-6",
        "icon-lg":
          "size-14 [--btn-h2:28px] [--btn-r-pressed:var(--radius-lg)] [--btn-r-square:var(--radius-2xl)] [--btn-r:28px] [&_svg:not([class*='size-'])]:size-6",
        "icon-xl":
          "size-16 [--btn-h2:32px] [--btn-r-pressed:var(--radius-lg)] [--btn-r-square:var(--radius-2xl)] [--btn-r:32px] [&_svg:not([class*='size-'])]:size-8",
      },
      shape: {
        round: "",
        square: "[--btn-r:var(--btn-r-square)]",
      },
      /* icon buttons: M3E offers three widths at every size */
      width: {
        default: "",
        narrow: "",
        wide: "",
      },
    },
    compoundVariants: [
      { size: "icon-xs", width: "narrow", className: "w-[24px]!" },
      { size: "icon-xs", width: "wide", className: "w-[36px]!" },
      { size: "icon-sm", width: "narrow", className: "w-[28px]!" },
      { size: "icon-sm", width: "wide", className: "w-[44px]!" },
      { size: "icon", width: "narrow", className: "w-[32px]!" },
      { size: "icon", width: "wide", className: "w-[52px]!" },
      { size: "icon-md", width: "narrow", className: "w-[44px]!" },
      { size: "icon-md", width: "wide", className: "w-[68px]!" },
      { size: "icon-lg", width: "narrow", className: "w-[56px]!" },
      { size: "icon-lg", width: "wide", className: "w-[112px]!" },
      { size: "icon-xl", width: "narrow", className: "w-[80px]!" },
      { size: "icon-xl", width: "wide", className: "w-[160px]!" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "round",
      width: "default",
    },
  },
);

interface ButtonProps
  extends useRender.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  disableRipple?: boolean;
}

function Button({
  className,
  variant = "default",
  size = "default",
  shape = "round",
  width = "default",
  disableRipple,
  render,
  children,
  ...props
}: ButtonProps) {
  const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>["type"] = render
    ? undefined
    : "button";

  const defaultProps = {
    className: cn(buttonVariants({ variant, size, shape, width, className })),
    "data-slot": "button",
    "data-variant": variant,
    "data-size": size,
    type: typeValue,
    children: (
      <>
        <Ripple disabled={disableRipple || variant === "link"} />
        {children}
      </>
    ),
  };

  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  });
}

export { Button, buttonVariants };
export type { ButtonProps };
