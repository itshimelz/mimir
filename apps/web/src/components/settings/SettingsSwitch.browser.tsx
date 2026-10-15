import "../../index.css";

import { DEFAULT_SERVER_SETTINGS_VIEW } from "@synara/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { page } from "vitest/browser";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { serverQueryKeys } from "~/lib/serverReactQuery";

import { SettingsRow } from "./SettingsPanelPrimitives";
import { Switch } from "../ui/switch";

/**
 * A settings row with the shared switch, standing in for the shape every settings panel
 * uses (`<SettingsRow … control={<Switch …/>} />`). The point of this file is that the
 * settings surface inherits the Material 3 switch from the shared primitive rather than
 * keeping a settings-only toggle of its own.
 */
function SettingsSwitchRow() {
  return (
    <SettingsRow
      title="Computer control"
      description="Let the agent use the desktop in any chat."
      control={<Switch defaultChecked aria-label="Let the agent use the desktop in any chat" />}
    />
  );
}

function useMimirPalette(variant: "light" | "dark") {
  const root = document.documentElement;
  root.setAttribute("data-code-theme-id", "synara");
  root.classList.toggle("dark", variant === "dark");
  return () => {
    root.removeAttribute("data-code-theme-id");
    root.classList.remove("dark");
  };
}

describe("Settings switch", () => {
  let restore: (() => void) | null = null;
  afterEach(() => {
    restore?.();
    restore = null;
  });

  it("gives a settings toggle M3's 52x32 track and growing handle", async () => {
    restore = useMimirPalette("light");
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(serverQueryKeys.settings(), DEFAULT_SERVER_SETTINGS_VIEW);
    const screen = await render(
      <QueryClientProvider client={client}>
        <SettingsSwitchRow />
      </QueryClientProvider>,
    );
    try {
      const toggle = page.getByRole("switch", { name: /desktop in any chat/i }).element();
      const track = toggle.getBoundingClientRect();
      expect(Math.round(track.width)).toBe(52);
      expect(Math.round(track.height)).toBe(32);

      const handle = toggle.querySelector("[data-slot='switch-thumb']")!.getBoundingClientRect();
      // Selected, so the handle is at its grown size.
      expect(Math.round(handle.width)).toBe(24);

      // And it is the M3 selected pair, not the old accent grey.
      expect(getComputedStyle(toggle).backgroundColor).toBe("rgb(99, 65, 217)");
      expect(
        getComputedStyle(toggle.querySelector("[data-slot='switch-thumb']")!).backgroundColor,
      ).toBe("rgb(252, 247, 255)");
    } finally {
      await screen.unmount();
    }
  });

  it("keeps the handle inside the row's right edge when selected", async () => {
    restore = useMimirPalette("light");
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(serverQueryKeys.settings(), DEFAULT_SERVER_SETTINGS_VIEW);
    const screen = await render(
      <QueryClientProvider client={client}>
        <SettingsSwitchRow />
      </QueryClientProvider>,
    );
    try {
      const toggle = page.getByRole("switch", { name: /desktop in any chat/i }).element();
      const row = toggle.closest("[data-slot]")!.getBoundingClientRect();
      expect(toggle.getBoundingClientRect().right).toBeLessThanOrEqual(row.right);
    } finally {
      await screen.unmount();
    }
  });
});
