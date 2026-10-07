"use client";

// FILE: switch.tsx
// Purpose: Shared accent-colored on/off switch primitive used by settings, menus, and dialogs.
// Layer: Base UI component
// Exports: Switch plus track/thumb class names for compact switch-shaped controls

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "~/lib/utils";

const SWITCH_TRACK_CLASS_NAME =
  "inline-flex h-[calc(var(--thumb-size)+4px)] w-[calc(var(--thumb-size)*2)] shrink-0 cursor-pointer items-center rounded-full border border-border p-px outline-none transition-[background-color,box-shadow,border-color] duration-200 motion-spatial-fast [--thumb-size:--spacing(5)] focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background data-checked:border-primary data-checked:bg-primary data-unchecked:border-border data-unchecked:bg-muted data-disabled:cursor-not-allowed data-disabled:opacity-64 sm:[--thumb-size:--spacing(4)]";

const SWITCH_THUMB_CLASS_NAME =
  "pointer-events-none block aspect-square h-full origin-left translate-x-0 rounded-full bg-background data-checked:bg-primary-foreground shadow-elevation-1 ring-1 ring-black/5 will-change-transform [transition:translate_.2s_cubic-bezier(0.34,1.56,0.64,1),border-radius_.15s,scale_.15s_cubic-bezier(0.34,1.56,0.64,1),transform-origin_.15s]";

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      className={cn(SWITCH_TRACK_CLASS_NAME, className)}
      data-slot="switch"
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          SWITCH_THUMB_CLASS_NAME,
          "in-[[role=switch]:active,[data-slot=label]:active,[data-slot=field-label]:active]:not-data-disabled:scale-x-110 in-[[role=switch]:active,[data-slot=label]:active,[data-slot=field-label]:active]:rounded-[var(--thumb-size)/calc(var(--thumb-size)*1.1)] data-checked:origin-[var(--thumb-size)_50%] data-checked:translate-x-[calc(var(--thumb-size)-4px)]",
        )}
        data-slot="switch-thumb"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch, SWITCH_THUMB_CLASS_NAME, SWITCH_TRACK_CLASS_NAME };
