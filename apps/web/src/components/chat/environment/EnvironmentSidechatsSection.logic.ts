// FILE: EnvironmentSidechatsSection.logic.ts
// Purpose: Pure selection policy for the Environment panel's side chat section: which of a
//          host thread's side chats the single summary row represents.
// Layer: Web UI logic

import type { EnvironmentSidechatPanelItem } from "./EnvironmentSidechatsSection";

/**
 * The side chat the section's one row stands for: the one this host's dock pane is showing,
 * or — before the pane exists or once it is closed — the most recently active one. Callers
 * pass side chats in newest-activity-first order (see
 * `createSidechatSummariesForSourceSelector`), so the first entry is the one the host
 * reopens, which keeps the row's name and the row's actions pointing at the same session.
 */
export function resolveActiveSidechatPanelItem(input: {
  readonly sidechats: readonly EnvironmentSidechatPanelItem[];
  /** The dock pane's thread id, which survives the dock being collapsed. */
  readonly activeSidechatId: string | null;
}): EnvironmentSidechatPanelItem | null {
  if (input.sidechats.length === 0) {
    return null;
  }
  if (input.activeSidechatId !== null) {
    const match = input.sidechats.find((sidechat) => sidechat.id === input.activeSidechatId);
    if (match) {
      return match;
    }
  }
  return input.sidechats[0] ?? null;
}
