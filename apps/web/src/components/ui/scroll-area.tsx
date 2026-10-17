"use client";

import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";

import { cn } from "~/lib/utils";

function ScrollArea({
  className,
  children,
  scrollFade: scrollFadeProp,
  scrollbarGutter: scrollbarGutterProp,
  hideScrollbars: hideScrollbarsProp,
  ...props
}: ScrollAreaPrimitive.Root.Props & {
  scrollFade?: boolean;
  scrollbarGutter?: boolean;
  hideScrollbars?: boolean;
}) {
  const scrollFade = scrollFadeProp ?? false;
  const scrollbarGutter = scrollbarGutterProp ?? false;
  const hideScrollbars = hideScrollbarsProp ?? false;
  return (
    <ScrollAreaPrimitive.Root className={cn("size-full min-h-0", className)} {...props}>
      <ScrollAreaPrimitive.Viewport
        className={cn(
          // No focus ring here: the viewport is a scroll container, and ringing it
          // paints a border around the entire pane every time an arrow key moves
          // focus inside. `outline-none` is enough — the scroll container itself
          // has nothing to indicate.
          "h-full overscroll-contain rounded-[inherit] outline-none transition-shadows data-has-overflow-x:overscroll-x-contain",
          scrollFade &&
            "mask-t-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-y-start)))] mask-b-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-y-end)))] mask-l-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-x-start)))] mask-r-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-x-end)))] [--fade-size:var(--scroll-edge-fade-size)]",
          scrollbarGutter && "data-has-overflow-y:pe-2.5 data-has-overflow-x:pb-2.5",
          hideScrollbars &&
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
        data-slot="scroll-area-viewport"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {!hideScrollbars && (
        <>
          <ScrollBar orientation="vertical" />
          <ScrollBar orientation="horizontal" />
          <ScrollAreaPrimitive.Corner data-slot="scroll-area-corner" />
        </>
      )}
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation: orientationProp,
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  const orientation = orientationProp ?? "vertical";
  return (
    <ScrollAreaPrimitive.Scrollbar
      className={cn(
        // Size comes from the scrollbar token so the Base UI bar and the native one
        // agree; they used to disagree (6px against a global 10px) and the viewport
        // gutter had to be padded to compensate.
        "m-1 flex opacity-0 transition-opacity delay-300 data-[orientation=horizontal]:h-[var(--app-scrollbar-width)] data-[orientation=vertical]:w-[var(--app-scrollbar-width)] data-[orientation=horizontal]:flex-col data-hovering:opacity-100 data-scrolling:opacity-100 data-hovering:delay-0 data-scrolling:delay-0 data-hovering:duration-100 data-scrolling:duration-100",
        className,
      )}
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        className="relative flex-1 rounded-full corner-round bg-foreground/15"
        data-slot="scroll-area-thumb"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollArea, ScrollBar };
