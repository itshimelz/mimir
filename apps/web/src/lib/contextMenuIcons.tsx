// FILE: contextMenuIcons.tsx
// Purpose: Icons for imperative context menus, matching the glyphs the same actions use in React UI.
// Layer: web UI utility
// Exports: THREAD_CONTEXT_MENU_ICONS
// Why: Native menus cannot render React components, so Central glyphs are passed by basename and
//      other icon sets are rendered to SVG markup from the same components the app shows.

import { renderToStaticMarkup } from "react-dom/server";

import {
  ArchiveIcon,
  BELL_ICON_NAME,
  ClockIcon,
  COPY_ICON_NAME,
  DeviceLaptopIcon,
  EYE_OPEN_ICON_NAME,
  FolderOpenIcon,
  GitBranchIcon,
  HandoffIcon,
  PENCIL_ICON_NAME,
  PIN_ICON_NAME,
  TERMINAL_ICON_NAME,
  Trash2,
  WorktreeIcon,
} from "./icons";

export const THREAD_CONTEXT_MENU_ICONS = {
  rename: PENCIL_ICON_NAME,
  pin: PIN_ICON_NAME,
  clearNotification: BELL_ICON_NAME,
  markUnread: EYE_OPEN_ICON_NAME,
  // Same glyph as the chat header's Hand off button.
  handoff: renderToStaticMarkup(<HandoffIcon />),
  // Fork shares the branch glyph (see GitForkIcon); its targets match the env-mode glyphs.
  fork: renderToStaticMarkup(<GitBranchIcon />),
  forkLocal: renderToStaticMarkup(<DeviceLaptopIcon />),
  forkWorktree: renderToStaticMarkup(<WorktreeIcon />),
  // Same glyph as the project rows' open folder.
  group: renderToStaticMarkup(<FolderOpenIcon />),
  // Same glyph as the composer's snooze notice.
  snooze: renderToStaticMarkup(<ClockIcon />),
  copy: COPY_ICON_NAME,
  openInTerminal: TERMINAL_ICON_NAME,
  // Same glyph as the thread row's hover archive button (both use ArchiveIcon).
  archive: renderToStaticMarkup(<ArchiveIcon />),
  // Same glyph as the delete rows in the sidebar project and space menus.
  delete: renderToStaticMarkup(<Trash2 />),
} as const;
