import "../index.css";

import { userEvent } from "vitest/browser";
import { afterEach, describe, expect, it } from "vitest";

import type { ContextMenuItem } from "@synara/contracts";

import { showContextMenuFallback } from "../contextMenuFallback";

/**
 * The M3 palette is scoped to `:root[data-code-theme-id="synara"]` and its `.dark` twin
 * (theme/m3.material.css), which useTheme sets. Renders here run without the theme hook,
 * so the attribute is set directly — otherwise every color assertion would read the
 * bridge's fallbacks and prove nothing about Mimir.
 */
function useMimirPalette(variant: "light" | "dark") {
  const root = document.documentElement;
  root.setAttribute("data-code-theme-id", "synara");
  root.classList.toggle("dark", variant === "dark");
  return () => {
    root.removeAttribute("data-code-theme-id");
    root.classList.remove("dark");
  };
}

const ITEMS: readonly ContextMenuItem<string>[] = [
  { id: "rename", label: "Rename" },
  { id: "pin", label: "Pin" },
  { id: "delete", label: "Delete" },
];

/** Opens the fallback menu and returns its popup plus the rows it built. */
async function openMenu(items: readonly ContextMenuItem<string>[] = ITEMS) {
  // Never resolved: the assertions are about what it drew, and the menu only closes on
  // a click or Escape. The overlay is removed in afterEach.
  void showContextMenuFallback(items, { x: 20, y: 20 });
  await expect
    .poll(() => document.querySelector("[data-slot='context-menu-popup']"))
    .not.toBeNull();
  const popup = document.querySelector("[data-slot='context-menu-popup']") as HTMLElement;
  return { popup, rows: Array.from(popup.querySelectorAll("button")) };
}

function closeMenus() {
  document.body
    .querySelectorAll("[data-slot='context-menu-popup'],[data-slot='context-menu-sub-popup]")
    .forEach((element) => element.remove());
  document.querySelectorAll("div[style*='z-index: 9999']").forEach((element) => element.remove());
}

describe("context menu fallback (Material 3)", () => {
  let restore: (() => void) | null = null;
  afterEach(() => {
    closeMenus();
    restore?.();
    restore = null;
  });

  it.each([
    ["light", "rgb(50, 49, 61)"],
    ["dark", "rgb(230, 228, 243)"],
  ] as const)("paints rows on on-surface (%s)", async (variant, expected) => {
    restore = useMimirPalette(variant);
    const { rows } = await openMenu();
    expect(getComputedStyle(rows[0]!).color).toBe(expected);
  });

  it.each([
    ["light", "rgb(168, 54, 75)"],
    ["dark", "rgb(249, 115, 134)"],
  ] as const)("paints the destructive row on the error role (%s)", async (variant, expected) => {
    restore = useMimirPalette(variant);
    const { rows } = await openMenu();
    const destructive = rows.find((row) => row.textContent === "Delete")!;
    expect(getComputedStyle(destructive).color).toBe(expected);
  });

  it.each([
    ["light", "rgb(178, 176, 190)"],
    ["dark", "rgb(71, 71, 83)"],
  ] as const)(
    "separates the destructive group with outline-variant (%s)",
    async (variant, expected) => {
      restore = useMimirPalette(variant);
      const { popup } = await openMenu();
      const separator = popup.querySelector("div.mx-2\\.5") as HTMLElement;
      expect(separator).not.toBeNull();
      expect(getComputedStyle(separator).backgroundColor).toBe(expected);
    },
  );

  it.each([
    ["light", "rgb(178, 176, 190)"],
    ["dark", "rgb(71, 71, 83)"],
  ] as const)("borders the popup in outline-variant (%s)", async (variant, expected) => {
    restore = useMimirPalette(variant);
    const { popup } = await openMenu();
    expect(getComputedStyle(popup).borderTopColor).toBe(expected);
  });

  it("closes the corners to M3's small radius", async () => {
    restore = useMimirPalette("light");
    const { popup } = await openMenu();
    const radius = Number.parseFloat(getComputedStyle(popup).borderTopLeftRadius);
    expect(radius).toBeGreaterThanOrEqual(4);
    // M3E's menu popup is a medium corner, never a pill.
    expect(radius).toBeLessThan(popup.getBoundingClientRect().height / 2);
  });

  it("raises the popup on M3 elevation rather than the old single shadow", async () => {
    restore = useMimirPalette("light");
    const { popup } = await openMenu();
    const shadow = getComputedStyle(popup).boxShadow;
    // elevation-2 = a 1px contact shadow plus a 2px/6px ambient one. The old fallback
    // used `shadow-sm`, which is a single layer with none of this geometry.
    expect(shadow).toContain("0px 2px 6px 2px");
    expect(shadow).toContain("0px 1px 2px 0px");
  });

  it("lights the hovered row with an on-surface state layer, not a filled pill", async () => {
    restore = useMimirPalette("light");
    const { rows } = await openMenu();
    // The highlight is applied on pointer enter and on keyboard navigation, not on raw
    // DOM focus, so this hovers.
    await userEvent.hover(rows[0]!);
    await expect.poll(() => rows[0]!.className).toContain("bg-m3-on-surface/12");
    const [r, g, b, a] = getComputedStyle(rows[0]!).backgroundColor.match(/\d+/g)!.map(Number);
    // An M3 state layer: on-surface ink at 12%, so it is translucent and neutral.
    expect(a).toBeLessThan(1);
    expect(r).toBe(g);
    expect(g).toBe(b);
  });

  it("keeps the app's dense row height rather than M3E's 44dp row", async () => {
    restore = useMimirPalette("light");
    const { rows } = await openMenu();
    // This builds raw DOM and is measured against min-h-7; adopting 44dp rows here would
    // change how many actions fit on a short viewport.
    expect(rows[0]!.getBoundingClientRect().height).toBeLessThan(44);
  });
});
