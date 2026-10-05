// FILE: switch.tsx
// Purpose: Shared on/off switch used by settings, menus, and dialogs.
// Layer: Base UI component
// Exports: Switch plus track/thumb class names for compact switch-shaped controls

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "~/lib/utils";

import { Ripple } from "../m3/Ripple";

/**
 * M3 switch.
 *
 * Geometry follows Compose SwitchTokens and is expressed as multiples of one knob,
 * `--thumb-size`, so every host gets M3's proportions instead of a hardcoded box:
 *
 *   track   2.0× tall × 3.25× wide   (16px knob → 32×52, M3's default switch)
 *   handle  1.0× at rest, 1.5× when selected, 1.75× while pressed
 *   travel  0.375× → 1.375× of the knob, i.e. the handle grows as it moves
 *
 * `--thumb-size` is therefore the UNCHECKED handle, not the track's short side — the
 * old contract, where it sized a `w-2×` track. Hosts pick a knob size to get the switch
 * size they want; `Switch` uses M3's 16px, and menu switch-items use 12px so they still
 * fit a dense row.
 *
 * Colors are M3 roles: the selected track is `primary` with an `on-primary` handle, the
 * unselected track is `surface-container-highest` with an `outline` border and an
 * `outline` handle. Growth and travel run on the fast spatial spring, which is what
 * makes the handle read as physical rather than as a sliding div.
 */
const SWITCH_TRACK_CLASS_NAME =
  "group/switch relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 outline-none transition-[background-color,border-color] duration-[var(--md-sys-motion-spring-fast-effects-duration)] [transition-timing-function:var(--md-sys-motion-spring-fast-effects)] [--thumb-size:16px] [--switch-travel:calc(var(--thumb-size)*0.375)] [--switch-travel-checked:calc(var(--thumb-size)*1.375)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--md-sys-color-secondary)] data-[size=sm]:[--thumb-size:12px] h-[calc(var(--thumb-size)*2)] w-[calc(var(--thumb-size)*3.25)] data-checked:border-m3-primary data-checked:bg-m3-primary data-unchecked:border-m3-outline data-unchecked:bg-m3-surface-container-highest data-disabled:cursor-not-allowed data-disabled:opacity-64 aria-invalid:border-m3-error";

const SWITCH_THUMB_CLASS_NAME =
  "pointer-events-none absolute top-1/2 left-0 block -translate-y-1/2 rounded-full bg-m3-outline transition-[width,height,translate,background-color] duration-[var(--md-sys-motion-spring-fast-spatial-duration)] [transition-timing-function:var(--md-sys-motion-spring-fast-spatial)] size-[var(--thumb-size)] translate-x-[var(--switch-travel)] group-data-[size=sm]/switch:size-[var(--thumb-size)] group-data-checked/switch:size-[calc(var(--thumb-size)*1.5)] group-data-checked/switch:translate-x-[var(--switch-travel-checked)] group-data-pressed/switch:size-[calc(var(--thumb-size)*1.75)] group-data-pressed/switch:translate-x-[calc(var(--switch-travel)*0.375)] group-data-pressed/switch:group-data-checked/switch:translate-x-[calc(var(--switch-travel-checked)*0.714)] group-hover/switch:bg-m3-on-surface-variant group-data-checked/switch:bg-m3-on-primary group-data-disabled/switch:bg-m3-on-surface/38 motion-reduce:transition-none";

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      className={cn(SWITCH_TRACK_CLASS_NAME, className)}
      data-slot="switch"
      {...props}
    >
      <SwitchPrimitive.Thumb className={cn(SWITCH_THUMB_CLASS_NAME)} data-slot="switch-thumb">
        <Ripple />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}

export { Switch, SWITCH_THUMB_CLASS_NAME, SWITCH_TRACK_CLASS_NAME };
