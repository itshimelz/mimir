"use client";

// FILE: switch.tsx
// Purpose: Shared dual-compartment tactile on/off switch primitive used by settings, menus, and dialogs.
// Layer: Base UI component
// Exports: Switch, ToggleSwitch, SwitchSlots plus track/thumb class names

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "~/lib/utils";

const SWITCH_TRACK_CLASS_NAME = "toggle-switch-track";
const SWITCH_THUMB_CLASS_NAME = "toggle-switch-thumb";

function SwitchSlots() {
  return (
    <span className="toggle-switch-slots" aria-hidden="true">
      <span className="toggle-switch-slot toggle-switch-slot--on">ON</span>
      <span className="toggle-switch-slot toggle-switch-slot--off">OFF</span>
    </span>
  );
}

function Switch({ className, children, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      className={cn(SWITCH_TRACK_CLASS_NAME, className)}
      data-slot="switch"
      {...props}
    >
      <SwitchSlots />
      <SwitchPrimitive.Thumb className={SWITCH_THUMB_CLASS_NAME} data-slot="switch-thumb" />
      {children}
    </SwitchPrimitive.Root>
  );
}

export {
  Switch,
  Switch as ToggleSwitch,
  SwitchSlots,
  SWITCH_THUMB_CLASS_NAME,
  SWITCH_TRACK_CLASS_NAME,
};
