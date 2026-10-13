// FILE: ApplicationMenuBar.test.tsx
// Purpose: Tests for the ChatGPT-style ApplicationMenuBar component.
// Layer: Component unit tests
// Depends on: ApplicationMenuBar, React DOM server rendering, vitest

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ApplicationMenuBar } from "./ApplicationMenuBar";
import { SidebarProvider } from "./ui/sidebar";
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
});
