import {
  COMPOSER_PICKER_MENU_POPUP_BODY_CLASS_NAME,
  COMPOSER_PICKER_OPTION_RADIUS_CLASS_NAME,
} from "~/components/chat/composerPickerStyles";
import { composerPickerMenuShellClassName } from "~/components/chat/composerPickerSize";
import { observeNativeSurfaceOverlay } from "~/lib/nativeSurfaceOcclusion";
import { FLOATING_OVERLAY_SURFACE_CLASS_NAME } from "~/surfaceStyles";
import type { ContextMenuItem } from "@synara/contracts";
import { createCentralIconElement } from "./lib/central-icons";
import { isInlineSvgMenuIcon } from "./lib/nativeMenuIcons";

/**
 * Browser fallback for native context menus, styled with the app's shared semantic surface,
 * composer picker tokens, and text tokens matching the top bar menu.
 */

const DEFAULT_HIGHLIGHT_CLASS_NAMES = ["bg-primary/10", "text-primary"] as const;
const SUBMENU_OPEN_HIGHLIGHT_CLASS_NAMES = ["bg-primary/12", "text-primary"] as const;
const DESTRUCTIVE_HIGHLIGHT_CLASS_NAMES = ["bg-destructive/10"] as const;

/** Same shell every other menu uses: hairline outline, theme popup surface, and composer picker tokens. */
const MENU_CLASS_NAME = `${FLOATING_OVERLAY_SURFACE_CLASS_NAME} fixed z-[10000] min-w-48 overflow-hidden app-elevated-prominent bg-popover text-popover-foreground rounded-xl before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] ${composerPickerMenuShellClassName("normal")} outline-none focus:outline-none transition-[opacity,scale] duration-[120ms] ease-out animate-in fade-in zoom-in-95`;
const VIEWPORT_MARGIN = 4;

function createMenuIconElement(icon: string): HTMLElement | null {
  if (!isInlineSvgMenuIcon(icon)) return createCentralIconElement(icon, "size-3.5 opacity-80");
  const wrapper = document.createElement("span");
  wrapper.className =
    "flex size-3.5 shrink-0 items-center justify-center opacity-80 [&>svg]:size-3.5";
  wrapper.innerHTML = icon;
  return wrapper;
}

/** Small overlap so the pointer never crosses a gap between a row and its submenu. */
const SUBMENU_OVERLAP = 4;
/**
 * Grace period before hovering a sibling row replaces an open submenu, so a diagonal
 * move from the parent row into its submenu can cross other rows without closing it.
 */
const SUBMENU_SWITCH_DELAY_MS = 150;

interface MenuLevel<T extends string> {
  readonly element: HTMLDivElement;
  readonly unobserve?: (() => void) | undefined;
  readonly items: readonly ContextMenuItem<T>[];
  readonly buttons: HTMLButtonElement[];
  focusedIndex: number;
  /** Index of the row whose submenu is the next level in the stack, or -1. */
  openChildIndex: number;
}

/**
 * Imperative DOM-based context menu that matches the app's Base UI menu styling.
 * Shows a positioned dropdown and returns a promise that resolves
 * with the clicked item id, or null if dismissed. Rows with `children` open a
 * flyout submenu on hover or ArrowRight, mirroring the native desktop menu.
 */
