import { ThreadId } from "@synara/contracts";
import { describe, expect, it } from "vitest";

import { resolveActiveSidechatPanelItem } from "./EnvironmentSidechatsSection.logic";

// Newest activity first, the order createSidechatSummariesForSourceSelector hands over.
const SIDECHATS = [
  { id: ThreadId.makeUnsafe("sidechat-newest"), title: "Newest", expiredAt: null },
  { id: ThreadId.makeUnsafe("sidechat-older"), title: "Older", expiredAt: null },
];

describe("resolveActiveSidechatPanelItem", () => {
  it("keeps the row pointed at the side chat the dock pane is showing", () => {
    expect(
      resolveActiveSidechatPanelItem({
        sidechats: SIDECHATS,
        activeSidechatId: ThreadId.makeUnsafe("sidechat-older"),
      })?.title,
    ).toBe("Older");
  });

  it("falls back to the newest side chat before a pane exists or after it is closed", () => {
    expect(
      resolveActiveSidechatPanelItem({ sidechats: SIDECHATS, activeSidechatId: null })?.title,
    ).toBe("Newest");
    expect(
      resolveActiveSidechatPanelItem({
        sidechats: SIDECHATS,
        activeSidechatId: ThreadId.makeUnsafe("sidechat-deleted"),
      })?.title,
    ).toBe("Newest");
  });

  it("has no active side chat for an empty list", () => {
    expect(resolveActiveSidechatPanelItem({ sidechats: [], activeSidechatId: null })).toBeNull();
  });
});
