import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "~/lib/utils";

// M3 alert: a filled container role with no border. M3 carries the tone in the fill
// (`error-container` / `secondary-container`) instead of a border over a 4% wash, which is
// what lets the border go away and the corners take the shape scale.
const alertVariants = cva(
  "relative grid w-full items-start gap-x-2 gap-y-0.5 rounded-lg text-ui leading-snug has-[>svg]:has-data-[slot=alert-action]:grid-cols-[calc(var(--spacing)*4)_1fr_auto] has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-data-[slot=alert-action]:grid-cols-[1fr_auto] has-[>svg]:gap-x-2 [&>svg]:h-lh [&>svg]:w-4",
  {
    defaultVariants: {
      variant: "default",
      size: "default",
    },
    variants: {
      variant: {
        default:
          "bg-m3-surface-container-high text-m3-on-surface [&>svg]:text-m3-on-surface-variant",
        error: "bg-m3-error-container text-m3-on-error-container",
        info: "bg-m3-secondary-container text-m3-on-secondary-container",
        success: "bg-success/8 text-m3-on-surface [&>svg]:text-success",
        warning: "bg-warning/8 text-m3-on-surface [&>svg]:text-warning",
      },
      size: {
        default: "px-3.5 py-3",
        // Dense inline callout for panel chrome (source control / diff errors).
        sm: "rounded-md px-2.5 py-1.5",
      },
    },
  },
);

function Alert({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      className={cn(alertVariants({ variant, size }), className)}
      data-slot="alert"
      role="alert"
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("font-medium [svg~&]:col-start-2", className)}
      data-slot="alert-title"
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        // M3 puts the description on the variant's own on-container role, one step down
        // from the title, rather than a shared muted grey.
        "flex flex-col gap-2.5 text-current opacity-80 [svg~&]:col-start-2",
        className,
      )}
      data-slot="alert-description"
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex gap-1 max-sm:col-start-2 max-sm:mt-2 sm:row-start-1 sm:row-end-3 sm:self-center sm:[[data-slot=alert-description]~&]:col-start-2 sm:[[data-slot=alert-title]~&]:col-start-2 sm:[svg~&]:col-start-2 sm:[svg~[data-slot=alert-description]~&]:col-start-3 sm:[svg~[data-slot=alert-title]~&]:col-start-3",
        className,
      )}
      data-slot="alert-action"
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
