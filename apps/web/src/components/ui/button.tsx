"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "~/lib/utils";
import { extendButtonIconChildSelectors } from "~/lib/central-icons";
import { Ripple } from "./ripple";

/** Slightly softer outline border for header chrome buttons in dark mode. */
const headerButtonDarkBorderClassName =
  "dark:border-[color:color-mix(in_srgb,var(--color-border)_80%,transparent)]";

// Variant taxonomy (visual treatment) × size axis × content (icon / text / icon+text).
//
//   filled      → default (primary) | secondary | destructive | prominent
//   outlined    → outline | primary-outline | secondary-outline | destructive-outline | chrome-outline
//   ghostly     → ghost | chrome | subtle | link
//
// M3 Expressive adds shape morphing on press, elevation shadows, state layers,
// and smooth spring transitions.
const buttonVariants = cva(
  extendButtonIconChildSelectors(
    "[&_svg]:-mx-0.5 state-layer relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-[var(--btn-r,var(--radius-lg))] border font-medium text-ui outline-none transition-shape focus-ring pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 disabled:pointer-events-none disabled:opacity-64 data-press:rounded-[var(--btn-r-pressed,var(--radius-sm))] sm:text-ui [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&>*:not([data-slot=ripple])]:relative [&>*:not([data-slot=ripple])]:z-1",
  ),
  {
    defaultVariants: {
      shape: "default",
      size: "default",
      variant: "default",
    },
    variants: {
      shape: {
        capsule: "rounded-full font-normal [--btn-r:9999px] [--btn-r-pressed:9999px]",
        round: "rounded-full [--btn-r:9999px] [--btn-r-pressed:9999px]",
        square: "[--btn-r:var(--btn-r-square)]",
        default: "",
      },
      size: {
        chip: extendButtonIconChildSelectors(
          "h-auto gap-1 px-2 py-0.5 text-ui-sm sm:h-auto sm:text-ui-sm [--btn-r:9999px] [--btn-r-pressed:var(--radius-sm)] [&_svg:not([class*='size-'])]:size-3 sm:[&_svg:not([class*='size-'])]:size-3",
        ),
        default:
          "h-9 px-4 sm:h-8 [--btn-r:9999px] [--btn-r-pressed:var(--radius-md)] [--btn-r-square:var(--radius-md)]",
        icon: "size-9 sm:size-8 [--btn-r:9999px] [--btn-r-pressed:var(--radius-md)] [--btn-r-square:var(--radius-md)]",
        "icon-chip": extendButtonIconChildSelectors(
          "size-6 sm:size-6 [--btn-r:9999px] [--btn-r-pressed:var(--radius-xs)] [&_svg:not([class*='size-'])]:size-3 sm:[&_svg:not([class*='size-'])]:size-3",
        ),
        "icon-lg":
          "size-10 sm:size-9 [--btn-r:9999px] [--btn-r-pressed:var(--radius-lg)] [--btn-r-square:var(--radius-lg)]",
        "icon-sm":
          "size-8 sm:size-7 [--btn-r:9999px] [--btn-r-pressed:var(--radius-sm)] [--btn-r-square:var(--radius-sm)]",
        "icon-xl": extendButtonIconChildSelectors(
          "size-11 sm:size-10 [--btn-r:9999px] [--btn-r-pressed:var(--radius-xl)] [--btn-r-square:var(--radius-xl)] [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
        ),
        "icon-xs": extendButtonIconChildSelectors(
          "size-7 sm:size-6 [--btn-r:9999px] [--btn-r-pressed:var(--radius-xs)] [--btn-r-square:var(--radius-xs)] not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-4 sm:not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-3.5",
        ),
        lg: "h-10 px-5 sm:h-9 [--btn-r:9999px] [--btn-r-pressed:var(--radius-lg)] [--btn-r-square:var(--radius-lg)]",
        sm: "h-8 gap-1.5 px-3 sm:h-7 [--btn-r:9999px] [--btn-r-pressed:var(--radius-sm)] [--btn-r-square:var(--radius-sm)]",
        xl: extendButtonIconChildSelectors(
          "h-11 px-6 text-ui-lg sm:h-10 sm:text-ui-lg [--btn-r:9999px] [--btn-r-pressed:var(--radius-xl)] [--btn-r-square:var(--radius-xl)] [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
        ),
        xs: extendButtonIconChildSelectors(
          "h-7 gap-1 px-2.5 text-ui-sm sm:h-6 sm:text-ui-xs [--btn-r:9999px] [--btn-r-pressed:var(--radius-xs)] [--btn-r-square:var(--radius-xs)] [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-3.5",
        ),
      },
      variant: {
        /* Material 3 Expressive variants */
        filled:
          "border-transparent bg-primary text-primary-foreground hover:shadow-elevation-1 data-press:shadow-none [:hover,[data-pressed]]:bg-primary/90",
        tonal:
          "border-transparent bg-secondary text-secondary-foreground hover:shadow-elevation-1 data-press:shadow-none [:hover,[data-pressed]]:bg-secondary/90",
        elevated:
          "border-transparent bg-[var(--color-surface-container-low,var(--card))] text-primary shadow-elevation-1 hover:shadow-elevation-2 data-press:shadow-elevation-1",
        outlined:
          "border-[color:var(--color-border)] bg-transparent text-[var(--color-text-foreground)] hover:bg-secondary/15 data-press:bg-secondary/25",
        text: "border-transparent bg-transparent text-primary hover:bg-primary/10 data-press:bg-primary/20",
        /* Standard app variants */
        chrome:
          "border-transparent bg-transparent text-[var(--color-text-foreground-secondary)] focus-visible:ring-[color:var(--color-border-focus)]/60 focus-visible:ring-offset-0 [:hover,[data-pressed]]:bg-[var(--color-background-elevated-secondary)] [:hover,[data-pressed]]:text-[var(--color-text-foreground)] data-pressed:bg-[var(--color-background-elevated-secondary)] data-pressed:text-[var(--color-text-foreground)]",
        "chrome-outline": extendButtonIconChildSelectors(
          `border-[color:var(--color-border)] bg-transparent text-[var(--color-text-foreground)] focus-visible:ring-[color:var(--color-border-focus)]/60 [:hover,[data-pressed]]:bg-secondary ${headerButtonDarkBorderClassName} dark:[:hover,[data-pressed]]:bg-secondary [&_svg]:mx-0`,
        ),
        default:
          "border-transparent bg-primary text-primary-foreground hover:shadow-elevation-1 data-press:shadow-none [:hover,[data-pressed]]:bg-primary/90",
        destructive:
          "border-destructive bg-destructive text-white hover:shadow-elevation-1 data-press:shadow-none [:hover,[data-pressed]]:bg-destructive/90",
        "destructive-outline":
          "border-[color:var(--color-border)] bg-[var(--color-background-elevated-primary-opaque)] text-destructive [:hover,[data-pressed]]:border-destructive/32 [:hover,[data-pressed]]:bg-destructive/4 [:hover,[data-pressed]]:text-destructive",
        ghost:
          "border-transparent bg-transparent text-[var(--color-text-foreground-secondary)] focus-visible:ring-[color:var(--color-border-focus)]/60 focus-visible:ring-offset-0 [:hover,[data-pressed]]:bg-[var(--color-background-button-secondary-hover)] [:hover,[data-pressed]]:text-[var(--color-text-foreground)] data-pressed:bg-[var(--color-background-button-secondary)] data-pressed:text-[var(--color-text-foreground)]",
        link: "border-transparent underline-offset-4 [:hover,[data-pressed]]:underline",
        outline:
          "border-[color:var(--color-border)] bg-transparent text-[var(--color-text-foreground)] focus-visible:ring-[color:var(--color-border-focus)]/60 [:hover,[data-pressed]]:bg-[var(--color-background-elevated-secondary)] dark:[:hover,[data-pressed]]:bg-[var(--color-background-elevated-secondary)]",
        "primary-outline":
          "border-[color:var(--color-border)] bg-[var(--color-background-elevated-primary-opaque)] text-primary [:hover,[data-pressed]]:border-primary/32 [:hover,[data-pressed]]:bg-primary/4",
        prominent:
          "rounded-full border-transparent bg-[var(--color-text-foreground)] text-[var(--color-background-surface)] transition-[transform,opacity] duration-150 hover:scale-105 hover:shadow-elevation-1 disabled:opacity-20 disabled:hover:scale-100",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:shadow-elevation-1 data-press:shadow-none [:active,[data-pressed]]:bg-secondary/80 [:hover,[data-pressed]]:bg-secondary/90",
        "secondary-outline":
          "border-[color:var(--color-border)] bg-[var(--color-background-elevated-primary-opaque)] text-[var(--color-text-foreground)] [:hover,[data-pressed]]:bg-secondary/12",
        subtle:
          "border-transparent bg-[var(--color-background-button-secondary)] text-[var(--color-text-foreground)] focus-visible:ring-[color:var(--color-border-focus)]/60 focus-visible:ring-offset-0 [:hover,[data-pressed]]:bg-[var(--color-background-button-secondary-hover)]",
      },
    },
    compoundVariants: [
      {
        class:
          "!box-border !h-auto !min-h-7 gap-1.5 rounded-lg px-[calc(--spacing(2.5)-1px)] !py-0.5 text-ui sm:!h-auto sm:px-[calc(--spacing(2.5)-1px)] sm:text-ui-sm",
        size: "xs",
        variant: "chrome-outline",
      },
      {
        class: "!size-8 rounded-lg sm:!size-7",
        size: "icon-xs",
        variant: "chrome-outline",
      },
      // Last, so a size's own radius (xs, icon-xs) never squares a capsule off.
      { class: "rounded-full", shape: "capsule" },
    ],
  },
);

interface ButtonProps extends useRender.ComponentProps<"button"> {
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  shape?: VariantProps<typeof buttonVariants>["shape"];
}

// `ref` rides along in `...props` instead of going through `forwardRef`: React 19 passes it as a
// plain prop, and `mergeProps` forwards it to the rendered element either way. Pulling it out into
// a local made React Compiler read the whole component as a ref access during render and skip it —
// which costs every button on screen its auto-memoization.
function Button({ className, variant, size, shape, render, children, ...props }: ButtonProps) {
  const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>["type"] = render
    ? undefined
    : "button";

  const defaultProps = {
    className: cn(buttonVariants({ className, shape, size, variant })),
    "data-slot": "button",
    type: typeValue,
    children: (
      <>
        {children}
        <Ripple />
      </>
    ),
  };

  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  });
}

/** Dialog footers and inline error actions share this sizing override. */
const dialogActionButtonClassName =
  "!h-auto !min-h-8 !rounded-md !px-3 !py-1 !font-normal sm:!min-h-7";

export { Button, buttonVariants, dialogActionButtonClassName, headerButtonDarkBorderClassName };
