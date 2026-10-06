// FILE: ProjectSourceSegmentedPicker.m3.browser.tsx
// Purpose: Proves the Create-project source switch is M3E segmented tabs (tab semantics +
//          surface-container track with a secondary-container indicator) rather than the
//          raised-thumb radio group it replaced, and that the field chrome it sits above
//          carries M3 roles.
// Layer: Web UI dialog browser test
// Depends on: the real tabs primitive and real layout metrics (the indicator has to move).

import "../index.css";

import { page, userEvent } from "vitest/browser";
import { afterEach, describe, expect, it } from "vitest";
import { useState } from "react";
import { render } from "vitest-browser-react";

import { ProjectSourceSegmentedPicker } from "./ProjectSourceSegmentedPicker";
import { dialogFieldLabelClassName } from "./ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";

/**
 * The M3 palette is scoped to `:root[data-code-theme-id="synara"]` and its `.dark` twin,
 * which useTheme sets. Renders here run without the theme hook, so the attribute is set
 * directly — otherwise every color assertion would read the bridge's fallbacks.
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

const OUTLINE_VARIANT = { light: "rgb(178, 176, 190)", dark: "rgb(71, 71, 83)" } as const;
const SURFACE_CONTAINER = { light: "rgb(239, 236, 248)", dark: "rgb(25, 25, 33)" } as const;
const SECONDARY_CONTAINER = { light: "rgb(230, 222, 255)", dark: "rgb(60, 56, 83)" } as const;
const ON_SECONDARY_CONTAINER = { light: "rgb(83, 78, 106)", dark: "rgb(194, 187, 220)" } as const;

/** Reads the selected state straight off the DOM, so it works for any controlled value. */
function selectedState() {
  return Array.from(document.querySelectorAll("[data-slot='tabs-trigger']")).map((tab) =>
    tab.getAttribute("aria-selected"),
  );
}

/** Reads the sliding pill Base UI moves between tabs. */
function indicatorBox() {
  return (
    document.querySelector("[data-slot='tabs-indicator']") as HTMLElement
  ).getBoundingClientRect();
}

/** A controlled harness, because the indicator only moves when the value does. */
function ControlledPicker(props: { githubAvailable?: boolean; onValue?: (value: string) => void }) {
  const [value, setValue] = useState<"local" | "github">("local");
  return (
    <ProjectSourceSegmentedPicker
      disabled={false}
      githubAvailable={props.githubAvailable ?? true}
      onValueChange={(next) => {
        setValue(next);
        props.onValue?.(next);
      }}
      value={value}
    />
  );
}

