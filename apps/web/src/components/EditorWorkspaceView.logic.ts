// FILE: EditorWorkspaceView.logic.ts
// Purpose: Pure width policy for the editor workspace's two panes — the center workspace and
//          the chat rail. Both panes have a floor and a ceiling; the ceiling on one is
//          yielded to the other so the row never opens a gap between them.
// Layer: Web UI logic

/** Below this the transcript and the file preview both stop being readable. */
export const EDITOR_CENTER_PANE_MIN_WIDTH = 320;
/** The center pane stops widening past this, handing the room to the chat rail. */
export const EDITOR_CENTER_PANE_MAX_WIDTH = 1600;
/** Narrow enough to be a peek at the chat; the rail's own toggle collapses it below this. */
export const EDITOR_CHAT_PANE_MIN_WIDTH = 280;
/**
 * The ceiling the user feels while dragging. It is a *preference*, not a hard stop: a row
 * wide enough to push the center past {@link EDITOR_CENTER_PANE_MAX_WIDTH} may widen the rail
 * further, because the alternative is a dead gap between the two panes.
 */
export const EDITOR_CHAT_PANE_MAX_WIDTH = 960;
export const EDITOR_CHAT_PANE_DEFAULT_WIDTH = 384;

export interface EditorPaneBounds {
  readonly centerMinWidth: number;
  readonly chatMinWidth: number;
  readonly chatMaxWidth: number;
}

/**
 * Resolves the rail's drag bounds for a row of `rowWidth` pixels.
 *
 * Both panes' floors always hold: the rail can never be dragged so wide that the center
 * drops under its own minimum, and the center's CSS floor holds it even while the rail is
 * collapsed. The center's ceiling is the softer of the two constraints — exceeding it is
 * what makes the rail yield room, so on an ultrawide row the rail's effective ceiling rises
 * past {@link EDITOR_CHAT_PANE_MAX_WIDTH} rather than leaving the center stranded at its max
 * with dead space beside it.
 */
export function resolveEditorPaneBounds(rowWidth: number): EditorPaneBounds {
  const chatMinWidth = EDITOR_CHAT_PANE_MIN_WIDTH;
  const centerMinWidth = EDITOR_CENTER_PANE_MIN_WIDTH;
  // An unmeasured row (<= 0) must not constrain anything: the rail restores its stored width
  // from an effect that runs before the ResizeObserver's first callback, and a degenerate row
  // would clamp the stored preference to the minimum and then persist that clamp, silently
  // destroying the user's width. The row's own CSS floors still hold in the meantime.
  if (!(rowWidth > 0)) {
    return { centerMinWidth, chatMinWidth, chatMaxWidth: Number.POSITIVE_INFINITY };
  }
  // A row narrower than both floors is a window too small to satisfy them; the center keeps
  // its floor (it is the content the student is reading) and the rail yields.
  const chatMaxWidth = Math.max(
    chatMinWidth,
    Math.min(
      Math.max(EDITOR_CHAT_PANE_MAX_WIDTH, rowWidth - EDITOR_CENTER_PANE_MAX_WIDTH),
      Math.max(chatMinWidth, rowWidth - centerMinWidth),
    ),
  );
  return { centerMinWidth, chatMinWidth, chatMaxWidth };
}

/** Clamps a rail width to its bounds, rounding so a drag cannot leave a fractional width. */
export function clampEditorChatPaneWidth(width: number, rowWidth?: number): number {
  if (!Number.isFinite(width)) {
    return Math.min(EDITOR_CHAT_PANE_DEFAULT_WIDTH, rowWidth ?? Number.POSITIVE_INFINITY);
  }
  const bounds = resolveEditorPaneBounds(rowWidth ?? Number.POSITIVE_INFINITY);
  return Math.round(Math.min(bounds.chatMaxWidth, Math.max(bounds.chatMinWidth, width)));
}

/**
 * Whether a drag may move the rail to `nextWidth`. Rejects widths that would starve the
 * center below its floor. A row too narrow for both floors keeps accepting down to the
 * rail's own minimum, so the drag stays responsive instead of sticking at a dead stop.
 */
export function shouldAcceptEditorChatPaneWidth(input: {
  readonly nextWidth: number;
  readonly rowWidth: number;
}): boolean {
  const bounds = resolveEditorPaneBounds(input.rowWidth);
  if (input.nextWidth < bounds.chatMinWidth) {
    return false;
  }
  // A row too narrow to satisfy both floors at once is a window too small for this layout;
  // enforcing the center's floor there would leave no legal width at all, so the rail keeps
  // its own bounds and the center takes the overflow (its CSS floor, and its own scroll).
  if (input.rowWidth < bounds.centerMinWidth + bounds.chatMinWidth) {
    return true;
  }
  return input.rowWidth - input.nextWidth >= bounds.centerMinWidth;
}
