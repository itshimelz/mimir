// FILE: StudioWorkspaceView.logic.test.ts
// Purpose: Unit tests for Tri-Pane Study Studio width clamping, bounds, and prompt utilities.

import { describe, expect, it } from "vitest";
import {
  STUDIO_CHAT_PANE_DEFAULT_WIDTH,
  STUDIO_CHAT_PANE_MAX_WIDTH,
  STUDIO_CHAT_PANE_MIN_WIDTH,
  STUDIO_SOURCE_PANE_MIN_WIDTH,
  STUDIO_SYNTHESIS_PANE_MIN_WIDTH,
  buildStepVerificationPrompt,
  clampStudioChatPaneWidth,
  formatSourceCitationPill,
  resolveStudioPaneBounds,
} from "./StudioWorkspaceView.logic";

describe("StudioWorkspaceView.logic", () => {
  describe("resolveStudioPaneBounds", () => {
    it("allocates default bounds when wide enough", () => {
      const bounds = resolveStudioPaneBounds(1400, true);
      expect(bounds.chatMaxWidth).toBe(STUDIO_CHAT_PANE_MAX_WIDTH);
      expect(bounds.chatMinWidth).toBe(STUDIO_CHAT_PANE_MIN_WIDTH);
      expect(bounds.sourceMinWidth).toBe(STUDIO_SOURCE_PANE_MIN_WIDTH);
      expect(bounds.synthesisMinWidth).toBe(STUDIO_SYNTHESIS_PANE_MIN_WIDTH);
    });

    it("clamps chat max width when row is squeezed to protect source and synthesis floors", () => {
      const minPanes = STUDIO_SOURCE_PANE_MIN_WIDTH + STUDIO_SYNTHESIS_PANE_MIN_WIDTH;
      const bounds = resolveStudioPaneBounds(minPanes + 200, true);
      expect(bounds.chatMaxWidth).toBe(200);
    });

    it("yields full space to source and synthesis when chat is collapsed", () => {
      const bounds = resolveStudioPaneBounds(1000, false);
      expect(bounds.chatVisible).toBe(false);
      expect(bounds.chatWidth).toBe(0);
    });
  });

  describe("clampStudioChatPaneWidth", () => {
    it("clamps values outside allowed range", () => {
      expect(clampStudioChatPaneWidth(100, 1400)).toBe(STUDIO_CHAT_PANE_MIN_WIDTH);
      expect(clampStudioChatPaneWidth(9999, 1400)).toBe(STUDIO_CHAT_PANE_MAX_WIDTH);
      expect(clampStudioChatPaneWidth(Number.NaN, 1400)).toBe(STUDIO_CHAT_PANE_DEFAULT_WIDTH);
    });
  });

  describe("buildStepVerificationPrompt", () => {
    it("constructs Socratic step verification prompt with source file", () => {
      const prompt = buildStepVerificationPrompt("Step 1: dv/dt = -g - kv", "Lecture_02.pdf");
      expect(prompt).toContain("Lecture_02.pdf");
      expect(prompt).toContain("Step 1: dv/dt = -g - kv");
      expect(prompt).toContain("Tier 1 conceptual nudge");
      expect(prompt).toContain("Do not give away the solution");
    });
  });

  describe("formatSourceCitationPill", () => {
    it("formats citation with page/slide", () => {
      expect(formatSourceCitationPill("Lecture_04.pdf", 14)).toBe(
        "[Source: Lecture_04.pdf, p. 14]",
      );
    });

    it("formats citation without page", () => {
      expect(formatSourceCitationPill("Syllabus.pdf")).toBe("[Source: Syllabus.pdf]");
    });
  });
});
