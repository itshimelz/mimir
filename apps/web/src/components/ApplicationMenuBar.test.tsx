// FILE: ApplicationMenuBar.test.tsx
// Purpose: Tests for the ChatGPT-style ApplicationMenuBar component.
// Layer: Component unit tests
// Depends on: ApplicationMenuBar, React DOM server rendering, vitest

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ApplicationMenuBar } from "./ApplicationMenuBar";
import { SidebarProvider } from "./ui/sidebar";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarShortcut,
  MenubarTrigger,
} from "./ui/menubar";
import { dispatchDesktopMenuAction, subscribeDesktopMenuAction } from "~/lib/desktopMenuActions";

describe("ApplicationMenuBar", () => {
  it("renders File, Edit, View, and Help menu triggers by default", () => {
    const html = renderToStaticMarkup(
      <SidebarProvider defaultOpen>
        <ApplicationMenuBar />
      </SidebarProvider>,
    );

    expect(html).toContain('aria-label="Application menu"');
    expect(html).toContain("File");
    expect(html).toContain("Edit");
    expect(html).toContain("View");
    expect(html).toContain("Help");
  });

  it("safely renders even outside SidebarProvider without crashing", () => {
    const html = renderToStaticMarkup(<ApplicationMenuBar />);

    expect(html).toContain('aria-label="Application menu"');
    expect(html).toContain("File");
  });

  it("dispatches actions to desktop menu action subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeDesktopMenuAction(listener);

    dispatchDesktopMenuAction("new-thread");
    expect(listener).toHaveBeenCalledWith("new-thread");

    dispatchDesktopMenuAction("toggle-sidebar");
    expect(listener).toHaveBeenCalledWith("toggle-sidebar");

    unsubscribe();
    dispatchDesktopMenuAction("toggle-sidebar");
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("renders MenubarShortcut with ShortcutKbd keycaps and authentic primitive UI tokens", () => {
    const html = renderToStaticMarkup(<MenubarShortcut>Ctrl+N</MenubarShortcut>);

    expect(html).toContain('data-slot="menubar-shortcut"');
    expect(html).toContain("<kbd");
    expect(html).toContain("rounded-xs");
    expect(html).toContain("bg-foreground/5");
    expect(html).toContain("Ctrl+N");
    expect(html).toContain("text-ui-xs");
    expect(html).not.toContain("shadow-md");
    expect(html).not.toContain("var(--color-background-surface-under)");
  });

  it("renders MenubarTrigger with primitive trigger styling", () => {
    const html = renderToStaticMarkup(
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
      </MenubarMenu>,
    );

    expect(html).toContain('data-slot="menubar-trigger"');
    expect(html).toContain("text-ui-sm");
    expect(html).toContain("File");
  });
});
