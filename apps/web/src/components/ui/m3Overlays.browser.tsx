import "../../index.css";

import { page, userEvent } from "vitest/browser";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import {
  DialogDescription,
  DialogPopup,
  DialogTitle,
  Dialog as DialogRoot,
  DialogTrigger,
} from "./dialog";
import { Menu, MenuItem, MenuPopupBase, MenuSeparator, MenuSub, MenuSubTrigger } from "./menu";
import { Popover, PopoverPopup, PopoverTitle, PopoverTrigger } from "./popover";
import { Tooltip, TooltipPopup, TooltipTrigger } from "./tooltip";

/**
 * The M3 palette is scoped to `:root[data-code-theme-id="synara"]` and its `.dark` twin,
 * which useTheme sets. Renders here run without the theme hook, so the attribute is set
 * directly — otherwise every color assertion would read the bridge's fallbacks and prove
 * nothing about Mimir.
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

/** Mimir's M3 outline-variant, the hairline every overlay draws. */
const OUTLINE_VARIANT = {
  light: "rgb(178, 176, 190)",
  dark: "rgb(71, 71, 83)",
} as const;

/**
 * Mimir's `inverse-surface` / `inverse-on-surface`. Note the direction: M3's inverse pair
 * is dark-on-light in the light scheme and light-on-dark in the dark one, which is what
 * makes the tooltip chip invert with the app rather than track it.
 */
const INVERSE = {
  light: { surface: "rgb(14, 14, 19)", ink: "rgb(158, 156, 163)" },
  dark: { surface: "rgb(252, 248, 255)", ink: "rgb(85, 84, 91)" },
} as const;

/** Alpha of a computed color, which a `/opacity` modifier leaves readable. */
function alpha(color: string): number {
  return Number(color.match(/\/\s*([\d.]+)\s*\)?$/)?.[1] ?? 1);
}

function bg(element: Element) {
  return getComputedStyle(element).backgroundColor;
}

/**
 * Relative lightness of a computed color, 0..1. A `/opacity` modifier makes Tailwind
 * emit `color-mix(in oklab, …)`, which Chromium reports back as `oklab(L a b / α)` — so
 * the rgb channels are not directly readable and the assertion has to go through L.
 */
