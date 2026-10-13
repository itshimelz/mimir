// FILE: ApplicationMenuBar.tsx
// Purpose: ChatGPT-style inline application menu bar (File, Edit, View, Help) for the topbar chrome.
// Layer: App shell topbar
// Depends on: Base UI Menu primitives, desktop menu dispatcher, global stores

import { isElectron } from "~/env";
import { isMacNavigatorPlatform, cn } from "~/lib/utils";
import { dispatchDesktopMenuAction } from "~/lib/desktopMenuActions";
import { useReleaseHistoryDialogStore } from "~/releaseHistoryDialogStore";
import { useFeedbackDialogStore } from "~/feedbackDialogStore";
import { openExternalLink } from "~/lib/linkChips";
import { MIMIR_DOCS_URL } from "~/onboarding/tourContent";
import { Menu, MenuItem, MenuSeparator, MenuShortcut, MenuTrigger } from "./ui/menu";
import { ComposerPickerMenuPopup } from "./chat/ComposerPickerMenuPopup";
import { toastManager } from "./ui/toast";
import { useOptionalSidebar } from "./ui/sidebar";

const MENU_TRIGGER_CLASS =
  "inline-flex items-center px-1.5 py-0.5 rounded text-ui-xs font-normal text-muted-foreground/80 hover:text-foreground hover:bg-surface-secondary/80 select-none cursor-pointer outline-none transition-colors duration-75 [-webkit-app-region:no-drag]";

function handleCloseWindow(): void {
  if (window.desktopBridge?.windowControls?.close) {
    void window.desktopBridge.windowControls.close();
  } else {
    window.close();
  }
}

function handleNewWindow(): void {
  window.open(window.location.origin, "_blank");
}

function handleUndo(): void {
  document.execCommand("undo");
}

function handleRedo(): void {
  document.execCommand("redo");
}

function handleCut(): void {
  document.execCommand("cut");
}

function handleCopy(): void {
  document.execCommand("copy");
}

function handlePaste(): void {
  if (navigator.clipboard?.readText) {
    navigator.clipboard
      .readText()
      .then((text) => {
        if (text) {
          document.execCommand("insertText", false, text);
        }
      })
      .catch(() => {
        document.execCommand("paste");
      });
  } else {
    document.execCommand("paste");
  }
}

function handleSelectAll(): void {
  document.execCommand("selectAll");
}

async function handleCheckForUpdates(): Promise<void> {
  const bridge = window.desktopBridge;
  if (!bridge?.checkForUpdates) {
    toastManager.add({
      type: "info",
      title: "You're up to date",
      description: "You are running the latest web version of Mimir.",
    });
    return;
  }
  try {
    toastManager.add({
      type: "info",
      title: "Checking for updates...",
      description: "Checking Mimir update servers for new releases.",
    });
    const state = await bridge.checkForUpdates();
    if (state.status === "up-to-date") {
      toastManager.add({
        type: "info",
        title: "You're up to date",
        description: `Mimir ${state.currentVersion ?? ""} is already the newest version.`,
      });
    } else if (state.status === "available" || state.status === "downloading") {
      toastManager.add({
        type: "info",
        title: "Update available",
        description: `Version ${state.availableVersion ?? ""} is being prepared.`,
      });
    } else if (state.status === "downloaded") {
      toastManager.add({
        type: "success",
        title: "Update ready",
        description: "Restart Mimir to install the latest version.",
      });
    }
  } catch (error) {
    toastManager.add({
      type: "error",
      title: "Could not check for updates",
      description: error instanceof Error ? error.message : "An unexpected error occurred.",
    });
  }
}