describe("Create project source switch (Material 3)", () => {
  let restore: (() => void) | null = null;
  afterEach(() => {
    restore?.();
    restore = null;
  });

  it("is a tablist, not a radio group", async () => {
    restore = useMimirPalette("light");
    const screen = await render(<ControlledPicker />);
    try {
      // The choice swaps the whole field set below it, so the tab role is the honest one.
      // The old control exposed `radiogroup`/`radio`.
      const list = document.querySelector("[data-slot='tabs-list']");
      expect(list?.getAttribute("role")).toBe("tablist");
      expect(document.querySelector("[role='radiogroup']")).toBeNull();
      const tabs = Array.from(document.querySelectorAll("[data-slot='tabs-trigger']"));
      expect(tabs).toHaveLength(2);
      expect(tabs.map((tab) => tab.getAttribute("role"))).toEqual(["tab", "tab"]);
      expect(tabs.map((tab) => tab.textContent?.trim())).toEqual(["Folder", "GitHub"]);
    } finally {
      await screen.unmount();
    }
  });

  it("marks exactly one tab selected and moves it on click", async () => {
    restore = useMimirPalette("light");
    const changes: string[] = [];
    const screen = await render(<ControlledPicker onValue={(value) => changes.push(value)} />);
    try {
      expect(selectedState()).toEqual(["true", "false"]);
      await userEvent.click(page.getByRole("tab", { name: "GitHub" }).element());
      expect(selectedState()).toEqual(["false", "true"]);
      expect(changes).toEqual(["github"]);
    } finally {
      await screen.unmount();
    }
  });

  it("slides the indicator onto the newly selected tab", async () => {
    restore = useMimirPalette("light");
    const screen = await render(<ControlledPicker />);
    try {
      await expect.poll(() => indicatorBox().width).toBeGreaterThan(0);
      const before = indicatorBox();
      await userEvent.click(page.getByRole("tab", { name: "GitHub" }).element());
      await expect.poll(() => indicatorBox().left).not.toBeCloseTo(before.left, 0);
      const after = indicatorBox();
      // The pill tracks the selected tab rather than jumping across the whole track.
      expect(after.left).toBeGreaterThan(before.left);
      expect(Math.abs(after.width - before.width)).toBeLessThan(after.width);
    } finally {
      await screen.unmount();
    }
  });

  it.each(["light", "dark"] as const)(
    "paints the segmented track on surface-container with a secondary-container pill (%s)",
    async (variant) => {
      restore = useMimirPalette(variant);
      const screen = await render(<ControlledPicker />);
      try {
        const list = document.querySelector("[data-slot='tabs-list']") as HTMLElement;
        const indicator = document.querySelector("[data-slot='tabs-indicator']") as HTMLElement;
        expect(getComputedStyle(list).backgroundColor).toBe(SURFACE_CONTAINER[variant]);
        expect(getComputedStyle(indicator).backgroundColor).toBe(SECONDARY_CONTAINER[variant]);
        // The selected label takes the matching ink, one step down from the track's.
        const selected = document.querySelector(
          "[data-slot='tabs-trigger'][aria-selected='true']",
        ) as HTMLElement;
        expect(getComputedStyle(selected).color).toBe(ON_SECONDARY_CONTAINER[variant]);
        // M3E's segmented track is a full-round pill, not the old square-cornered track.
        const radius = Number.parseFloat(getComputedStyle(list).borderTopLeftRadius);
        expect(radius).toBeGreaterThanOrEqual(list.getBoundingClientRect().height / 2);
      } finally {
        await screen.unmount();
      }
    },
  );

  it("disables the GitHub tab when provisioning is unavailable and explains why", async () => {
    restore = useMimirPalette("light");
    const changes: string[] = [];
    const screen = await render(
      <ControlledPicker githubAvailable={false} onValue={(value) => changes.push(value)} />,
    );
    try {
      const github = page.getByRole("tab", { name: "GitHub" }).element() as HTMLButtonElement;
      // Base UI keeps a disabled tab focusable (`focusableWhenDisabled`) so a keyboard
      // user can still reach it and hear why it is unavailable — which is why this is
      // `aria-disabled` rather than the native attribute, and why the `title` matters.
      expect(github.getAttribute("aria-disabled")).toBe("true");
      expect(github.disabled).toBe(false);
      expect(github.getAttribute("title")).toContain("Update the Mimir server");
      // A native click, not userEvent: the browser driver refuses to click anything it
      // reads as disabled, which would prove nothing about Base UI's own guard.
      github.click();
      expect(changes).toEqual([]);
      expect(
        page.getByRole("tab", { name: "Folder" }).element().getAttribute("aria-selected"),
      ).toBe("true");
    } finally {
      await screen.unmount();
    }
  });
});

describe("Create project field chrome (Material 3)", () => {
  let restore: (() => void) | null = null;
  afterEach(() => {
    restore?.();
    restore = null;
  });

  it.each(["light", "dark"] as const)(
    "frames a field in outline-variant and moves that outline to primary on focus (%s)",
    async (variant) => {
      restore = useMimirPalette(variant);
      const screen = await render(
        <InputGroup data-testid="field">
          <InputGroupAddon>
            <svg />
          </InputGroupAddon>
          <InputGroupInput aria-label="Project folder path" placeholder="/path/to/project" />
        </InputGroup>,
      );
      try {
        const field = page.getByTestId("field").element();
        const input = page.getByLabelText("Project folder path").element() as HTMLInputElement;
        expect(getComputedStyle(field).borderTopColor).toBe(OUTLINE_VARIANT[variant]);
        await userEvent.click(input);
        // Focus moves the outline to `primary`; this is the same rule the migrated Input
        // carries, so a grouped field and a bare one read as one control.
        expect(getComputedStyle(field).borderTopColor).not.toBe(OUTLINE_VARIANT[variant]);
        expect(getComputedStyle(field).borderTopColor).toBe(
          variant === "light" ? "rgb(99, 65, 217)" : "rgb(203, 190, 255)",
        );
      } finally {
        await screen.unmount();
      }
    },
  );

  it("moves the field outline to error when the value is invalid", async () => {
    restore = useMimirPalette("light");
    const screen = await render(
      <InputGroup data-testid="field">
        <InputGroupInput aria-invalid aria-label="Project folder path" />
      </InputGroup>,
    );
    try {
      const field = page.getByTestId("field").element();
      expect(getComputedStyle(field).borderTopColor).toBe("rgb(168, 54, 75)");
    } finally {
      await screen.unmount();
    }
  });

  it("puts a dialog field label on on-surface-variant ink", async () => {
    restore = useMimirPalette("light");
    const screen = await render(<span className={dialogFieldLabelClassName}>Space</span>);
    try {
      expect(getComputedStyle(page.getByText("Space").element()).color).toBe("rgb(95, 94, 106)");
    } finally {
      await screen.unmount();
    }
  });
});
