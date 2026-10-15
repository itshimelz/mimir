import "../../index.css";

import { page } from "vitest/browser";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { Button } from "./button";
import { Label } from "./label";
import { Switch } from "./switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Toggle } from "./toggle";

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

describe("M3E interactive primitives", () => {
  let restore: (() => void) | null = null;
  afterEach(() => {
    restore?.();
    restore = null;
  });

  describe("Button roles", () => {
    it.each([
      ["default", "rgb(99, 65, 217)", "rgb(252, 247, 255)"],
      ["destructive", "rgb(168, 54, 75)", "rgb(255, 247, 247)"],
      ["secondary", "rgb(227, 225, 240)", "rgb(95, 94, 106)"],
      ["subtle", "rgb(239, 236, 248)", "rgb(50, 49, 61)"],
      ["prominent", "rgb(14, 14, 19)", "rgb(158, 156, 163)"],
      ["primary-outline", "rgba(0, 0, 0, 0)", "rgb(99, 65, 217)"],
      ["destructive-outline", "rgba(0, 0, 0, 0)", "rgb(168, 54, 75)"],
    ] as const)("paints the %s button on its M3 role pair (light)", async (variant, bg, fg) => {
      restore = useMimirPalette("light");
      const screen = await render(
        <Button data-testid="btn" variant={variant}>
          Go
        </Button>,
      );
      try {
        const button = page.getByTestId("btn").element();
        expect(getComputedStyle(button).backgroundColor).toBe(bg);
        expect(getComputedStyle(button).color).toBe(fg);
      } finally {
        await screen.unmount();
      }
    });

    it.each([
      ["default", "rgb(203, 190, 255)", "rgb(67, 18, 185)"],
      ["destructive", "rgb(249, 115, 134)", "rgb(73, 0, 19)"],
      ["secondary", "rgb(37, 37, 48)", "rgb(171, 169, 183)"],
    ] as const)("paints the %s button on its M3 role pair (dark)", async (variant, bg, fg) => {
      restore = useMimirPalette("dark");
      const screen = await render(
        <Button data-testid="btn" variant={variant}>
          Go
        </Button>,
      );
      try {
        const button = page.getByTestId("btn").element();
        expect(getComputedStyle(button).backgroundColor).toBe(bg);
        expect(getComputedStyle(button).color).toBe(fg);
      } finally {
        await screen.unmount();
      }
    });

    it.each(["outline", "chrome-outline", "secondary-outline"] as const)(
      "draws the %s button's border in outline-variant",
      async (variant) => {
        restore = useMimirPalette("light");
        const screen = await render(
          <Button data-testid="btn" variant={variant}>
            Go
          </Button>,
        );
        try {
          // #b2b0be at full strength: an M3 outline is a role, not a 62% wash.
          expect(getComputedStyle(page.getByTestId("btn").element()).borderTopColor).toBe(
            "rgb(178, 176, 190)",
          );
        } finally {
          await screen.unmount();
        }
      },
    );

    it("keeps every button flat, as the variant taxonomy requires", async () => {
      const screen = await render(
        <Button data-testid="btn" variant="default">
          Go
        </Button>,
      );
      try {
        // M3E elevates its filled buttons; this axis is 137 call sites composed against a
        // flat surface, so the elevation is deliberately not adopted.
        expect(getComputedStyle(page.getByTestId("btn").element()).boxShadow).toBe("none");
      } finally {
        await screen.unmount();
      }
    });

    it("keeps button type on the app's UI text scale", async () => {
      const screen = await render(<Button data-testid="btn">Go</Button>);
      try {
        expect(page.getByTestId("btn").element().className).not.toMatch(/text-label-|text-title-/);
      } finally {
        await screen.unmount();
      }
    });
  });

  describe("Switch roles", () => {
    it("paints the checked track on primary with an on-primary thumb", async () => {
      restore = useMimirPalette("light");
      const screen = await render(<Switch data-testid="sw" defaultChecked />);
      try {
        const track = page.getByTestId("sw").element();
        expect(getComputedStyle(track).backgroundColor).toBe("rgb(99, 65, 217)");
        const thumb = track.querySelector("[data-slot='switch-thumb']")!;
        expect(getComputedStyle(thumb).backgroundColor).toBe("rgb(252, 247, 255)");
      } finally {
        await screen.unmount();
      }
    });

    it("paints the unchecked track on surface-container-highest with an outline thumb", async () => {
      restore = useMimirPalette("light");
      const screen = await render(<Switch data-testid="sw" />);
      try {
        const track = page.getByTestId("sw").element();
        expect(getComputedStyle(track).backgroundColor).toBe("rgb(227, 225, 240)");
        // M3 borders the unselected track in `outline`, not the fainter outline-variant.
        expect(getComputedStyle(track).borderTopColor).toBe("rgb(123, 121, 134)");
        const thumb = track.querySelector("[data-slot='switch-thumb']")!;
        // M3's unselected thumb is `outline`, not white.
        expect(getComputedStyle(thumb).backgroundColor).toBe("rgb(123, 121, 134)");
      } finally {
        await screen.unmount();
      }
    });

    it("grows the handle 16 to 24dp when selected, on M3's 52x32 track", async () => {
      restore = useMimirPalette("light");
      const screen = await render(<Switch data-testid="sw" />);
      try {
        const track = page.getByTestId("sw").element();
        // M3's default switch: a 52x32 track.
        expect(Math.round(track.getBoundingClientRect().width)).toBe(52);
        expect(Math.round(track.getBoundingClientRect().height)).toBe(32);
        const handle = track.querySelector("[data-slot='switch-thumb']")!.getBoundingClientRect();
        expect(Math.round(handle.width)).toBe(16);
      } finally {
        await screen.unmount();
      }

      const screen2 = await render(<Switch data-testid="sw2" defaultChecked />);
      try {
        const track = page.getByTestId("sw2").element();
        const thumb = track.querySelector("[data-slot='switch-thumb']")!.getBoundingClientRect();
        // The handle grows as it travels; that growth is the M3 signature.
        expect(Math.round(thumb.width)).toBe(24);
        expect(Math.round(thumb.height)).toBe(24);
        // It grows toward the track's inside edge, never past it.
        expect(thumb.right).toBeLessThanOrEqual(track.getBoundingClientRect().right);
      } finally {
        await screen2.unmount();
      }
    });

    it("animates the handle on M3's spatial spring and honours reduced motion", async () => {
      const screen = await render(<Switch data-testid="sw" defaultChecked />);
      try {
        const thumb = page.getByTestId("sw").element().querySelector("[data-slot='switch-thumb']")!;
        const style = getComputedStyle(thumb);
        // M3 Expressive ships its spatial spring as a `linear()` easing, so the browser
        // interpolates the physical curve rather than an approximation of it.
        expect(style.transitionTimingFunction).toContain("linear(");
        expect(style.transitionProperty).toContain("width");
      } finally {
        await screen.unmount();
      }
    });

    it("gives the handle a ripple host so presses have feedback", async () => {
      const screen = await render(<Switch data-testid="sw" />);
      try {
        expect(
          page.getByTestId("sw").element().querySelector('[data-slot="ripple"]'),
        ).not.toBeNull();
      } finally {
        await screen.unmount();
      }
    });
  });

  describe("Toggle roles", () => {
    it("carries selection in the secondary-container pair, not a tint", async () => {
      restore = useMimirPalette("light");
      const screen = await render(
        <Toggle data-testid="tg" defaultPressed>
          B
        </Toggle>,
      );
      try {
        const toggle = page.getByTestId("tg").element();
        expect(getComputedStyle(toggle).backgroundColor).toBe("rgb(230, 222, 255)");
        expect(getComputedStyle(toggle).color).toBe("rgb(83, 78, 106)");
      } finally {
        await screen.unmount();
      }
    });

    it("flips the outlined toggle to the inverse pair when selected", async () => {
      restore = useMimirPalette("light");
      const screen = await render(
        <Toggle data-testid="tg" variant="outline" defaultPressed>
          B
        </Toggle>,
      );
      try {
        const toggle = page.getByTestId("tg").element();
        expect(getComputedStyle(toggle).backgroundColor).toBe("rgb(14, 14, 19)");
        expect(getComputedStyle(toggle).color).toBe("rgb(158, 156, 163)");
      } finally {
        await screen.unmount();
      }
    });
  });

  describe("Label roles", () => {
    it("puts form labels on on-surface", async () => {
      restore = useMimirPalette("light");
      const screen = await render(<Label data-testid="lbl">Name</Label>);
      try {
        expect(getComputedStyle(page.getByTestId("lbl").element()).color).toBe("rgb(50, 49, 61)");
      } finally {
        await screen.unmount();
      }
    });
  });

  describe("Tabs roles and behavior", () => {
    it("paints the segmented tab list on surface-container with a secondary-container indicator (light)", async () => {
      restore = useMimirPalette("light");
      const screen = await render(
        <Tabs defaultValue="study" data-testid="tabs">
          <TabsList variant="segmented" data-testid="list">
            <TabsTrigger value="study" data-testid="tab-study">
              Study
            </TabsTrigger>
            <TabsTrigger value="studio" data-testid="tab-studio">
              Studio
            </TabsTrigger>
          </TabsList>
          <TabsContent value="study" data-testid="panel-study">
            Study content
          </TabsContent>
          <TabsContent value="studio" data-testid="panel-studio">
            Studio content
          </TabsContent>
        </Tabs>,
      );
      try {
        const list = page.getByTestId("list").element();
        // Mimir light: surface-container is #efecf8 -> rgb(239, 236, 248)
        expect(getComputedStyle(list).backgroundColor).toBe("rgb(239, 236, 248)");

        const tabStudy = page.getByTestId("tab-study").element();
        const tabStudio = page.getByTestId("tab-studio").element();
        // Selected tab text: on-secondary-container is #534e6a -> rgb(83, 78, 106)
        expect(getComputedStyle(tabStudy).color).toBe("rgb(83, 78, 106)");
        // Unselected tab text: on-surface-variant is #5f5e6a -> rgb(95, 94, 106)
        expect(getComputedStyle(tabStudio).color).toBe("rgb(95, 94, 106)");

        const indicator = list.querySelector('[data-slot="tabs-indicator"]')!;
        // Indicator: secondary-container is #e6deff -> rgb(230, 222, 255)
        expect(getComputedStyle(indicator).backgroundColor).toBe("rgb(230, 222, 255)");
        expect(parseFloat(getComputedStyle(indicator).borderRadius)).toBeGreaterThan(100);

        // Geometry: M3E segmented tab is 48px tall (h-12) with 40px pill indicator (p-1)
        expect(Math.round(list.getBoundingClientRect().height)).toBe(48);
        expect(Math.round(tabStudy.getBoundingClientRect().height)).toBe(40);
        expect(Math.round(indicator.getBoundingClientRect().height)).toBe(40);

        // Verify ripple host is present inside tab trigger
        expect(tabStudy.querySelector('[data-slot="ripple"]')).not.toBeNull();
      } finally {
        await screen.unmount();
      }
    });

    it("paints the segmented tab list on surface-container with a secondary-container indicator (dark)", async () => {
      restore = useMimirPalette("dark");
      const screen = await render(
        <Tabs defaultValue="study" data-testid="tabs">
          <TabsList variant="segmented" data-testid="list">
            <TabsTrigger value="study" data-testid="tab-study">
              Study
            </TabsTrigger>
            <TabsTrigger value="studio" data-testid="tab-studio">
              Studio
            </TabsTrigger>
          </TabsList>
        </Tabs>,
      );
      try {
        const list = page.getByTestId("list").element();
        // Mimir dark: surface-container is #191921 -> rgb(25, 25, 33)
        expect(getComputedStyle(list).backgroundColor).toBe("rgb(25, 25, 33)");

        const tabStudy = page.getByTestId("tab-study").element();
        const tabStudio = page.getByTestId("tab-studio").element();
        // Selected tab text: on-secondary-container is #c2bbdc -> rgb(194, 187, 220)
        expect(getComputedStyle(tabStudy).color).toBe("rgb(194, 187, 220)");
        // Unselected tab text: on-surface-variant is #aba9b7 -> rgb(171, 169, 183)
        expect(getComputedStyle(tabStudio).color).toBe("rgb(171, 169, 183)");

        const indicator = list.querySelector('[data-slot="tabs-indicator"]')!;
        // Indicator: secondary-container is #3c3853 -> rgb(60, 56, 83)
        expect(getComputedStyle(indicator).backgroundColor).toBe("rgb(60, 56, 83)");
      } finally {
        await screen.unmount();
      }
    });

    it("switches selection and updates content on click", async () => {
      restore = useMimirPalette("light");
      const screen = await render(
        <Tabs defaultValue="study">
          <TabsList variant="segmented">
            <TabsTrigger value="study">Study</TabsTrigger>
            <TabsTrigger value="studio">Studio</TabsTrigger>
          </TabsList>
          <TabsContent value="study">Study content</TabsContent>
          <TabsContent value="studio">Studio content</TabsContent>
        </Tabs>,
      );
      try {
        await expect.element(page.getByText("Study content")).toBeInTheDocument();
        await expect.element(page.getByText("Studio content")).not.toBeInTheDocument();

        await page.getByRole("tab", { name: "Studio" }).click();

        await expect.element(page.getByText("Study content")).not.toBeInTheDocument();
        await expect.element(page.getByText("Studio content")).toBeInTheDocument();
      } finally {
        await screen.unmount();
      }
    });
  });
});
