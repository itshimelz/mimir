// FILE: RouteSurface.tsx
// Purpose: The chrome full-width routes share (Tasks, Kanban, Inbox, Automations, PRs): the chat-style surface column
//          and its draggable top bar with the sidebar navigation controls, where the caller's
//          title, counts, and controls sit in one no-drag row.
// Layer: Route UI component
// Exports: RouteSurface, RouteSurfaceHeader

import type { ReactNode } from "react";

import { ApplicationMenuBar } from "./ApplicationMenuBar";
import { SidebarHeaderNavigationControls } from "~/components/SidebarHeaderNavigationControls";
import { useOptionalSidebar } from "./ui/sidebar";
import {
  useDesktopTopBarTrafficLightGutterClassName,
  useDesktopTopBarWindowControlsGutterClassName,
} from "~/hooks/useDesktopTopBarGutter";
import { cn } from "~/lib/utils";
import {
  CHAT_SURFACE_HEADER_DIVIDER_CLASS_NAME,
  CHAT_SURFACE_HEADER_HEIGHT_CLASS,
  CHAT_SURFACE_HEADER_PADDING_X_CLASS,
} from "./chat/chatHeaderControls";
import { CHAT_BACKGROUND_CLASS_NAME } from "./chat/composerPickerStyles";

/** The route's column: header on top, its content filling the rest. */
export function RouteSurface({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
        CHAT_BACKGROUND_CLASS_NAME,
      )}
    >
      {children}
    </div>
  );
}

/** Shared route top bar; each surface owns the layout of its controls. */
export function RouteSurfaceHeader({
  divider = true,
  windowControlsGutter = true,
  menuBar = true,
  className,
  rowClassName,
  children,
}: {
  /** The hairline under the bar; a page that opens onto cards leaves it off. */
  divider?: boolean;
  /** Off for a left column whose right neighbor already clears the window controls. */
  windowControlsGutter?: boolean;
  /** Show the topbar application menu bar (File, Edit, View, Help). */
  menuBar?: boolean;
  className?: string | undefined;
  rowClassName?: string | undefined;
  children?: ReactNode;
}) {
  const trafficLightGutterClassName =
    useDesktopTopBarTrafficLightGutterClassName();
  const windowControlsGutterClassName =
    useDesktopTopBarWindowControlsGutterClassName();
  const sidebar = useOptionalSidebar();
  const sidebarOpen = sidebar?.open ?? false;
  return (
    <header
      className={cn(
        divider && CHAT_SURFACE_HEADER_DIVIDER_CLASS_NAME,
        CHAT_SURFACE_HEADER_PADDING_X_CLASS,
        "app-top-bar drag-region",
        trafficLightGutterClassName,
        windowControlsGutter && windowControlsGutterClassName,
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 sm:gap-3",
          CHAT_SURFACE_HEADER_HEIGHT_CLASS,
          rowClassName,
        )}
      >
        <SidebarHeaderNavigationControls collapsedGapClassName="-me-2 sm:-me-3" />
        {menuBar && !sidebarOpen ? (
          <ApplicationMenuBar className="ms-1" />
        ) : null}
        {children}
      </div>
    </header>
  );
}