export function showContextMenuFallback<T extends string>(
  items: readonly ContextMenuItem<T>[],
  position?: { x: number; y: number },
): Promise<T | null> {
  return new Promise<T | null>((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;z-index:9999";

    // Stack of open menus: the root first, then each open submenu.
    const levels: MenuLevel<T>[] = [];

    let pendingSwitch: number | undefined;

    function cancelPendingSwitch() {
      window.clearTimeout(pendingSwitch);
      pendingSwitch = undefined;
    }

    function cleanup(result: T | null) {
      cancelPendingSwitch();
      document.removeEventListener("keydown", onKeyDown);
      overlay.remove();
      for (const level of levels) {
        level.unobserve?.();
        level.element.remove();
      }
      resolve(result);
    }

    function highlightItem(level: MenuLevel<T>, index: number, isSubmenuOpen: boolean = false) {
      const btn = level.buttons[index];
      const item = level.items[index];
      if (!btn || !item) return;
      const isDestructive = item.destructive === true || item.id === "delete";

      unhighlightItem(level, index);
      btn.dataset.highlighted = "";
      if (isSubmenuOpen) {
        btn.dataset.popupOpen = "";
        btn.classList.remove("text-foreground");
        btn.classList.add(...SUBMENU_OPEN_HIGHLIGHT_CLASS_NAMES);
      } else if (isDestructive) {
        btn.classList.add(...DESTRUCTIVE_HIGHLIGHT_CLASS_NAMES);
      } else {
        btn.classList.remove("text-foreground");
        btn.classList.add(...DEFAULT_HIGHLIGHT_CLASS_NAMES);
      }
    }

    function unhighlightItem(level: MenuLevel<T>, index: number) {
      const btn = level.buttons[index];
      const item = level.items[index];
      if (!btn || !item) return;
      const isDestructive = item.destructive === true || item.id === "delete";

      delete btn.dataset.highlighted;
      delete btn.dataset.popupOpen;

      btn.classList.remove(
        ...DEFAULT_HIGHLIGHT_CLASS_NAMES,
        ...SUBMENU_OPEN_HIGHLIGHT_CLASS_NAMES,
        ...DESTRUCTIVE_HIGHLIGHT_CLASS_NAMES,
      );
      if (!isDestructive) {
        btn.classList.add("text-foreground");
      }
    }

    function closeLevelsAfter(depth: number) {
      while (levels.length > depth + 1) {
        const popped = levels.pop()!;
        popped.unobserve?.();
        popped.element.remove();
      }
      const level = levels[depth];
      if (!level) return;
      if (level.openChildIndex !== -1 && level.openChildIndex !== level.focusedIndex) {
        unhighlightItem(level, level.openChildIndex);
      }
      level.openChildIndex = -1;
    }

    function focusItem(depth: number, index: number) {
      const level = levels[depth];
      if (!level || index < 0 || index >= level.buttons.length) return;
      if (level.focusedIndex !== -1 && level.focusedIndex !== level.openChildIndex) {
        unhighlightItem(level, level.focusedIndex);
      }
      level.focusedIndex = index;
      highlightItem(level, index, level.openChildIndex === index);
      level.buttons[index]?.focus();
    }

    function openSubmenu(depth: number, index: number, focusFirst: boolean) {
      const level = levels[depth];
      const children = level?.items[index]?.children;
      const anchor = level?.buttons[index];
      if (!level || !children || children.length === 0 || !anchor) return;
      if (level.openChildIndex !== index) {
        closeLevelsAfter(depth);
        level.openChildIndex = index;
        highlightItem(level, index, true);
        const rect = anchor.getBoundingClientRect();
        openLevel(children, { x: rect.right - SUBMENU_OVERLAP, y: rect.top - 4 }, rect);
      }
      if (focusFirst) focusItem(depth + 1, 0);
    }

    function activate(depth: number, index: number) {
      const item = levels[depth]?.items[index];
      if (!item) return;
      if (item.children) {
        openSubmenu(depth, index, true);
        return;
      }
      cleanup(item.id);
    }

    function onKeyDown(e: KeyboardEvent) {
      cancelPendingSwitch();
      // A hovered flyout can be visible while keyboard focus is still on its
      // parent or a sibling. Route keys to that focused menu, not the flyout.
      const focusedDepth = levels.findIndex((level) =>
        level.buttons.some((button) => button === document.activeElement),
      );
      const depth = focusedDepth === -1 ? levels.length - 1 : focusedDepth;
      const level = levels[depth];
      if (!level) return;
      if (level.focusedIndex !== level.openChildIndex) closeLevelsAfter(depth);
      const count = level.buttons.length;
      if (e.key === "Escape") {
        e.preventDefault();
        cleanup(null);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        closeLevelsAfter(depth);
        focusItem(depth, level.focusedIndex < count - 1 ? level.focusedIndex + 1 : 0);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        closeLevelsAfter(depth);
        focusItem(depth, level.focusedIndex > 0 ? level.focusedIndex - 1 : count - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        openSubmenu(depth, level.focusedIndex, true);
      } else if (e.key === "ArrowLeft") {
        if (depth === 0) return;
        e.preventDefault();
        const parentIndex = levels[depth - 1]!.openChildIndex;
        closeLevelsAfter(depth - 1);
        focusItem(depth - 1, parentIndex);
      } else if (e.key === "Enter") {
        e.preventDefault();
        activate(depth, level.focusedIndex);
      }
    }

    /** Appends one menu to the stack. `anchorRect` is the parent row for a submenu. */
    function openLevel(
      levelItems: readonly ContextMenuItem<T>[],
      origin: { x: number; y: number },
      anchorRect?: DOMRect,
    ) {
      const depth = levels.length;
      const menu = document.createElement("div");
      menu.dataset.slot = depth === 0 ? "context-menu-popup" : "context-menu-sub-popup";
      menu.className = MENU_CLASS_NAME;
      menu.style.position = "fixed";
      menu.style.top = `${origin.y}px`;
      menu.style.left = `${origin.x}px`;
      const unobserve = observeNativeSurfaceOverlay(menu);

      const inner = document.createElement("div");
      inner.dataset.slot = "menu-popup-body";
      inner.dataset.pickerSize = "normal";
      // A submenu taller than the window (many providers or hubs) scrolls in place.
      inner.className = `${COMPOSER_PICKER_MENU_POPUP_BODY_CLASS_NAME} max-h-[calc(100vh-8px)] p-1`;
      menu.appendChild(inner);

      const level: MenuLevel<T> = {
        element: menu,
        unobserve,
        items: levelItems,
        buttons: [],
        focusedIndex: -1,
        openChildIndex: -1,
      };
      levels.push(level);
      // Reaching a submenu confirms the diagonal move toward it.
      menu.addEventListener("mouseenter", cancelPendingSwitch);

      for (let i = 0; i < levelItems.length; i++) {
        const item = levelItems[i]!;
        const isDestructive = item.destructive === true || item.id === "delete";

        // Keep explicit groups visible in the browser fallback; destructive items remain isolated by default.
        if ((item.separatorBefore === true || isDestructive) && i > 0) {
          const sep = document.createElement("div");
          sep.dataset.slot = "menu-separator";
          sep.className = "mx-2 my-1 h-px bg-border";
          inner.appendChild(sep);
        }

        const btn = document.createElement("button");
        btn.type = "button";
        btn.dataset.slot = item.children ? "menu-sub-trigger" : "menu-item";
        if (isDestructive) {
          btn.dataset.variant = "destructive";
        }
        btn.className = isDestructive
          ? `flex w-full min-h-7 cursor-default select-none items-center gap-2.5 ${COMPOSER_PICKER_OPTION_RADIUS_CLASS_NAME} px-2 py-1 text-left text-ui-sm text-destructive outline-none transition-colors duration-100 ease-out [&>svg,&>[data-slot=central-icon]]:-mx-0.5 [&>svg,&>[data-slot=central-icon]]:shrink-0 [&>svg,&>[data-slot=central-icon]]:pointer-events-none`
          : `flex w-full min-h-7 cursor-default select-none items-center gap-2.5 ${COMPOSER_PICKER_OPTION_RADIUS_CLASS_NAME} px-2 py-1 text-left text-ui-sm text-foreground outline-none transition-colors duration-100 ease-out [&>svg,&>[data-slot=central-icon]]:-mx-0.5 [&>svg,&>[data-slot=central-icon]]:shrink-0 [&>svg,&>[data-slot=central-icon]]:pointer-events-none`;

        const icon = item.icon ? createMenuIconElement(item.icon) : null;
        if (icon) {
          btn.appendChild(icon);
        }

        const label = document.createElement("span");
        label.className = "truncate";
        label.textContent = item.label;
        btn.appendChild(label);

        if (item.children) {
          btn.setAttribute("aria-haspopup", "menu");
          const chevron = createCentralIconElement("chevron-right", "ms-auto size-3.5 opacity-70");
          if (chevron) btn.appendChild(chevron);
        }

        btn.addEventListener("click", () => activate(depth, i));
        btn.addEventListener("mouseenter", () => {
          cancelPendingSwitch();
          focusItem(depth, i);
          const applyHover = () => {
            if (item.children) {
              openSubmenu(depth, i, false);
            } else {
              closeLevelsAfter(depth);
            }
          };
          const replacesOpenSubmenu = level.openChildIndex !== -1 && level.openChildIndex !== i;
          if (replacesOpenSubmenu) {
            pendingSwitch = window.setTimeout(applyHover, SUBMENU_SWITCH_DELAY_MS);
          } else {
            applyHover();
          }
        });
        btn.addEventListener("mouseleave", () => {
          // The row that owns the open submenu stays lit while the pointer is inside it.
          if (level.openChildIndex !== i) {
            unhighlightItem(level, i);
          } else {
            highlightItem(level, i, true);
          }
          if (level.focusedIndex === i) level.focusedIndex = -1;
        });
        level.buttons.push(btn);
        inner.appendChild(btn);
      }

      document.body.appendChild(menu);

      // Adjust if menu overflows viewport
      requestAnimationFrame(() => {
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
          // A submenu flips to the other side of its parent row instead of covering it.
          const flippedLeft = anchorRect
            ? anchorRect.left - rect.width + SUBMENU_OVERLAP
            : window.innerWidth - rect.width - VIEWPORT_MARGIN;
          menu.style.left = `${Math.max(VIEWPORT_MARGIN, flippedLeft)}px`;
        }
        if (rect.bottom > window.innerHeight) {
          menu.style.top = `${Math.max(VIEWPORT_MARGIN, window.innerHeight - rect.height - VIEWPORT_MARGIN)}px`;
        }
      });
    }

    overlay.addEventListener("mousedown", () => cleanup(null));
    overlay.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      cleanup(null);
    });
    document.addEventListener("keydown", onKeyDown);

    document.body.appendChild(overlay);
    openLevel(items, { x: position?.x ?? 0, y: position?.y ?? 0 });
  });
}
