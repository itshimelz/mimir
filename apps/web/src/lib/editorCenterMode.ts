export type EditorCenterMode = "file" | "diff" | "fileEdit" | "diffEdit";

export type EditorCenterModeFamily = "file" | "diff";

/**
 * The two product surfaces of the editor workspace.
 *
 * `study` is the course surface: the student explores, reads, and writes the course's own files.
 * `studio` is the agent surface: artifacts, lessons, and study material the agent produced.
 *
 * They share one workspace (the header project switcher) and one chat rail; only the left column
 * and the center swap. Chat is a persistent rail across both rather than a surface of its own, so
 * the conversation that produced an artifact stays reachable while reviewing it.
 */
export type EditorSurface = "study" | "studio";

export type EditorActivityBarItem = "file" | "diff" | "search";

export function editorCenterModeFamily(mode: EditorCenterMode): EditorCenterModeFamily {
  return mode === "diff" || mode === "diffEdit" ? "diff" : "file";
}

export interface EditorActivityBarSelection {
  item: EditorActivityBarItem;
  sidebarVisible: boolean;
  searchPaneActive: boolean;
  centerFamily: EditorCenterModeFamily;
}

/** True when the item already owns the visible sidebar, so selecting it hides the sidebar. */
export function isEditorActivityBarItemActive(selection: EditorActivityBarSelection): boolean {
  return (
    selection.sidebarVisible &&
    (selection.item === "search"
      ? selection.searchPaneActive
      : !selection.searchPaneActive && selection.centerFamily === selection.item)
  );
}

/**
 * Only a center-pane switch leaves an open editor. Hiding the sidebar or
 * opening search keeps the editor mounted, so those must not run the
 * discard flow that clears its dirty tracking.
 */
export function editorActivityBarSelectionLeavesEditor(
  selection: EditorActivityBarSelection,
): boolean {
  return !isEditorActivityBarItemActive(selection) && selection.item !== "search";
}