function lightness(color: string): number {
  const oklab = color.match(/^oklab\(([\d.]+)/);
  if (oklab) return Number(oklab[1]);
  const channels = color.match(/[\d.]+/g) ?? [];
  const [r, g, b] = channels.map(Number) as [number, number, number];
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

describe("M3E overlays", () => {
  let restore: (() => void) | null = null;
  afterEach(() => {
    restore?.();
    restore = null;
  });

  it.each(["light", "dark"] as const)(
    "paints the plain tooltip as an inverse chip, not a raised surface (%s)",
    async (variant) => {
      restore = useMimirPalette(variant);
      const screen = await render(
        <Tooltip open>
          <TooltipTrigger>Anchor</TooltipTrigger>
          <TooltipPopup data-testid="tooltip">Shortcuts</TooltipPopup>
        </Tooltip>,
      );
      try {
        const tooltip = page.getByTestId("tooltip").element();
        // M3's plain tooltip inverts: inverse-surface fill with inverse-on-surface ink.
        // A raised surface container would have matched the app background instead.
        expect(bg(tooltip)).toBe(INVERSE[variant].surface);
        expect(getComputedStyle(tooltip).color).toBe(INVERSE[variant].ink);
        // The chip separates itself by tone alone: no elevation and no border.
        expect(getComputedStyle(tooltip).borderTopWidth).toBe("0px");
        expect(getComputedStyle(tooltip).boxShadow).toBe("none");
      } finally {
        await screen.unmount();
      }
    },
  );

  it("inverts the ink tokens inside the chip so rich tooltip bodies stay legible", async () => {
    restore = useMimirPalette("light");
    // This is the reported regression: the command card body sets its own ink
    // (`text-muted-foreground/70` labels, `text-foreground/92` code) because the same
    // markup is reused on cards and panels. Without the subtree remap those land
    // near-black on the chip's near-black fill.
    const screen = await render(
      <Tooltip open>
        <TooltipTrigger>Anchor</TooltipTrigger>
        <TooltipPopup data-testid="tooltip">
          <div className="text-muted-foreground/70">Summary</div>
          <code className="text-foreground/92">ls -la</code>
        </TooltipPopup>
      </Tooltip>,
    );
    try {
      const tooltip = page.getByTestId("tooltip").element();
      const label = page.getByText("Summary").element();
      const code = page.getByText("ls -la").element();
      // The remap is on the variables, so it reads the same whether the caller used the
      // shadcn token or the raw theme variable.
      expect(getComputedStyle(tooltip).getPropertyValue("--foreground").trim()).toBe("#9e9ca3");
      expect(getComputedStyle(tooltip).getPropertyValue("--muted-foreground")).toContain("#9e9ca3");
      // Both must be LIGHT on the dark chip: this is the assertion that failed before.
      for (const element of [label, code]) {
        expect(lightness(getComputedStyle(element).color)).toBeGreaterThan(0.5);
      }
      // The label still reads as secondary — same hue, lower alpha — so the two lines
      // keep their hierarchy rather than flattening into one voice.
      expect(alpha(getComputedStyle(label).color)).toBeLessThan(
        alpha(getComputedStyle(code).color),
      );
    } finally {
      await screen.unmount();
    }
  });

  it("gives the chip M3's popup curves while keeping the app's resting scale", async () => {
    restore = useMimirPalette("light");
    const screen = await render(
      <Tooltip open>
        <TooltipTrigger>Anchor</TooltipTrigger>
        <TooltipPopup data-testid="tooltip">Shortcuts</TooltipPopup>
      </Tooltip>,
    );
    try {
      const tooltip = page.getByTestId("tooltip").element();
      const style = getComputedStyle(tooltip);
      // motion-popup carries the enter/exit curves...
      expect(style.transitionProperty).toContain("opacity");
      expect(tooltip.className).toMatch(/motion-popup\b/);
      // ...the app keeps its subtler 0.98 resting scale rather than M3E's 0.85, which
      // reads as a jump on the dense rail and row tooltips this mostly drives.
      expect(tooltip.className).toContain("data-starting-style:scale-98");
      expect(tooltip.className).toContain("motion-reduce:transition-none");
    } finally {
      await screen.unmount();
    }
  });

  it.each(["light", "dark"] as const)(
    "borders the popover in outline-variant and raises it on elevation 2 (%s)",
    async (variant) => {
      restore = useMimirPalette(variant);
      const screen = await render(
        <Popover open>
          <PopoverTrigger>Anchor</PopoverTrigger>
          <PopoverPopup data-testid="popover">
            <PopoverTitle>Title</PopoverTitle>
          </PopoverPopup>
        </Popover>,
      );
      try {
        const popover = page.getByTestId("popover").element();
        expect(getComputedStyle(popover).borderTopColor).toBe(OUTLINE_VARIANT[variant]);
        // elevation-2 composes a contact shadow plus a 2px/6px ambient one.
        expect(getComputedStyle(popover).boxShadow).toContain("0px 2px 6px 2px");
        // M3 popover ink is on-surface-variant, one role below the headline.
        expect(getComputedStyle(popover).color).toBe(
          variant === "light" ? "rgb(95, 94, 106)" : "rgb(171, 169, 183)",
        );
        const title = page.getByText("Title").element();
        // The headline takes full on-surface ink, not the muted tone below it.
        expect(getComputedStyle(title).color).toBe(
          variant === "light" ? "rgb(50, 49, 61)" : "rgb(230, 228, 243)",
        );
      } finally {
        await screen.unmount();
      }
    },
  );

  it("lights a menu row with an on-surface state layer rather than a filled pill", async () => {
    restore = useMimirPalette("light");
    const screen = await render(
      <Menu open>
        <MenuPopupBase data-testid="menu" sideOffset={0}>
          <MenuItem data-testid="row">Rename</MenuItem>
          <MenuSeparator />
        </MenuPopupBase>
      </Menu>,
    );
    try {
      const menu = page.getByTestId("menu").element();
      const row = page.getByTestId("row").element();
      const separator = menu.querySelector("[data-slot='menu-separator']") as HTMLElement;
      // The popup carries the menu's elevation and the outline-variant hairline.
      expect(getComputedStyle(menu).boxShadow).toContain("0px 2px 6px 2px");
      expect(getComputedStyle(menu).borderTopColor).toBe(OUTLINE_VARIANT.light);
      expect(bg(separator)).toBe(OUTLINE_VARIANT.light);
      // The row's highlight is an on-surface state layer at 12%, so it is translucent
      // and neutral rather than a tinted pill.
      expect(row.className).toContain("data-highlighted:bg-m3-on-surface/12");
      expect(getComputedStyle(row).color).toBe("rgb(50, 49, 61)");
      // Geometry stays the app's dense row rather than M3E's 44dp one.
      expect(row.getBoundingClientRect().height).toBeLessThan(44);
    } finally {
      await screen.unmount();
    }
  });

  it("keeps MenuSub's submenu contract intact", async () => {
    restore = useMimirPalette("light");
    const screen = await render(
      <Menu open>
        <MenuPopupBase sideOffset={0}>
          <MenuSub>
            <MenuSubTrigger data-testid="sub-trigger">Git actions</MenuSubTrigger>
          </MenuSub>
        </MenuPopupBase>
      </Menu>,
    );
    try {
      const trigger = page.getByTestId("sub-trigger").element();
      // An open submenu row reads as the same on-surface state layer as a highlighted
      // row, so the parent and its child do not look like two different surfaces.
      expect(trigger.className).toContain("data-popup-open:bg-m3-on-surface/12");
      expect(trigger.getAttribute("data-slot")).toBe("menu-sub-trigger");
    } finally {
      await screen.unmount();
    }
  });

  it("scrims the dialog with M3's scrim role and raises the panel to elevation 3", async () => {
    restore = useMimirPalette("light");
    const screen = await render(
      <DialogRoot open>
        <DialogTrigger>Open</DialogTrigger>
        <DialogPopup data-testid="dialog">
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Body</DialogDescription>
        </DialogPopup>
      </DialogRoot>,
    );
    try {
      const backdrop = document.querySelector("[data-slot='dialog-backdrop']") as HTMLElement;
      const dialog = page.getByTestId("dialog").element();
      // Scrim at 32% over pure black, not the old flat 60% `bg-black`. The `/32`
      // modifier lands as an oklab mix, so read it through alpha + lightness.
      const scrim = bg(backdrop);
      expect(scrim).toContain("0.32");
      expect(lightness(scrim)).toBeLessThan(0.01);
      // elevation-3 = a 3px/8px ambient layer under a 1px/3px contact shadow.
      expect(getComputedStyle(dialog).boxShadow).toContain("0px 4px 8px 3px");
      expect(getComputedStyle(dialog).borderTopColor).toBe(OUTLINE_VARIANT.light);
      // M3 basic dialog: a large corner, not the old 4px one. Asserted on the class because
      // the browser harness runs at a narrow viewport, where the popup's own
      // bottom-sheet treatment (`max-sm:rounded-none`) is correctly winning.
      expect(dialog.className).toContain("rounded-2xl");
      // The headline takes full on-surface ink; the body sits a role below.
      expect(getComputedStyle(page.getByText("Title").element()).color).toBe("rgb(50, 49, 61)");
      expect(getComputedStyle(page.getByText("Body").element()).color).toBe("rgb(95, 94, 106)");
    } finally {
      await screen.unmount();
    }
  });

  it("holds the scrim at full strength so the card never lands on an undimmed page", async () => {
    // Regression: the scrim used to fade UP over 330ms while the card faded in over 240ms,
    // so for ~10 frames the light card sat on a still-bright page and the page then dimmed
    // behind it — the light/dark flicker on every dialog open. Painting the scrim at full
    // strength removes both the flicker and 6 frames of full-viewport alpha blending.
    restore = useMimirPalette("light");
    const screen = await render(
      <DialogRoot>
        <DialogTrigger data-testid="open">Open</DialogTrigger>
        <DialogPopup data-testid="dialog">
          <DialogTitle>Title</DialogTitle>
        </DialogPopup>
      </DialogRoot>,
    );
    try {
      await userEvent.click(page.getByTestId("open").element());
      const backdrop = document.querySelector("[data-slot='dialog-backdrop']") as HTMLElement;
      const dialog = page.getByTestId("dialog").element();
      expect(backdrop).not.toBeNull();

      let blendedFrames = 0;
      let mismatchedFrames = 0;
      await new Promise<void>((resolve) => {
        let frames = 0;
        const tick = () => {
          frames += 1;
          const backdropOpacity = Number(getComputedStyle(backdrop).opacity);
          const popupOpacity = Number(getComputedStyle(dialog).opacity);
          if (backdropOpacity > 0 && backdropOpacity < 1) blendedFrames += 1;
          // The card is legible while the page behind is still bright.
          if (popupOpacity > 0.5 && backdropOpacity < 0.5) mismatchedFrames += 1;
          if (frames < 30) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });

      expect(mismatchedFrames).toBe(0);
      expect(blendedFrames).toBe(0);
      // Only the exit is timed now, and it matches the dialog's own exit so the two
      // still leave together.
      expect(getComputedStyle(backdrop).transitionDuration).toBe("0.15s");
      expect(getComputedStyle(backdrop).transitionProperty).toBe("opacity");
    } finally {
      await screen.unmount();
    }
  });
});
