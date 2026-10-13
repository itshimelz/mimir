// FILE: EnvironmentSidechatsSection.browser.tsx
// Purpose: Browser-level tests for the side chat section's dot menu: the one row names the
//          active session, and creation / switching / deletion live behind the menu.
// Layer: Vitest browser tests

import "../../../index.css";

import { ThreadId } from "@synara/contracts";
import { page } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { EnvironmentSidechatsSection } from "./EnvironmentSidechatsSection";

const ACTIVE_ID = ThreadId.makeUnsafe("sidechat-active");
const EXPIRED_ID = ThreadId.makeUnsafe("sidechat-expired");

const SIDECHATS = [
  { id: ACTIVE_ID, title: "Auth refactor notes", expiredAt: null },
  { id: EXPIRED_ID, title: "Old investigation", expiredAt: "2026-08-30T12:00:00.000Z" },
];

// No manual body wipe between tests: the menus portal into document.body, and clearing it
// out from under React's portal node throws on the next unmount. `render` cleans up.
describe("EnvironmentSidechatsSection", () => {
  it("shows one row for the active side chat and opens it on click", async () => {
    const onOpen = vi.fn();
    await render(
      <EnvironmentSidechatsSection
        sidechats={SIDECHATS}
        activeSidechatId={ACTIVE_ID}
        onCreate={vi.fn()}
        onOpen={onOpen}
        onDelete={vi.fn()}
      />,
    );

    await page.getByRole("button", { name: "Open side chat Auth refactor notes" }).click();

    expect(onOpen).toHaveBeenCalledWith(ACTIVE_ID);
  });

  it("creates a new side chat from the dot menu", async () => {
    const onCreate = vi.fn();
    await render(
      <EnvironmentSidechatsSection
        sidechats={SIDECHATS}
        activeSidechatId={ACTIVE_ID}
        onCreate={onCreate}
        onOpen={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await page.getByRole("button", { name: "Side chat options" }).click();
    await page.getByRole("menuitem", { name: "New side chat" }).click();

    expect(onCreate).toHaveBeenCalledOnce();
  });

  it("switches side chats from the History submenu, marking expired ones", async () => {
    const onOpen = vi.fn();
    await render(
      <EnvironmentSidechatsSection
        sidechats={SIDECHATS}
        activeSidechatId={ACTIVE_ID}
        onCreate={vi.fn()}
        onOpen={onOpen}
        onDelete={vi.fn()}
      />,
    );

    await page.getByRole("button", { name: "Side chat options" }).click();
    await page.getByRole("menuitem", { name: /History/ }).hover();
    await page.getByRole("menuitemradio", { name: /Old investigation/ }).click();

    expect(onOpen).toHaveBeenCalledWith(EXPIRED_ID);
  });

  it("deletes the side chat the row names, not whichever one is listed", async () => {
    const onDelete = vi.fn();
    await render(
      <EnvironmentSidechatsSection
        sidechats={SIDECHATS}
        activeSidechatId={EXPIRED_ID}
        onCreate={vi.fn()}
        onOpen={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await page.getByRole("button", { name: "Side chat options" }).click();
    await page.getByRole("menuitem", { name: "Delete side chat" }).click();

    expect(onDelete).toHaveBeenCalledWith(
      expect.objectContaining({ id: EXPIRED_ID, title: "Old investigation" }),
    );
  });
});
