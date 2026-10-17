import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

const cardVariants = cva(
  "group/card relative flex flex-col gap-(--card-spacing) overflow-hidden rounded-md py-(--card-spacing) text-ui text-card-foreground transition-[background-color,border-color,box-shadow] duration-150 ease-out [--card-spacing:--spacing(4)] has-[>img:first-child]:pt-0 data-[size=lg]:[--card-spacing:--spacing(6)] data-[size=sm]:[--card-spacing:--spacing(3)] *:[img:first-child]:rounded-t-md *:[img:last-child]:rounded-b-md",
  {
    variants: {
      variant: {
        muted: "bg-[var(--color-background-elevated-secondary)]",
        raised: "app-elevated-panel bg-[var(--color-background-elevated-primary-opaque)]",
        plain: "app-elevated-panel bg-card",
      },
      /* adds hover/press feedback for clickable cards */
      interactive: {
        true: "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background hover:bg-[var(--color-background-elevated-secondary)]",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "raised",
        interactive: true,
        className: "app-elevated-prominent data-press:app-elevated-panel",
      },
      {
        variant: "muted",
        interactive: true,
        className: "hover:shadow-sm data-press:shadow-none",
      },
    ],
    defaultVariants: {
      variant: "plain",
      interactive: false,
    },
  },
);

function Card({
  className,
  size = "default",
  variant,
  interactive,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof cardVariants> & { size?: "default" | "sm" | "lg" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-variant={variant ?? "outlined"}
      className={cn(cardVariants({ variant, interactive }), className)}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-medium text-ui-lg leading-snug tracking-tight text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-ui-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("px-(--card-spacing)", className)} {...props} />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center gap-2 px-(--card-spacing) [.border-t]:pt-(--card-spacing)",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
};
