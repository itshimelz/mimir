"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

// M3 badge: a compact label on a container role. Sizes and type stay on the app's
// `text-ui*` scale (AGENTS.md — UI text follows the size chosen in Settings) rather than
// M3's fixed `label-medium`; the shape, corner radius, and roles below are M3's.
const badgeVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-xs border border-transparent font-medium outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-3.5 sm:[&_svg:not([class*='size-'])]:size-3 [&_svg]:pointer-events-none [&_svg]:shrink-0 [button&,a&]:cursor-pointer [button&,a&]:pointer-coarse:after:absolute [button&,a&]:pointer-coarse:after:size-full [button&,a&]:pointer-coarse:after:min-h-11 [button&,a&]:pointer-coarse:after:min-w-11",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default:
          "h-5.5 min-w-5.5 px-[calc(--spacing(1)-1px)] text-ui-sm sm:h-4.5 sm:min-w-4.5 sm:text-ui-xs",
        lg: "h-6.5 min-w-6.5 px-[calc(--spacing(1.5)-1px)] text-ui sm:h-5.5 sm:min-w-5.5 sm:text-ui-sm",
        sm: "h-5 min-w-5 rounded-[.25rem] px-[calc(--spacing(1)-1px)] text-ui-xs sm:h-4 sm:min-w-4 sm:text-ui-2xs",
      },
      variant: {
        default: "bg-m3-primary text-m3-on-primary [button&,a&]:hover:bg-m3-primary/90",
        destructive: "bg-m3-error text-m3-on-error [button&,a&]:hover:bg-m3-error/90",
        // Tinted variants are `error-container` / `secondary-container` in M3 rather than a
        // low-alpha wash of the solid role, so the fill stays opaque and the pair is legible.
        error: "bg-m3-error-container text-m3-on-error-container",
        info: "bg-m3-secondary-container text-m3-on-secondary-container",
        outline: "border-m3-outline-variant bg-transparent text-m3-on-surface-variant",
        secondary: "bg-m3-surface-container-high text-m3-on-surface-variant",
        success: "bg-success/8 text-success dark:bg-success/16",
        warning: "bg-warning/8 text-warning dark:bg-warning/16",
      },
    },
  },
);

interface BadgeProps extends useRender.ComponentProps<"span"> {
  variant?: VariantProps<typeof badgeVariants>["variant"];
  size?: VariantProps<typeof badgeVariants>["size"];
}

function Badge({ className, variant, size, render, ...props }: BadgeProps) {
  const defaultProps = {
    className: cn(badgeVariants({ className, size, variant })),
    "data-slot": "badge",
  };

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(defaultProps, props),
    render,
  });
}

export { Badge, badgeVariants };
