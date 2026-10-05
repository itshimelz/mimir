"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "~/lib/utils";
import { extendButtonIconChildSelectors } from "~/lib/central-icons";

/** Slightly softer outline border for header chrome buttons in dark mode. */
const headerButtonDarkBorderClassName =
  "dark:border-[color:color-mix(in_srgb,var(--color-border)_80%,transparent)]";

// Variant taxonomy (visual treatment) × size axis × content (icon / text / icon+text).
//
//   filled      → default (primary) | secondary | destructive | prominent
//   outlined    → outline | primary-outline | secondary-outline | destructive-outline | chrome-outline
//   ghostly     → ghost | chrome | subtle | link
//
// Sizes pair text variants (chip/xs/sm/default/lg/xl) with their square
// icon-only counterparts (icon-chip/icon-xs/icon-sm/icon/icon-lg/icon-xl) at
// matching heights, so a text button and an icon-only button sit on the same
// baseline in a toolbar row. `chip`/`icon-chip` are for inline action pills
// inside queued-message rows, badges, etc.
//
// Visual style is intentionally flat — no drop shadows, no inset highlights, no
// pseudo-element edge glints. Buttons are solid color + border + hover-bg only.
// If you need depth, add a single new variant rather than reintroducing shadows
// piecewise; the flat look is the project default and what most surfaces expect.
// That stays the rule under Material 3 too: the roles below are M3's, but the
// elevation M3E puts on its filled buttons is deliberately not adopted, because
// this axis has 137 call sites that were composed against a flat surface.
//
// Adding a new variant? Mirror an existing one's border/focus treatment so the
// family stays visually coherent. Prefer adding a variant over passing a
// className override at the call site.
//
// The `shape` axis is orthogonal to variant × size: `capsule` turns any
// variant into a fully rounded pill (dialog footers detect the `rounded-full`
// class and skip their radius/sizing override for capsules).
//
// Sizes and type stay on the `text-ui*` scale (AGENTS.md — UI text follows the
// size chosen in Settings); M3E's fixed label-large/title-medium are not used.
const buttonVariants = cva(
  extendButtonIconChildSelectors(
    "[&_svg]:-mx-0.5 relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border font-medium text-ui outline-none pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 focus-visible:ring-1 focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 sm:text-ui [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  ),
  {
    defaultVariants: {
      shape: "default",
      size: "default",
      variant: "default",
    },
    variants: {
      shape: {
        capsule: "rounded-full font-normal",
        default: "",
      },
      size: {
        chip: extendButtonIconChildSelectors(
          "h-auto gap-1 px-2 py-0.5 text-ui-sm sm:h-auto sm:text-ui-sm [&_svg:not([class*='size-'])]:size-3 sm:[&_svg:not([class*='size-'])]:size-3",
        ),
        default: "h-9 px-[calc(--spacing(3)-1px)] sm:h-8",
        icon: "size-9 sm:size-8",
        "icon-chip": extendButtonIconChildSelectors(
          "size-6 sm:size-6 [&_svg:not([class*='size-'])]:size-3 sm:[&_svg:not([class*='size-'])]:size-3",
        ),
        "icon-lg": "size-10 sm:size-9",
        "icon-sm": "size-8 sm:size-7",
        "icon-xl": extendButtonIconChildSelectors(
          "size-11 sm:size-10 [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
        ),
        "icon-xs": extendButtonIconChildSelectors(
          "size-7 rounded-sm sm:size-6 not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-4 sm:not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-3.5",
        ),
        lg: "h-10 px-[calc(--spacing(3.5)-1px)] sm:h-9",
        sm: "h-8 gap-1.5 px-[calc(--spacing(2.5)-1px)] sm:h-7",
        xl: extendButtonIconChildSelectors(
          "h-11 px-[calc(--spacing(4)-1px)] text-ui-lg sm:h-10 sm:text-ui-lg [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
        ),
        xs: extendButtonIconChildSelectors(
          "h-7 gap-1 rounded-sm px-[calc(--spacing(2)-1px)] text-ui-sm sm:h-6 sm:text-ui-xs [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-3.5",
        ),
      },
      variant: {
        // Ghost chrome: M3's container surface steps under on-surface-variant ink.
        chrome:
          "border-transparent bg-transparent text-m3-on-surface-variant focus-visible:ring-[color:var(--color-border-focus)]/60 focus-visible:ring-offset-0 [:hover,[data-pressed]]:bg-m3-surface-container-highest [:hover,[data-pressed]]:text-m3-on-surface data-pressed:bg-m3-surface-container-highest data-pressed:text-m3-on-surface",
        "chrome-outline": extendButtonIconChildSelectors(
          `border-m3-outline-variant bg-transparent text-m3-on-surface focus-visible:ring-[color:var(--color-border-focus)]/60 [:hover,[data-pressed]]:bg-m3-surface-container ${headerButtonDarkBorderClassName} dark:[:hover,[data-pressed]]:bg-m3-surface-container-highest [&_svg]:mx-0`,
        ),
        // M3's filled button: primary / on-primary.
        default:
          "border-transparent bg-m3-primary text-m3-on-primary [:hover,[data-pressed]]:bg-m3-primary/90",
        // M3's error button is error / on-error, not white on a raw destructive red.
        destructive:
          "border-transparent bg-m3-error text-m3-on-error [:hover,[data-pressed]]:bg-m3-error/90",
        // M3 has no second solid accent for destructive, so the outlined treatment is
        // the error role with its own tinted hover — the same shape M3E uses.
        "destructive-outline": extendButtonIconChildSelectors(
          "border-m3-outline-variant bg-transparent text-m3-error [:hover,[data-pressed]]:border-m3-error/32 [:hover,[data-pressed]]:bg-m3-error/10",
        ),
        ghost:
          "border-transparent bg-transparent text-m3-on-surface-variant focus-visible:ring-[color:var(--color-border-focus)]/60 focus-visible:ring-offset-0 [:hover,[data-pressed]]:bg-m3-surface-container-highest [:hover,[data-pressed]]:text-m3-on-surface data-pressed:bg-m3-surface-container-high data-pressed:text-m3-on-surface",
        link: "border-transparent text-m3-primary underline-offset-4 [:hover,[data-pressed]]:underline",
        outline:
          "border-m3-outline-variant bg-transparent text-m3-on-surface focus-visible:ring-[color:var(--color-border-focus)]/60 [:hover,[data-pressed]]:bg-m3-surface-container-highest dark:[:hover,[data-pressed]]:bg-m3-surface-container",
        "primary-outline": extendButtonIconChildSelectors(
          "border-m3-outline-variant bg-transparent text-m3-primary [:hover,[data-pressed]]:border-m3-primary/32 [:hover,[data-pressed]]:bg-m3-primary/10",
        ),
        // M3's inverse pair: the one button on a page that reads as its own surface.
        prominent:
          "rounded-full border-transparent bg-m3-inverse-surface text-m3-inverse-on-surface transition-[transform,opacity] duration-150 hover:scale-105 disabled:opacity-20 disabled:hover:scale-100",
        // M3's filled (tonal) button is a container surface, not a washed accent.
        secondary:
          "border-transparent bg-m3-surface-container-highest text-m3-on-surface-variant [:active,[data-pressed]]:bg-m3-surface-container-high [:hover,[data-pressed]]:bg-m3-surface-container-high",
        "secondary-outline": extendButtonIconChildSelectors(
          "border-m3-outline-variant bg-transparent text-m3-on-surface [:hover,[data-pressed]]:bg-m3-surface-container/60",
        ),
        subtle:
          "border-transparent bg-m3-surface-container text-m3-on-surface focus-visible:ring-[color:var(--color-border-focus)]/60 focus-visible:ring-offset-0 [:hover,[data-pressed]]:bg-m3-surface-container-highest",
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
function Button({ className, variant, size, shape, render, ...props }: ButtonProps) {
  const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>["type"] = render
    ? undefined
    : "button";

  const defaultProps = {
    className: cn(buttonVariants({ className, shape, size, variant })),
    "data-slot": "button",
    type: typeValue,
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
