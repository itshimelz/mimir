import { ThreadId } from "@synara/contracts";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EnvironmentSidechatsSection } from "./EnvironmentSidechatsSection";

const SIDECHATS = [
  {
    id: ThreadId.makeUnsafe("sidechat-active"),
    title: "Auth refactor notes",
    expiredAt: null,
  },
  {
    id: ThreadId.makeUnsafe("sidechat-expired"),
    title: "Old investigation",
    expiredAt: "2026-08-30T12:00:00.000Z",
  },
];

describe("EnvironmentSidechatsSection", () => {
  it("names only the active side chat and keeps the rest behind the dot menu", () => {
    const markup = renderToStaticMarkup(
      <EnvironmentSidechatsSection
        sidechats={SIDECHATS}
        activeSidechatId={ThreadId.makeUnsafe("sidechat-active")}
        onCreate={() => undefined}
        onOpen={() => undefined}
        onDelete={() => undefined}
      />,
    );

    expect(markup).toContain("Auth refactor notes");
    // The full list moved into the History submenu, so it is no longer panel markup.
    expect(markup).not.toContain("Old investigation");
    expect(markup).not.toContain("Expired");
    expect(markup).toContain('role="group"');
    expect(markup).toContain('aria-label="Side chats"');
    expect(markup).toContain("Open side chat Auth refactor notes");
    expect(markup).toContain("Side chat options");
  });

  it("falls back to the most recent side chat when the host has no side chat pane", () => {
    const markup = renderToStaticMarkup(
      <EnvironmentSidechatsSection
        sidechats={SIDECHATS}
        activeSidechatId={null}
        onCreate={() => undefined}
        onOpen={() => undefined}
        onDelete={() => undefined}
      />,
    );

    expect(markup).toContain("Open side chat Auth refactor notes");
  });

  it("dims the row while the active side chat is expired", () => {
    const markup = renderToStaticMarkup(
      <EnvironmentSidechatsSection
        sidechats={SIDECHATS}
        activeSidechatId={ThreadId.makeUnsafe("sidechat-expired")}
        onCreate={() => undefined}
        onOpen={() => undefined}
        onDelete={() => undefined}
      />,
    );

    expect(markup).toContain("Open side chat Old investigation");
    expect(markup).toContain("opacity-60");
  });

  it("renders nothing when there are no side chats yet", () => {
    const markup = renderToStaticMarkup(
      <EnvironmentSidechatsSection
        sidechats={[]}
        activeSidechatId={null}
        onCreate={() => undefined}
        onOpen={() => undefined}
        onDelete={() => undefined}
      />,
    );

    expect(markup).toBe("");
  });
});
