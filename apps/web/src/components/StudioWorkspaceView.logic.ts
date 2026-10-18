// FILE: StudioWorkspaceView.logic.ts
// Purpose: Pure width policy, pane bounds, and prompt utilities for the Tri-Pane Study Studio.
//          (Pane A: Source Reader, Pane B: Synthesis Canvas, Pane C: Socratic Companion).
// Layer: Web UI logic

export const STUDIO_SOURCE_PANE_MIN_WIDTH = 280;
export const STUDIO_SYNTHESIS_PANE_MIN_WIDTH = 280;
export const STUDIO_CHAT_PANE_MIN_WIDTH = 280;
export const STUDIO_CHAT_PANE_DEFAULT_WIDTH = 340;
export const STUDIO_CHAT_PANE_MAX_WIDTH = 520;

export interface StudioPaneBounds {
  readonly sourceMinWidth: number;
  readonly synthesisMinWidth: number;
  readonly chatMinWidth: number;
  readonly chatMaxWidth: number;
  readonly chatVisible: boolean;
  readonly chatWidth: number;
}

/**
 * Resolves the Tri-Pane bounds given the container width and chat visibility.
 */
export function resolveStudioPaneBounds(rowWidth: number, chatVisible: boolean): StudioPaneBounds {
  const sourceMinWidth = STUDIO_SOURCE_PANE_MIN_WIDTH;
  const synthesisMinWidth = STUDIO_SYNTHESIS_PANE_MIN_WIDTH;
  const chatMinWidth = STUDIO_CHAT_PANE_MIN_WIDTH;

  if (!chatVisible) {
    return {
      sourceMinWidth,
      synthesisMinWidth,
      chatMinWidth: 0,
      chatMaxWidth: 0,
      chatVisible: false,
      chatWidth: 0,
    };
  }

  if (!(rowWidth > 0)) {
    return {
      sourceMinWidth,
      synthesisMinWidth,
      chatMinWidth,
      chatMaxWidth: STUDIO_CHAT_PANE_MAX_WIDTH,
      chatVisible: true,
      chatWidth: STUDIO_CHAT_PANE_DEFAULT_WIDTH,
    };
  }

  const remainingForChat = Math.max(0, rowWidth - sourceMinWidth - synthesisMinWidth);
  const chatMaxWidth = Math.min(STUDIO_CHAT_PANE_MAX_WIDTH, remainingForChat);

  return {
    sourceMinWidth,
    synthesisMinWidth,
    chatMinWidth: Math.min(chatMinWidth, chatMaxWidth),
    chatMaxWidth,
    chatVisible: true,
    chatWidth: Math.min(STUDIO_CHAT_PANE_DEFAULT_WIDTH, Math.max(chatMinWidth, chatMaxWidth)),
  };
}

/**
 * Clamps chat pane width to valid bounds.
 */
export function clampStudioChatPaneWidth(width: number, rowWidth?: number): number {
  if (!Number.isFinite(width)) {
    return STUDIO_CHAT_PANE_DEFAULT_WIDTH;
  }
  const bounds = resolveStudioPaneBounds(rowWidth ?? Number.POSITIVE_INFINITY, true);
  return Math.round(Math.min(bounds.chatMaxWidth, Math.max(bounds.chatMinWidth, width)));
}

/**
 * Formats a Markdown source citation pill for living notes.
 */
export function formatSourceCitationPill(
  sourceFileName: string,
  pageOrSlide?: number | string,
): string {
  if (pageOrSlide !== undefined && pageOrSlide !== null && String(pageOrSlide).trim() !== "") {
    return `[Source: ${sourceFileName}, p. ${pageOrSlide}]`;
  }
  return `[Source: ${sourceFileName}]`;
}

/**
 * Builds the anti-spoiler step verification prompt for Socratic tutoring.
 */
export function buildStepVerificationPrompt(stepText: string, sourceFileName?: string): string {
  const sourceContext = sourceFileName
    ? ` against ${sourceFileName}`
    : " against our course materials";
  return `Verify my problem-solving steps line-by-line${sourceContext}. Do not give away the solution or future steps. If there is an error in my logic, math, or assumptions, diagnose where it went wrong and give me a Tier 1 conceptual nudge to guide my reasoning:\n\n${stepText.trim()}`;
}
