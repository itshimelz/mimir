import type { ThreadId } from "@synara/contracts";
import { useEffect, useEffectEvent } from "react";
import { subscribeDesktopMenuAction } from "~/lib/desktopMenuActions";

export function useBrowserPanelDesktopBridge(input: {
  onToggle: (() => void) | null;
  onOpen: ((threadId: ThreadId) => void) | null;
}) {
  const { onOpen, onToggle } = input;
  const handleToggle = useEffectEvent(() => onToggle?.());
  const handleOpen = useEffectEvent((threadId: ThreadId) => onOpen?.(threadId));
  const toggleEnabled = onToggle !== null;
  const openEnabled = onOpen !== null;

  useEffect(() => {
    if (!toggleEnabled) return;
    return subscribeDesktopMenuAction((action) => {
      if (action === "toggle-browser") {
        handleToggle();
      }
    });
  }, [toggleEnabled]);

  useEffect(() => {
    const onOpenBrowserPanelRequest = window.desktopBridge?.browser.onBrowserUseOpenPanelRequest;
    if (typeof onOpenBrowserPanelRequest !== "function" || !openEnabled) {
      return;
    }

    const unsubscribe = onOpenBrowserPanelRequest(({ threadId }) => {
      handleOpen(threadId);
    });

    return () => {
      unsubscribe?.();
    };
  }, [openEnabled]);
}
