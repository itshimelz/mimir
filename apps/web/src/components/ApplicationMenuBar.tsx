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
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "./ui/menubar";
import { toastManager } from "./ui/toast";
import { useOptionalSidebar } from "./ui/sidebar";

const MENU_TRIGGER_CLASS =
  "inline-flex h-7 items-center rounded-md px-2 text-ui-sm font-normal text-muted-foreground hover:text-foreground hover:bg-surface-secondary/80 aria-expanded:text-foreground aria-expanded:bg-surface-secondary/80 select-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-background-surface-under)] transition-colors duration-100 [-webkit-app-region:no-drag]";
const MENU_CONTENT_CLASS =
  "rounded-xl border border-[color:var(--color-border-light)] bg-[var(--color-background-surface-under)] text-[var(--color-text-foreground)] shadow-md before:hidden";

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
        "flex shrink-0 items-center gap-0.5 after:ms-2 after:h-4 after:w-px after:shrink-0 after:bg-[var(--app-surface-divider)] after:content-[''] select-none font-system-ui [-webkit-app-region:no-drag]",
        className,
      )}
    >
      <Menubar className="h-8 gap-0.5 rounded-none border-0 bg-transparent p-0">
        {/* File Menu */}
        <MenubarMenu>
          <MenubarTrigger className={MENU_TRIGGER_CLASS}>File</MenubarTrigger>
          <MenubarContent
            align="start"
            alignOffset={0}
            side="bottom"
            sideOffset={4}
            className={cn(MENU_CONTENT_CLASS, "min-w-48")}
          >
            <MenubarItem onClick={() => dispatchDesktopMenuAction("new-thread")}>
              <span>New Thread</span>
              <MenubarShortcut>{isMac ? "⌘N" : "Ctrl+N"}</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={handleNewWindow}>
              <span>New Window</span>
              <MenubarShortcut>{isMac ? "⇧⌘N" : "Ctrl+Shift+N"}</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={() => dispatchDesktopMenuAction("open-settings")}>
              <span>Settings...</span>
              <MenubarShortcut>{isMac ? "⌘," : "Ctrl+,"}</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={handleCloseWindow}>
              <span>Close Window</span>
              <MenubarShortcut>{isMac ? "⌘W" : "Alt+F4"}</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        {/* Edit Menu */}
        <MenubarMenu>
          <MenubarTrigger className={MENU_TRIGGER_CLASS}>Edit</MenubarTrigger>
          <MenubarContent
            align="start"
            alignOffset={0}
            side="bottom"
            sideOffset={4}
            className={cn(MENU_CONTENT_CLASS, "min-w-48")}
          >
            <MenubarItem onClick={handleUndo}>
              <span>Undo</span>
              <MenubarShortcut>{isMac ? "⌘Z" : "Ctrl+Z"}</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={handleRedo}>
              <span>Redo</span>
              <MenubarShortcut>{isMac ? "⇧⌘Z" : "Ctrl+Y"}</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={handleCut}>
              <span>Cut</span>
              <MenubarShortcut>{isMac ? "⌘X" : "Ctrl+X"}</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={handleCopy}>
              <span>Copy</span>
              <MenubarShortcut>{isMac ? "⌘C" : "Ctrl+C"}</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={handlePaste}>
              <span>Paste</span>
              <MenubarShortcut>{isMac ? "⌘V" : "Ctrl+V"}</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={handleSelectAll}>
              <span>Select All</span>
              <MenubarShortcut>{isMac ? "⌘A" : "Ctrl+A"}</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        {/* View Menu */}
        <MenubarMenu>
          <MenubarTrigger className={MENU_TRIGGER_CLASS}>View</MenubarTrigger>
          <MenubarContent
            align="start"
            alignOffset={0}
            side="bottom"
            sideOffset={4}
            className={cn(MENU_CONTENT_CLASS, "min-w-52")}
          >
            <MenubarItem onClick={() => dispatchDesktopMenuAction("toggle-sidebar")}>
              <span>Toggle Sidebar</span>
              <MenubarShortcut>{isMac ? "⌘B" : "Ctrl+B"}</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={() => dispatchDesktopMenuAction("toggle-browser")}>
              <span>Toggle Browser</span>
              <MenubarShortcut>{isMac ? "⇧⌘B" : "Ctrl+Shift+B"}</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={() => dispatchDesktopMenuAction("new-terminal-tab")}>
              <span>New Terminal Tab</span>
              <MenubarShortcut>{isMac ? "⇧⌘\\" : "Ctrl+Shift+\\"}</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={() => window.location.reload()}>
              <span>Reload</span>
              <MenubarShortcut>{isMac ? "⌘R" : "Ctrl+R"}</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={() => dispatchDesktopMenuAction("reset-zoom")}>
              <span>Actual Size</span>
              <MenubarShortcut>{isMac ? "⌘0" : "Ctrl+0"}</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={() => dispatchDesktopMenuAction("zoom-in")}>
              <span>Zoom In</span>
              <MenubarShortcut>{isMac ? "⌘=" : "Ctrl+="}</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={() => dispatchDesktopMenuAction("zoom-out")}>
              <span>Zoom Out</span>
              <MenubarShortcut>{isMac ? "⌘-" : "Ctrl+-"}</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        {/* Help Menu */}
        <MenubarMenu>
          <MenubarTrigger className={MENU_TRIGGER_CLASS}>Help</MenubarTrigger>
          <MenubarContent
            align="start"
            alignOffset={0}
            side="bottom"
            sideOffset={4}
            className={cn(MENU_CONTENT_CLASS, "min-w-48")}
          >
            <MenubarItem onClick={() => openExternalLink(MIMIR_DOCS_URL)}>
              <span>Documentation</span>
            </MenubarItem>
            <MenubarItem onClick={() => dispatchDesktopMenuAction("show-shortcuts")}>
              <span>Keyboard Shortcuts</span>
              <MenubarShortcut>{isMac ? "⌘/" : "Ctrl+/"}</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={() => useReleaseHistoryDialogStore.getState().openDialog()}>
              <span>What's New</span>
            </MenubarItem>
            <MenubarItem onClick={() => useFeedbackDialogStore.getState().openDialog()}>
              <span>Send Feedback</span>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={() => void handleCheckForUpdates()}>
              <span>Check for Updates...</span>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </nav>
  );
}
