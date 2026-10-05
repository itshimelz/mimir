// FILE: lib/m3e/cn.ts
// Purpose: M3E-aware class merge. Mirrors the M3E registry's `cn` helper
//          (which teaches tailwind-merge about the M3 type scale, elevation,
//          state-layer, ripple and motion utilities) on top of the clsx +
//          tailwind-merge pair this app already ships.
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const TYPE_ROLES = ["display", "headline", "title", "body", "label"];
const TYPE_SIZES = ["large", "medium", "small"];
const typeScale = TYPE_ROLES.flatMap((role) =>
  TYPE_SIZES.flatMap((size) => [`${role}-${size}`, `${role}-${size}-emphasized`]),
);

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: typeScale }],
      shadow: [
        {
          shadow: [
            "elevation-0",
            "elevation-1",
            "elevation-2",
            "elevation-3",
            "elevation-4",
            "elevation-5",
          ],
        },
      ],
      "state-layer": ["state-layer", "state-layer-circle"],
      "state-layer-color": [{ "state-layer": [(v: string) => v !== "circle"] }],
      "ripple-color": [{ ripple: [() => true] }],
      motion: [
        {
          motion: [
            "spatial-fast",
            "spatial-default",
            "spatial-slow",
            "effects-fast",
            "effects-default",
            "effects-slow",
            "popup",
            "menu",
            "dialog",
            "scrim",
            "sheet",
          ],
        },
      ],
    },
  },
} as unknown as Parameters<typeof extendTailwindMerge>[0]);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
