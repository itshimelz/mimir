import { CommandId, MessageId, ProjectId, SpaceId, ThreadId } from "@synara/contracts";
import { type CxOptions, cx } from "class-variance-authority";
import { extendTailwindMerge } from "tailwind-merge";
import * as Random from "effect/Random";
import * as Effect from "effect/Effect";

const TYPE_ROLES = ["display", "headline", "title", "body", "label"] as const;
const TYPE_SIZES = ["large", "medium", "small"] as const;
const m3TypeScale = TYPE_ROLES.flatMap((r) =>
  TYPE_SIZES.flatMap((s) => [`${r}-${s}`, `${r}-${s}-emphasized`]),
);

type CustomClassGroups = "state-layer" | "state-layer-color" | "ripple-color" | "motion";

// `text-ui*` / `text-chat*` are font sizes from the `@theme` block in index.css.
// Register them and M3Expressive type scales so twMerge resolves them
// correctly against `text-xs` etc. instead of treating them as text colors.
const twMerge = extendTailwindMerge<CustomClassGroups>({
  extend: {
    theme: {
      text: [
        "ui",
        "ui-lg",
        "ui-sm",
        "ui-xs",
        "ui-2xs",
        "ui-meta",
        "ui-timestamp",
        "chat",
        "chat-code",
        "chat-meta",
        "chat-tiny",
        ...m3TypeScale,
      ],
    },
    classGroups: {
      "font-size": [{ text: m3TypeScale }],
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
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: CxOptions) {
  return twMerge(cx(inputs));
}

export function isMacPlatform(platform: string): boolean {
  return /mac|darwin|iphone|ipad|ipod/i.test(platform);
}

export function isWindowsPlatform(platform: string): boolean {
  return /^win(dows)?/i.test(platform);
}

export function isLinuxPlatform(platform: string): boolean {
  return /linux/i.test(platform);
}

/** The host platform string, safe to read where `navigator` may be absent (SSR, node tests). */
export function getNavigatorPlatform(): string {
  return typeof navigator === "undefined" ? "" : navigator.platform;
}

/** Single source of truth for "render the ⌘ affordance instead of the Ctrl one". */
export function isMacNavigatorPlatform(): boolean {
  return isMacPlatform(getNavigatorPlatform());
}

export function randomUUID(): string {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Effect.runSync(Random.nextUUIDv4);
}

export const newCommandId = (): CommandId => CommandId.makeUnsafe(randomUUID());

export const newProjectId = (): ProjectId => ProjectId.makeUnsafe(randomUUID());

export const newSpaceId = (): SpaceId => SpaceId.makeUnsafe(randomUUID());

export const newThreadId = (): ThreadId => ThreadId.makeUnsafe(randomUUID());

export const newMessageId = (): MessageId => MessageId.makeUnsafe(randomUUID());
