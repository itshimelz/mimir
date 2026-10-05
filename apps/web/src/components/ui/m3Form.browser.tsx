import "../../index.css";

import { page, userEvent } from "vitest/browser";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { Checkbox } from "./checkbox";
import { Input } from "./input";
import { Select, SelectTrigger, SelectValue } from "./select";

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

describe("M3E form primitives", () => {
  let restore: (() => void) | null = null;
  afterEach(() => {
    restore?.();
    restore = null;
  });

  describe("Input", () => {
    it.each([
      ["light", "rgb(178, 176, 190)"],
      ["dark", "rgb(71, 71, 83)"],
    ] as const)("borders the field in outline-variant (%s)", async (variant, expected) => {
      restore = useMimirPalette(variant);
      const screen = await render(<Input data-testid="field" defaultValue="name" />);
      try {
        // The wrapper paints the border; the inner input is transparent.
        const control = page.getByTestId("field").element().closest("[data-slot='input-control']")!;
        expect(getComputedStyle(control).borderTopColor).toBe(expected);
      } finally {
        await screen.unmount();
      }
    });

    it("moves the field border to primary on focus", async () => {
      restore = useMimirPalette("light");
      const screen = await render(<Input data-testid="field" />);
      try {
        const control = page.getByTestId("field").element().closest("[data-slot='input-control']")!;
        await page.getByTestId("field").click();
        await expect.poll(() => getComputedStyle(control).borderTopColor).toBe("rgb(99, 65, 217)");
      } finally {
        await screen.unmount();
      }
    });

    it("puts typed text on on-surface", async () => {
      restore = useMimirPalette("light");
      const screen = await render(<Input data-testid="field" />);
      try {
        expect(getComputedStyle(page.getByTestId("field").element()).color).toBe("rgb(50, 49, 61)");
      } finally {
        await screen.unmount();
      }
    });
  });

  describe("Select", () => {
    it.each([
      ["light", "rgb(178, 176, 190)"],
      ["dark", "rgb(71, 71, 83)"],
    ] as const)("borders the select trigger in outline-variant (%s)", async (variant, expected) => {
      restore = useMimirPalette(variant);
      const screen = await render(
        <Select value="a" onValueChange={() => {}}>
          <SelectTrigger data-testid="trigger">
            <SelectValue>Alpha</SelectValue>
          </SelectTrigger>
        </Select>,
      );
      try {
        expect(getComputedStyle(page.getByTestId("trigger").element()).borderTopColor).toBe(
          expected,
        );
      } finally {
        await screen.unmount();
      }
    });
  });

  describe("Checkbox", () => {
    it.each([
      ["light", "rgb(123, 121, 134)"],
      ["dark", "rgb(117, 116, 129)"],
    ] as const)("borders the box in outline (%s)", async (variant, expected) => {
      restore = useMimirPalette(variant);
      const screen = await render(<Checkbox data-testid="cb" />);
      try {
        expect(getComputedStyle(page.getByTestId("cb").element()).borderTopColor).toBe(expected);
      } finally {
        await screen.unmount();
      }
    });

    it("fills the checked box with primary and inverts the glyph", async () => {
      restore = useMimirPalette("light");
      const screen = await render(<Checkbox data-testid="cb" defaultChecked />);
      try {
        const indicator = page
          .getByTestId("cb")
          .element()
          .querySelector("[data-slot='checkbox-indicator']")!;
        expect(getComputedStyle(indicator).backgroundColor).toBe("rgb(99, 65, 217)");
        expect(getComputedStyle(indicator).color).toBe("rgb(252, 247, 255)");
      } finally {
        await screen.unmount();
      }
    });

    it("gives the box M3's focus indicator rather than a ring", async () => {
      const screen = await render(<Checkbox data-testid="cb" />);
      try {
        // `:focus-visible` only matches on real keyboard navigation, not a programmatic
        // focus, so this tabs rather than calling focus().
        await userEvent.tab();
        const box = page.getByTestId("cb").element();
        expect(box.matches(":focus-visible")).toBe(true);
        const style = getComputedStyle(box);
        expect(style.outlineWidth).toBe("3px");
        expect(style.outlineOffset).toBe("2px");
        // The shared 1px ring is gone.
        expect(style.boxShadow).toBe("none");
      } finally {
        await screen.unmount();
      }
    });
  });
});
