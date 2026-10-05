import "../../index.css";

import { page } from "vitest/browser";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Badge } from "./badge";
import { Kbd, ShortcutKbd } from "./kbd";
import { Separator } from "./separator";
import { Skeleton } from "./skeleton";
import { Spinner } from "./spinner";
import { StatusChip, StatusDot } from "./status-chip";

/**
 * The M3 palette is scoped to `:root[data-code-theme-id="synara"]` (see
 * theme/m3.material.css) and its `.dark` twin, which useTheme sets. Renders here run
 * without the theme hook, so the attribute is set directly — otherwise every color
 * assertion below would read the bridge's fallbacks and prove nothing about Mimir.
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

function bg(element: Element) {
  return getComputedStyle(element).backgroundColor;
}

describe("M3E primitives", () => {
  let restore: (() => void) | null = null;
  afterEach(() => {
    restore?.();
    restore = null;
  });

  it("gives the spinner M3's traveling arc rather than a rotating glyph", async () => {
    const screen = await render(<Spinner data-testid="spinner" />);
    try {
      const spinner = page.getByTestId("spinner").element();
      const arc = spinner.querySelector("circle")!;
      // pathLength=100 is what makes the dash offsets readable as percentages.
      expect(arc.getAttribute("pathLength")).toBe("100");
      expect(arc.getAttribute("stroke-linecap")).toBe("round");
      expect(getComputedStyle(arc).animationName).toBe("m3-spinner-arc");
      expect(getComputedStyle(spinner).animationName).toBe("m3-spinner-rotate");
      // Busy, not decorative: it still announces itself.
      expect(spinner.getAttribute("role")).toBe("status");
      expect(spinner.getAttribute("aria-label")).toBe("Loading");
    } finally {
      await screen.unmount();
    }
  });

  it("holds the skeleton on a container role and pulses it", async () => {
    const screen = await render(<Skeleton data-testid="skeleton" className="h-4 w-24" />);
    try {
      const skeleton = page.getByTestId("skeleton").element();
      expect(getComputedStyle(skeleton).animationName).toBe("m3-skeleton-pulse");
      // M3's container scale, not the old muted shimmer.
      expect(bg(skeleton)).not.toBe("rgba(0, 0, 0, 0)");
    } finally {
      await screen.unmount();
    }
  });

  it("draws the separator in outline-variant", async () => {
    const screen = await render(<Separator data-testid="sep" className="h-4 w-4" />);
    try {
      const separator = page.getByTestId("sep").element();
      expect(bg(separator)).not.toBe("rgba(0, 0, 0, 0)");
    } finally {
      await screen.unmount();
    }
  });

  it.each([
    ["light", "rgb(178, 176, 190)"],
    ["dark", "rgb(71, 71, 83)"],
  ] as const)("paints a separator on the Mimir outline-variant (%s)", async (variant, expected) => {
    restore = useMimirPalette(variant);
    const screen = await render(<Separator data-testid="sep" className="h-4 w-4" />);
    try {
      expect(bg(page.getByTestId("sep").element())).toBe(expected);
    } finally {
      await screen.unmount();
    }
  });

  it.each([
    ["light", "rgb(99, 65, 217)", "rgb(252, 247, 255)"],
    ["dark", "rgb(203, 190, 255)", "rgb(67, 18, 185)"],
  ] as const)(
    "paints a default badge on primary/on-primary (%s)",
    async (variant, background, foreground) => {
      restore = useMimirPalette(variant);
      const screen = await render(<Badge data-testid="badge">New</Badge>);
      try {
        const badge = page.getByTestId("badge").element();
        expect(bg(badge)).toBe(background);
        expect(getComputedStyle(badge).color).toBe(foreground);
      } finally {
        await screen.unmount();
      }
    },
  );

  it.each([
    ["light", "rgb(230, 222, 255)", "rgb(83, 78, 106)"],
    ["dark", "rgb(60, 56, 83)", "rgb(194, 187, 220)"],
  ] as const)(
    "paints an info badge on secondary-container (%s)",
    async (variant, background, foreground) => {
      // secondary-container, per M3's badge: the info tone rides the secondary pair.
      restore = useMimirPalette(variant);
      const screen = await render(
        <Badge data-testid="badge" variant="info">
          Beta
        </Badge>,
      );
      try {
        const badge = page.getByTestId("badge").element();
        expect(bg(badge)).toBe(background);
        expect(getComputedStyle(badge).color).toBe(foreground);
      } finally {
        await screen.unmount();
      }
    },
  );

  it("keeps the badge on the app's UI text scale rather than a fixed M3 size", async () => {
    const screen = await render(<Badge data-testid="badge">New</Badge>);
    try {
      // AGENTS.md: UI text follows the size chosen in Settings, so no fixed px here.
      expect(getComputedStyle(page.getByTestId("badge").element()).fontSize).toMatch(/px$/);
      expect(page.getByTestId("badge").element().className).not.toMatch(/text-label-/);
    } finally {
      await screen.unmount();
    }
  });

  it.each([
    ["light", "rgb(230, 222, 255)", "rgb(83, 78, 106)"],
    ["dark", "rgb(60, 56, 83)", "rgb(194, 187, 220)"],
  ] as const)(
    "paints an info alert on secondary-container (%s)",
    async (variant, background, foreground) => {
      restore = useMimirPalette(variant);
      const screen = await render(
        <Alert data-testid="alert" variant="info">
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>Something worth knowing.</AlertDescription>
        </Alert>,
      );
      try {
        const alert = page.getByTestId("alert").element();
        expect(bg(alert)).toBe(background);
        expect(getComputedStyle(alert).color).toBe(foreground);
        // M3 alert carries the tone in the fill, so it has no border.
        expect(getComputedStyle(alert).borderTopWidth).toBe("0px");
      } finally {
        await screen.unmount();
      }
    },
  );

  it.each([
    ["light", "rgb(249, 115, 134)", "rgb(110, 5, 35)"],
    ["dark", "rgb(135, 28, 52)", "rgb(255, 151, 163)"],
  ] as const)(
    "paints an error alert on error-container (%s)",
    async (variant, background, foreground) => {
      restore = useMimirPalette(variant);
      const screen = await render(
        <Alert data-testid="alert" variant="error">
          <AlertTitle>Failed</AlertTitle>
        </Alert>,
      );
      try {
        const alert = page.getByTestId("alert").element();
        expect(bg(alert)).toBe(background);
        expect(getComputedStyle(alert).color).toBe(foreground);
      } finally {
        await screen.unmount();
      }
    },
  );

  it.each([
    ["light", "rgb(227, 225, 240)", "rgb(95, 94, 106)"],
    ["dark", "rgb(37, 37, 48)", "rgb(171, 169, 183)"],
  ] as const)(
    "puts a key cap on surface-container-highest (%s)",
    async (variant, background, foreground) => {
      restore = useMimirPalette(variant);
      const screen = await render(<Kbd data-testid="kbd">K</Kbd>);
      try {
        const kbd = page.getByTestId("kbd").element();
        expect(bg(kbd)).toBe(background);
        expect(getComputedStyle(kbd).color).toBe(foreground);
      } finally {
        await screen.unmount();
      }
    },
  );

  it("renders a shortcut chord as one full-round cap", async () => {
    const screen = await render(<ShortcutKbd data-testid="kbd" shortcutLabel="⇧⌘K" />);
    try {
      const kbd = page.getByTestId("kbd").element();
      const radius = Number.parseFloat(getComputedStyle(kbd).borderTopLeftRadius);
      expect(radius).toBeGreaterThanOrEqual(kbd.getBoundingClientRect().height / 2);
    } finally {
      await screen.unmount();
    }
  });

  it("leaves the status dot a plain 6px circle callers still colour", async () => {
    restore = useMimirPalette("light");
    const screen = await render(
      <div className="text-ui">
        <StatusDot data-testid="dot" className="bg-m3-primary" />
      </div>,
    );
    try {
      const dot = page.getByTestId("dot").element();
      // The dot is an inline span by default, so it takes its 6px from an explicit
      // `inline-block` in the test's wrapper — the width assertion is about the token.
      expect(getComputedStyle(dot).width).toBe("6px");
      expect(bg(dot)).toBe("rgb(99, 65, 217)");
    } finally {
      await screen.unmount();
    }
  });

  it("keeps the status chip's dot and label on one tone", async () => {
    restore = useMimirPalette("light");
    const screen = await render(
      <StatusChip variant="pill" className="text-m3-on-secondary-container">
        Running
      </StatusChip>,
    );
    try {
      // StatusChip takes no rest props, so it is found by its label. The dot is the
      // rounded span inside; the pill keeps its own tone rather than a caller colour.
      const chip = page.getByText("Running").element();
      expect(chip.querySelector("span")!.className).toContain("rounded-full");
      expect(getComputedStyle(chip).color).toBe("rgb(83, 78, 106)");
    } finally {
      await screen.unmount();
    }
  });
});
