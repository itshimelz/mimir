import "../index.css";

import { page } from "vitest/browser";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { buildRailItemOrder, RAIL_ORDERABLE_ITEM_IDS } from "~/appRail.logic";
import { AppRail, railItemGlyphs, type AppRailItem } from "./AppRail";

function item(id: Parameters<typeof railItemGlyphs>[0], active = false): AppRailItem {
  return {
    id,
    glyphs: railItemGlyphs(id),
    label: id,
    badge: null,
    active,
    onSelect: vi.fn(),
  };
}

const IDS = buildRailItemOrder({
  order: resolveOrder(),
  hidden: new Set(),
  activeItem: "home",
  studioAvailable: false,
  inboxAvailable: false,
});

function resolveOrder() {
  return [...RAIL_ORDERABLE_ITEM_IDS];
}

function renderRail(activeId?: string) {
  return render(
    <AppRail
      items={IDS.map((id) => item(id, id === activeId))}
      shortcuts={[]}
      bottomItems={[item("settings")]}
    />,
  );
}

function activeItem() {
  return page.getByRole("button", { name: "home", exact: true }).element();
}

/** A rail item's indicator, which is what the active state fills and the ripple clips to. */
function indicatorOf(element: Element) {
  return getComputedStyle(element.querySelector(".app-rail-indicator")!);
}

/**
 * The Mimir palette is scoped to `:root[data-code-theme-id="synara"]` and its dark twin,
 * which useTheme is what sets. Renders run without the theme hook, so the attribute is
 * set directly here — otherwise every assertion below would read the bridge's fallbacks
 * and prove nothing about Mimir.
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

describe("AppRail (Material 3)", () => {
  it("gives every item the M3 rail geometry", async () => {
    const screen = await renderRail();
    try {
      const rail = page.getByRole("navigation", { name: "Primary" }).element();
      const item = activeItem();
      const railBox = rail.getBoundingClientRect();
      const itemBox = item.getBoundingClientRect();

      // M3 NavigationRail: an 80dp collapsed rail holding a 56dp item, centered.
      expect(Math.round(railBox.width)).toBe(80);
      expect(Math.round(itemBox.width)).toBe(56);
      expect(Math.round(itemBox.height)).toBe(32);
      expect(Math.round(itemBox.left - railBox.left)).toBe(12);
      expect(Math.round(railBox.right - itemBox.right)).toBe(12);
    } finally {
      await screen.unmount();
    }
  });

  it("fills the active item's indicator and leaves idle indicators clear", async () => {
    const screen = await renderRail("home");
    try {
      const active = activeItem();
      expect(active.getAttribute("data-active")).toBe("");
      expect(indicatorOf(active).opacity).toBe("1");
      // The indicator is full-round: on a 56×32 pill the corners close at 16px. The
      // computed value is the clamped one (9999px capped to half the box), so compare
      // against the cap rather than the declared radius.
      const radius = Number.parseFloat(getComputedStyle(active).borderTopLeftRadius);
      expect(radius).toBeGreaterThanOrEqual(active.getBoundingClientRect().height / 2);

      const idle = page.getByRole("button", { name: "spaces", exact: true }).element();
      expect(idle.hasAttribute("data-active")).toBe(false);
      expect(indicatorOf(idle).opacity).toBe("0");
      // Idle and active glyphs are different M3 roles, not the same grey.
      expect(getComputedStyle(active).color).not.toBe(getComputedStyle(idle).color);
    } finally {
      await screen.unmount();
    }
  });

  it("paints a state layer on hover rather than the sidebar button's fill", async () => {
    const screen = await renderRail("home");
    try {
      const idle = page.getByRole("button", { name: "spaces", exact: true }).element();
      const before = Number(getComputedStyle(idle, "::before").opacity);
      expect(before).toBe(0);

      await page.getByRole("button", { name: "spaces", exact: true }).hover();
      // The layer fades in on the fast-effects spring, so poll for the settled opacity
      // rather than sampling the transition's first frame.
      await expect
        .poll(() => Number(getComputedStyle(idle, "::before").opacity))
        .toBeCloseTo(0.08, 2);
      // A state layer, not the sidebar button's solid hover fill.
      expect(getComputedStyle(idle).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    } finally {
      await screen.unmount();
    }
  });

  it("draws the M3 focus indicator instead of the shared 1px sidebar ring", async () => {
    const screen = await renderRail();
    try {
      const idle = page.getByRole("button", { name: "home", exact: true }).element();
      idle.focus();
      const style = getComputedStyle(idle);
      expect(style.outlineWidth).toBe("3px");
      expect(style.outlineStyle).toBe("solid");
      expect(style.outlineOffset).toBe("2px");
    } finally {
      await screen.unmount();
    }
  });

  it("keeps a ripple host on every item so press feedback has somewhere to draw", async () => {
    const screen = await renderRail("home");
    try {
      for (const name of ["home", "spaces", "settings"]) {
        const button = page.getByRole("button", { name, exact: true }).element();
        expect(button.querySelector('[data-slot="ripple"]')).not.toBeNull();
      }
    } finally {
      await screen.unmount();
    }
  });
});

describe("AppRail (Mimir palette)", () => {
  let restore: (() => void) | null = null;
  afterEach(() => {
    restore?.();
    restore = null;
  });

  it.each([
    ["light", "rgb(83, 78, 106)"],
    ["dark", "rgb(194, 187, 220)"],
  ] as const)(
    "paints the active item on on-secondary-container (%s)",
    async (variant, expected) => {
      restore = useMimirPalette(variant);
      const screen = await renderRail("home");
      try {
        expect(getComputedStyle(activeItem()).color).toBe(expected);
      } finally {
        await screen.unmount();
      }
    },
  );

  it.each([
    ["light", "rgb(230, 222, 255)"],
    ["dark", "rgb(60, 56, 83)"],
  ] as const)(
    "fills the active indicator with secondary-container (%s)",
    async (variant, expected) => {
      restore = useMimirPalette(variant);
      const screen = await renderRail("home");
      try {
        const indicator = activeItem().querySelector(".app-rail-indicator")!;
        expect(getComputedStyle(indicator).backgroundColor).toBe(expected);
      } finally {
        await screen.unmount();
      }
    },
  );

  it.each([
    ["light", "rgb(95, 94, 106)"],
    ["dark", "rgb(171, 169, 183)"],
  ] as const)("rests idle glyphs on on-surface-variant (%s)", async (variant, expected) => {
    restore = useMimirPalette(variant);
    const screen = await renderRail();
    try {
      const idle = page.getByRole("button", { name: "spaces", exact: true }).element();
      expect(getComputedStyle(idle).color).toBe(expected);
    } finally {
      await screen.unmount();
    }
  });
});
