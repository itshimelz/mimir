import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const Tabs = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, orientation = "horizontal", ...props }, ref) => (
  <TabsPrimitive.Root
    ref={ref}
    data-slot="tabs"
    data-orientation={orientation}
    orientation={orientation}
    className={cn(
      "group/tabs flex gap-4 data-[orientation=horizontal]:flex-col",
      className,
    )}
    {...props}
  />
));
Tabs.displayName = "Tabs";

export const tabsListVariants = cva(
  "group/tabs-list relative inline-flex items-center text-muted-foreground group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col group-data-vertical/tabs:items-stretch group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col group-data-[orientation=vertical]/tabs:items-stretch",
  {
    variants: {
      variant: {
        default:
          "h-12 w-full border-b border-border group-data-vertical/tabs:border-b-0 group-data-vertical/tabs:border-r group-data-[orientation=vertical]/tabs:border-b-0 group-data-[orientation=vertical]/tabs:border-r",
        primary:
          "h-12 w-full border-b border-border group-data-vertical/tabs:border-b-0 group-data-vertical/tabs:border-r group-data-[orientation=vertical]/tabs:border-b-0 group-data-[orientation=vertical]/tabs:border-r",
        secondary:
          "h-12 w-full border-b border-border group-data-vertical/tabs:border-b-0 group-data-vertical/tabs:border-r group-data-[orientation=vertical]/tabs:border-b-0 group-data-[orientation=vertical]/tabs:border-r",
        line: "h-12 w-full border-b border-border group-data-vertical/tabs:border-b-0 group-data-vertical/tabs:border-r group-data-[orientation=vertical]/tabs:border-b-0 group-data-[orientation=vertical]/tabs:border-r",
        segmented: "h-10 w-fit gap-0.5 rounded-lg bg-muted p-1 group-data-vertical/tabs:h-fit",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface TabsListProps
  extends
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, variant = "default", children, ...props }, ref) => (
    <TabsPrimitive.List
      ref={ref}
      data-slot="tabs-list"
      data-variant={variant ?? "default"}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    >
      {children}
      <TabsIndicator />
    </TabsPrimitive.List>
  ),
);
TabsList.displayName = "TabsList";

const TabsIndicator = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Indicator
    ref={ref}
    data-slot="tabs-indicator"
    className={cn(
      "pointer-events-none absolute z-0 transition-[left,width,top,height] duration-150 ease-out",
      "group-data-[variant=default]/tabs-list:bg-primary group-data-[variant=primary]/tabs-list:bg-primary",
      "group-data-[variant=default]/tabs-list:bottom-0 group-data-[variant=default]/tabs-list:left-[calc(var(--active-tab-left)+16px)] group-data-[variant=default]/tabs-list:h-0.5 group-data-[variant=default]/tabs-list:w-[max(24px,calc(var(--active-tab-width)-32px))] group-data-[variant=default]/tabs-list:rounded-t group-data-[variant=primary]/tabs-list:bottom-0 group-data-[variant=primary]/tabs-list:left-[calc(var(--active-tab-left)+16px)] group-data-[variant=primary]/tabs-list:h-0.5 group-data-[variant=primary]/tabs-list:w-[max(24px,calc(var(--active-tab-width)-32px))] group-data-[variant=primary]/tabs-list:rounded-t",
      "group-data-[variant=line]/tabs-list:bg-primary group-data-[variant=secondary]/tabs-list:bg-primary",
      "group-data-[variant=line]/tabs-list:bottom-0 group-data-[variant=line]/tabs-list:left-[var(--active-tab-left)] group-data-[variant=line]/tabs-list:h-0.5 group-data-[variant=line]/tabs-list:w-[var(--active-tab-width)] group-data-[variant=secondary]/tabs-list:bottom-0 group-data-[variant=secondary]/tabs-list:left-[var(--active-tab-left)] group-data-[variant=secondary]/tabs-list:h-0.5 group-data-[variant=secondary]/tabs-list:w-[var(--active-tab-width)]",
      "group-data-vertical/tabs:not-group-data-[variant=segmented]/tabs-list:top-[var(--active-tab-top)] group-data-vertical/tabs:not-group-data-[variant=segmented]/tabs-list:right-0 group-data-vertical/tabs:not-group-data-[variant=segmented]/tabs-list:h-[var(--active-tab-height)] group-data-vertical/tabs:not-group-data-[variant=segmented]/tabs-list:w-0.5 group-data-vertical/tabs:not-group-data-[variant=segmented]/tabs-list:rounded-l",
      "group-data-[variant=segmented]/tabs-list:top-[var(--active-tab-top)] group-data-[variant=segmented]/tabs-list:left-[var(--active-tab-left)] group-data-[variant=segmented]/tabs-list:h-[var(--active-tab-height)] group-data-[variant=segmented]/tabs-list:w-[var(--active-tab-width)] group-data-[variant=segmented]/tabs-list:rounded-md group-data-[variant=segmented]/tabs-list:bg-background group-data-[variant=segmented]/tabs-list:shadow-sm",
      className,
    )}
    {...props}
  />
));
TabsIndicator.displayName = "TabsIndicator";

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Tab>
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.Tab
    ref={ref}
    data-slot="tabs-trigger"
    className={cn(
      "relative z-1 inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-4 text-ui font-medium whitespace-nowrap text-muted-foreground outline-none transition-colors duration-150 ease-out select-none hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:pointer-events-none disabled:opacity-64 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
      "my-1 h-10 group-data-vertical/tabs:my-0.5 group-data-vertical/tabs:mr-1 group-data-vertical/tabs:min-h-11 group-data-vertical/tabs:w-auto group-data-vertical/tabs:justify-start group-data-[orientation=vertical]/tabs:my-0.5 group-data-[orientation=vertical]/tabs:mr-1 group-data-[orientation=vertical]/tabs:min-h-11 group-data-[orientation=vertical]/tabs:w-auto group-data-[orientation=vertical]/tabs:justify-start",
      "group-data-[variant=default]/tabs-list:data-active:text-primary group-data-[variant=primary]/tabs-list:data-active:text-primary group-data-[variant=line]/tabs-list:data-active:text-foreground group-data-[variant=secondary]/tabs-list:data-active:text-foreground",
      "group-data-[variant=segmented]/tabs-list:my-0 group-data-[variant=segmented]/tabs-list:h-full group-data-[variant=segmented]/tabs-list:rounded-md group-data-[variant=segmented]/tabs-list:px-5 group-data-[variant=segmented]/tabs-list:text-ui group-data-[variant=segmented]/tabs-list:data-active:text-foreground",
      className,
    )}
    {...props}
  >
    {children}
  </TabsPrimitive.Tab>
));
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Panel>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Panel
    ref={ref}
    data-slot="tabs-content"
    className={cn("flex-1 text-ui outline-none", className)}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
