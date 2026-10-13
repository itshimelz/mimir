// FILE: desktopMenuActions.ts
// Purpose: Unified bus for desktop & topbar application menu actions across Electron and web.
// Layer: Web shell utility
// Depends on: window.desktopBridge, DOM CustomEvent

type MenuActionListener = (action: string) => void;

const MENU_ACTION_EVENT = "mimir:menu-action";

const localListeners = new Set<MenuActionListener>();
let bridgeSubscribed = false;

function ensureBridgeSubscription() {
  if (bridgeSubscribed) return;
  if (typeof window === "undefined") return;
  const onMenuAction = window.desktopBridge?.onMenuAction;
  if (typeof onMenuAction === "function") {
    bridgeSubscribed = true;
    onMenuAction((action) => {
      dispatchLocalMenuAction(action);
    });
  }
}

function dispatchLocalMenuAction(action: string) {
  for (const listener of localListeners) {
    try {
      listener(action);
    } catch (error) {
      console.error("[desktopMenuActions] Listener failed for action:", action, error);
    }
  }
}

/**
 * Dispatches an application menu action to all registered listeners.
 * Used by the topbar inline menu bar and testing harnesses.
 */
export function dispatchDesktopMenuAction(action: string): void {
  dispatchLocalMenuAction(action);
}

/**
 * Subscribes to menu actions coming from either the Electron native menu bridge
 * or the in-app topbar application menu.
 * Returns an unsubscribe callback.
 */
export function subscribeDesktopMenuAction(listener: MenuActionListener): () => void {
  ensureBridgeSubscription();
  localListeners.add(listener);
  return () => {
    localListeners.delete(listener);
  };
}