export function ApplicationMenuBar({ className }: { className?: string }) {
  const sidebar = useOptionalSidebar();
  const isMobile = sidebar?.isMobile ?? false;
  const isMac = isMacNavigatorPlatform();

  // On macOS Electron, menus belong in the native macOS menu bar at the top of the monitor.
  if (isMobile || (isElectron && isMac)) {
    return null;
  }

  return (
    <nav
      aria-label="Application menu"
      className={cn(
        "flex shrink-0 items-center gap-0.5 select-none font-system-ui [-webkit-app-region:no-drag]",
        className,
      )}
    >
      {/* File Menu */}
      <Menu>
        <MenuTrigger className={MENU_TRIGGER_CLASS}>File</MenuTrigger>
        <ComposerPickerMenuPopup align="start" side="bottom" sideOffset={4} className="min-w-48">
          <MenuItem onClick={() => dispatchDesktopMenuAction("new-thread")}>
            <span>New Thread</span>
            <MenuShortcut>{isMac ? "⌘N" : "Ctrl+N"}</MenuShortcut>
          </MenuItem>
          <MenuItem onClick={handleNewWindow}>
            <span>New Window</span>
            <MenuShortcut>{isMac ? "⇧⌘N" : "Ctrl+Shift+N"}</MenuShortcut>
          </MenuItem>
          <MenuItem onClick={() => dispatchDesktopMenuAction("open-settings")}>
            <span>Settings...</span>
            <MenuShortcut>{isMac ? "⌘," : "Ctrl+,"}</MenuShortcut>
          </MenuItem>
          <MenuSeparator />
          <MenuItem onClick={handleCloseWindow}>
            <span>Close Window</span>
            <MenuShortcut>{isMac ? "⌘W" : "Alt+F4"}</MenuShortcut>
          </MenuItem>
        </ComposerPickerMenuPopup>
      </Menu>

      {/* Edit Menu */}
      <Menu>
        <MenuTrigger className={MENU_TRIGGER_CLASS}>Edit</MenuTrigger>
        <ComposerPickerMenuPopup align="start" side="bottom" sideOffset={4} className="min-w-48">
          <MenuItem onClick={handleUndo}>
            <span>Undo</span>
            <MenuShortcut>{isMac ? "⌘Z" : "Ctrl+Z"}</MenuShortcut>
          </MenuItem>
          <MenuItem onClick={handleRedo}>
            <span>Redo</span>
            <MenuShortcut>{isMac ? "⇧⌘Z" : "Ctrl+Y"}</MenuShortcut>
          </MenuItem>
          <MenuSeparator />
          <MenuItem onClick={handleCut}>
            <span>Cut</span>
            <MenuShortcut>{isMac ? "⌘X" : "Ctrl+X"}</MenuShortcut>
          </MenuItem>
          <MenuItem onClick={handleCopy}>
            <span>Copy</span>
            <MenuShortcut>{isMac ? "⌘C" : "Ctrl+C"}</MenuShortcut>
          </MenuItem>
          <MenuItem onClick={handlePaste}>
            <span>Paste</span>
            <MenuShortcut>{isMac ? "⌘V" : "Ctrl+V"}</MenuShortcut>
          </MenuItem>
          <MenuSeparator />
          <MenuItem onClick={handleSelectAll}>
            <span>Select All</span>
            <MenuShortcut>{isMac ? "⌘A" : "Ctrl+A"}</MenuShortcut>
          </MenuItem>
        </ComposerPickerMenuPopup>
      </Menu>

      {/* View Menu */}
      <Menu>
        <MenuTrigger className={MENU_TRIGGER_CLASS}>View</MenuTrigger>
        <ComposerPickerMenuPopup align="start" side="bottom" sideOffset={4} className="min-w-52">
          <MenuItem onClick={() => dispatchDesktopMenuAction("toggle-sidebar")}>
            <span>Toggle Sidebar</span>
            <MenuShortcut>{isMac ? "⌘B" : "Ctrl+B"}</MenuShortcut>
          </MenuItem>
          <MenuItem onClick={() => dispatchDesktopMenuAction("toggle-browser")}>
            <span>Toggle Browser</span>
            <MenuShortcut>{isMac ? "⇧⌘B" : "Ctrl+Shift+B"}</MenuShortcut>
          </MenuItem>
          <MenuItem onClick={() => dispatchDesktopMenuAction("new-terminal-tab")}>
            <span>New Terminal Tab</span>
            <MenuShortcut>{isMac ? "⇧⌘\\" : "Ctrl+Shift+\\"}</MenuShortcut>
          </MenuItem>
          <MenuSeparator />
          <MenuItem onClick={() => window.location.reload()}>
            <span>Reload</span>
            <MenuShortcut>{isMac ? "⌘R" : "Ctrl+R"}</MenuShortcut>
          </MenuItem>
          <MenuSeparator />
          <MenuItem onClick={() => dispatchDesktopMenuAction("reset-zoom")}>
            <span>Actual Size</span>
            <MenuShortcut>{isMac ? "⌘0" : "Ctrl+0"}</MenuShortcut>
          </MenuItem>
          <MenuItem onClick={() => dispatchDesktopMenuAction("zoom-in")}>
            <span>Zoom In</span>
            <MenuShortcut>{isMac ? "⌘=" : "Ctrl+="}</MenuShortcut>
          </MenuItem>
          <MenuItem onClick={() => dispatchDesktopMenuAction("zoom-out")}>
            <span>Zoom Out</span>
            <MenuShortcut>{isMac ? "⌘-" : "Ctrl+-"}</MenuShortcut>
          </MenuItem>
        </ComposerPickerMenuPopup>
      </Menu>

      {/* Help Menu */}
      <Menu>
        <MenuTrigger className={MENU_TRIGGER_CLASS}>Help</MenuTrigger>
        <ComposerPickerMenuPopup align="start" side="bottom" sideOffset={4} className="min-w-48">
          <MenuItem onClick={() => openExternalLink(MIMIR_DOCS_URL)}>
            <span>Documentation</span>
          </MenuItem>
          <MenuItem onClick={() => dispatchDesktopMenuAction("show-shortcuts")}>
            <span>Keyboard Shortcuts</span>
            <MenuShortcut>{isMac ? "⌘/" : "Ctrl+/"}</MenuShortcut>
          </MenuItem>
          <MenuItem onClick={() => useReleaseHistoryDialogStore.getState().openDialog()}>
            <span>What's New</span>
          </MenuItem>
          <MenuItem onClick={() => useFeedbackDialogStore.getState().openDialog()}>
            <span>Send Feedback</span>
          </MenuItem>
          <MenuSeparator />
          <MenuItem onClick={() => void handleCheckForUpdates()}>
            <span>Check for Updates...</span>
          </MenuItem>
        </ComposerPickerMenuPopup>
      </Menu>
    </nav>
  );
}
