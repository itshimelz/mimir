import { describe, expect, it } from "vitest";

import {
  buildStepVerificationPrompt,
  clampEditorChatPaneWidth,
  clampStudioSplitRatio,
  EDITOR_CENTER_PANE_MAX_WIDTH,
  EDITOR_CENTER_PANE_MIN_WIDTH,
  EDITOR_CHAT_PANE_DEFAULT_WIDTH,
  EDITOR_CHAT_PANE_MAX_WIDTH,
  EDITOR_CHAT_PANE_MIN_WIDTH,
  formatSourceCitationPill,
  resolveEditorPaneBounds,
  shouldAcceptEditorChatPaneWidth,
} from "./EditorWorkspaceView.logic";

// The center pane's ceiling only starts yielding room once the row exceeds
// centerMax + chatMax; below that the rail's own ceiling is the binding one.
const WIDE_ROW = EDITOR_CENTER_PANE_MAX_WIDTH + EDITOR_CHAT_PANE_MAX_WIDTH;

describe("resolveEditorPaneBounds", () => {
  it("bounds the chat rail to its maximum ceiling on wide displays", () => {
    const { chatMaxWidth } = resolveEditorPaneBounds(WIDE_ROW);
    expect(chatMaxWidth).toBe(EDITOR_CHAT_PANE_MAX_WIDTH);

    const ultrawide = resolveEditorPaneBounds(WIDE_ROW + 900);
    expect(ultrawide.chatMaxWidth).toBe(EDITOR_CHAT_PANE_MAX_WIDTH);
  });

  it("clamps the rail's max width on narrow rows to protect the center floor", () => {
    const bounds = resolveEditorPaneBounds(600);
    expect(bounds.chatMaxWidth).toBe(600 - EDITOR_CENTER_PANE_MIN_WIDTH);
  });

  it("keeps the rail's floor even on a row too narrow for both floors", () => {
    const bounds = resolveEditorPaneBounds(EDITOR_CENTER_PANE_MIN_WIDTH);
    expect(bounds.chatMinWidth).toBe(EDITOR_CHAT_PANE_MIN_WIDTH);
    expect(bounds.chatMaxWidth).toBeGreaterThanOrEqual(EDITOR_CHAT_PANE_MIN_WIDTH);
    expect(bounds.centerMinWidth).toBe(EDITOR_CENTER_PANE_MIN_WIDTH);
  });
});

describe("clampEditorChatPaneWidth", () => {
  it("clamps to the rail's own bounds", () => {
    expect(clampEditorChatPaneWidth(10)).toBe(EDITOR_CHAT_PANE_MIN_WIDTH);
    expect(clampEditorChatPaneWidth(99999, WIDE_ROW)).toBe(EDITOR_CHAT_PANE_MAX_WIDTH);
  });

  it("honors the row width, so a width saved wide cannot open wider than the window", () => {
    // 420px of center below its 320px floor, so this row cannot show 900px of rail.
    const narrow = clampEditorChatPaneWidth(900, 740);
    expect(narrow).toBe(740 - EDITOR_CENTER_PANE_MIN_WIDTH);
  });

  it("rounds a fractional drag and falls back to the default on a non-finite width", () => {
    expect(clampEditorChatPaneWidth(400.4, WIDE_ROW)).toBe(400);
    expect(clampEditorChatPaneWidth(Number.NaN)).toBe(EDITOR_CHAT_PANE_DEFAULT_WIDTH);
  });
});

describe("shouldAcceptEditorChatPaneWidth", () => {
  it("refuses a drag that would push the center below its floor", () => {
    // A row the rail can legitimately fill up to the center's floor, and then not one pixel
    // further.
    const rowWidth = EDITOR_CHAT_PANE_MAX_WIDTH + EDITOR_CENTER_PANE_MIN_WIDTH + 100;
    expect(
      shouldAcceptEditorChatPaneWidth({
        nextWidth: rowWidth - EDITOR_CENTER_PANE_MIN_WIDTH,
        rowWidth,
      }),
    ).toBe(true);
    expect(
      shouldAcceptEditorChatPaneWidth({
        nextWidth: rowWidth - EDITOR_CENTER_PANE_MIN_WIDTH + 1,
        rowWidth,
      }),
    ).toBe(false);
  });

  it("refuses a drag below the rail's floor, which the clamp cannot reach", () => {
    expect(
      shouldAcceptEditorChatPaneWidth({
        nextWidth: EDITOR_CHAT_PANE_MIN_WIDTH - 1,
        rowWidth: WIDE_ROW,
      }),
    ).toBe(false);
  });

  it("stays responsive on a row too narrow for both floors", () => {
    // A window this small cannot satisfy both floors; the rail must still be draggable to its
    // own minimum rather than sticking at a dead stop with no legal width at all.
    const rowWidth = EDITOR_CENTER_PANE_MIN_WIDTH;
    expect(
      shouldAcceptEditorChatPaneWidth({ nextWidth: EDITOR_CHAT_PANE_MIN_WIDTH, rowWidth }),
    ).toBe(true);
    // The rail's own floor still holds — this is a window problem, not an unlimited rail.
    expect(
      shouldAcceptEditorChatPaneWidth({ nextWidth: EDITOR_CHAT_PANE_MIN_WIDTH - 1, rowWidth }),
    ).toBe(false);
  });
});

describe("buildStepVerificationPrompt", () => {
  it("constructs Socratic step verification prompt with source file", () => {
    const prompt = buildStepVerificationPrompt("Step 1: E = mc^2", "Lecture_04.pdf");
    expect(prompt).toContain("Verify my problem-solving steps line-by-line against Lecture_04.pdf");
    expect(prompt).toContain("Tier 1 conceptual nudge");
    expect(prompt).toContain("Step 1: E = mc^2");
  });
});

describe("formatSourceCitationPill", () => {
  it("formats citation with page or slide", () => {
    expect(formatSourceCitationPill("Syllabus.pdf", 4)).toBe("[Source: Syllabus.pdf, p. 4]");
  });

  it("formats citation without page", () => {
    expect(formatSourceCitationPill("Readings.md")).toBe("[Source: Readings.md]");
  });
});

describe("clampStudioSplitRatio", () => {
  it("defaults to 0.55 when given NaN", () => {
    expect(clampStudioSplitRatio(Number.NaN)).toBe(0.55);
  });

  it("clamps ratio within container bounds", () => {
    // 1000px container width:
    // minRatio = 280 / 1000 = 0.28
    // maxRatio = (1000 - 260) / 1000 = 0.74
    expect(clampStudioSplitRatio(0.55, 1000)).toBe(0.55);
    expect(clampStudioSplitRatio(0.1, 1000)).toBeCloseTo(0.28, 2);
    expect(clampStudioSplitRatio(0.9, 1000)).toBeCloseTo(0.74, 2);
  });

  it("falls back to [0.15, 0.85] bounds when width is unknown", () => {
    expect(clampStudioSplitRatio(0.05)).toBe(0.15);
    expect(clampStudioSplitRatio(0.95)).toBe(0.85);
    expect(clampStudioSplitRatio(0.6)).toBe(0.6);
  });
});
