// FILE: EditorWorkspaceView.logic.ts
// Purpose: Pure width policy for the editor workspace's two panes — the center workspace and
//          the chat rail. The center pane flexes to fill available space; the chat rail has
//          a floor and ceiling to keep the chat legible without starving the center workspace.
// Layer: Web UI logic

/** Below this the transcript and the file preview both stop being readable. */
export const EDITOR_CENTER_PANE_MIN_WIDTH = 320;
/** The former center pane max-width ceiling; retained as an exported constant for compatibility. */
export const EDITOR_CENTER_PANE_MAX_WIDTH = 1600;
/** Narrow enough to be a peek at the chat; the rail's own toggle collapses it below this. */
export const EDITOR_CHAT_PANE_MIN_WIDTH = 280;
/**
 * The ceiling the user feels while dragging the chat rail. Clamped on narrow rows to keep
 * the center pane from being starved below {@link EDITOR_CENTER_PANE_MIN_WIDTH}.
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
 * collapsed. On a wide monitor, the rail stops at {@link EDITOR_CHAT_PANE_MAX_WIDTH} while
 * the center pane flexes to fill the rest of the window.
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
    Math.min(EDITOR_CHAT_PANE_MAX_WIDTH, Math.max(chatMinWidth, rowWidth - centerMinWidth)),
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
