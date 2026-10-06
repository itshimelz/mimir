// FILE: Ripple.tsx
// Purpose: Material 3 press feedback — the `data-press` state and the ripple itself.
// Layer: Material 3 primitive
// Exports: Ripple
// Why: Ported from shadcn M3E (https://shadcn-m3e.crystaworld.dev), which ports
//      Material Web's <md-ripple> (Apache-2.0,
//      material-components/material-web ripple/internal/ripple.ts). Drop it inside
//      any interactive element: it marks that element `data-press` while pressed and
//      draws the ripple clipped to its corners. The parent needs `position: relative`
//      (the `.app-rail-item` class in index.css sets it) and the ripple takes
//      `currentColor`, or `--ripple-color`.

import * as React from "react";

import { cn } from "~/lib/utils";

/** Long enough that a quick click still shows the whole shape settle. */
const MINIMUM_PRESS_MS = 225;
const PRESS_GROW_MS = 450;
const INITIAL_ORIGIN_SCALE = 0.2;
const PADDING = 10;
const SOFT_EDGE_MINIMUM_SIZE = 75;
const SOFT_EDGE_CONTAINER_RATIO = 0.35;
/** A touch that becomes a scroll must not light anything up. */
const TOUCH_DELAY_MS = 150;
const EASING_STANDARD = "cubic-bezier(0.2, 0, 0, 1)";

type RippleProps = {
  /** Turn the ripple off; the pressed state is still tracked. */
  disabled?: boolean;
  className?: string;
};

function isDisabled(element: HTMLElement) {
  return (
    element.matches(":disabled") ||
    element.getAttribute("aria-disabled") === "true" ||
    element.hasAttribute("data-disabled")
  );
}

/** The control a ripple host belongs to. */
function controlOf(host: HTMLElement): HTMLElement | null {
  let element = host.parentElement;
  // A host inside a non-interactive part (an indicator layer, a switch handle): walk out
  // to the real control. The M3 rail nests the host in its indicator span.
  if (element && getComputedStyle(element).pointerEvents === "none") {
    element = element.parentElement?.closest<HTMLElement>("button, a, [role], label") ?? null;
  }
  return element;
}

/** Tracks the pressed state of `target` as `data-press`, held at least 225ms. */
function trackPress(target: HTMLElement) {
  let since = 0;
  let timer = 0;
  // The click a Space press produces on keyup is part of that press.
  let spaceClick = false;

  const down = () => {
    window.clearTimeout(timer);
    since = performance.now();
    target.setAttribute("data-press", "");
  };
  const release = () => target.removeAttribute("data-press");
  const up = () => {
    if (!since) return;
    const left = MINIMUM_PRESS_MS - (performance.now() - since);
    since = 0;
    if (left > 0) timer = window.setTimeout(release, left);
    else release();
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && event.button > 1) return;
    if (isDisabled(target)) return;
    down();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.target !== target || event.repeat || isDisabled(target)) return;
    if (event.key === " ") {
      spaceClick = true;
      down();
    }
  };
  const onKeyUp = (event: KeyboardEvent) => {
    if (event.key === " ") up();
  };
  // Enter (and other synthetic clicks) carry detail 0.
  const onClick = (event: MouseEvent) => {
    if (spaceClick) {
      spaceClick = false;
      return;
    }
    if (event.detail === 0 && !since && !isDisabled(target)) {
      down();
      up();
    }
  };

  target.addEventListener("pointerdown", onPointerDown);
  target.addEventListener("keydown", onKeyDown);
  target.addEventListener("keyup", onKeyUp);
  target.addEventListener("click", onClick);
  document.addEventListener("pointerup", up);
  document.addEventListener("pointercancel", up);
  return () => {
    window.clearTimeout(timer);
    target.removeAttribute("data-press");
    target.removeEventListener("pointerdown", onPointerDown);
    target.removeEventListener("keydown", onKeyDown);
    target.removeEventListener("keyup", onKeyUp);
    target.removeEventListener("click", onClick);
    document.removeEventListener("pointerup", up);
    document.removeEventListener("pointercancel", up);
  };
}

/** Material Web's ripple on `target`, drawn into `press`. */
function trackRipple(target: HTMLElement, host: HTMLElement, press: HTMLElement) {
  let grow: Animation | null = null;
  let touchTimer = 0;
  let pendingTouch: PointerEvent | null = null;

  const start = (event?: PointerEvent) => {
    const { width, height, left, top } = host.getBoundingClientRect();
    const maxDim = Math.max(width, height);
    const softEdge = Math.max(SOFT_EDGE_CONTAINER_RATIO * maxDim, SOFT_EDGE_MINIMUM_SIZE);
    const initial = Math.max(1, Math.floor(maxDim * INITIAL_ORIGIN_SCALE));
    const maxRadius = Math.hypot(width, height) + PADDING;
    const scale = (maxRadius + softEdge) / initial;
    const from = event
      ? { x: event.clientX - left - initial / 2, y: event.clientY - top - initial / 2 }
      : { x: (width - initial) / 2, y: (height - initial) / 2 };
    const to = { x: (width - initial) / 2, y: (height - initial) / 2 };

    grow?.cancel();
    press.style.width = press.style.height = `${initial}px`;
    press.setAttribute("data-pressed", "");
    grow = press.animate(
      {
        transform: [
          `translate(${from.x}px, ${from.y}px) scale(1)`,
          `translate(${to.x}px, ${to.y}px) scale(${scale})`,
        ],
      },
      { duration: PRESS_GROW_MS, easing: EASING_STANDARD, fill: "forwards" },
    );
  };

  const end = () => {
    const animation = grow;
    if (!animation) return;
    const played = Number(animation.currentTime ?? Infinity);
    const release = () => {
      if (grow === animation) press.removeAttribute("data-pressed");
    };
    if (played >= MINIMUM_PRESS_MS) release();
    else window.setTimeout(release, MINIMUM_PRESS_MS - played);
  };

  const cleanupUp = () => {
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerCancel);
  };
  const onPointerDown = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0 || isDisabled(target)) return;
    if (event.pointerType === "touch") {
      pendingTouch = event;
      touchTimer = window.setTimeout(() => {
        if (pendingTouch) start(pendingTouch);
        pendingTouch = null;
      }, TOUCH_DELAY_MS);
    } else {
      start(event);
    }
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
  };
  const onPointerUp = () => {
    cleanupUp();
    if (pendingTouch) {
      // A quick tap: show the ripple anyway.
      window.clearTimeout(touchTimer);
      start(pendingTouch);
      pendingTouch = null;
    }
    end();
  };
  const onPointerCancel = () => {
    cleanupUp();
    window.clearTimeout(touchTimer);
    pendingTouch = null;
    end();
  };
  const onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && grow) end();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.target === target && event.key === " " && !event.repeat && !isDisabled(target)) {
      start();
    }
  };
  const onKeyUp = (event: KeyboardEvent) => {
    if (event.key === " ") end();
  };
  const onClick = (event: MouseEvent) => {
    if (event.detail === 0 && !isDisabled(target) && !press.hasAttribute("data-pressed")) {
      start();
      end();
    }
  };

  // A control that becomes "current" (a nav item, a tab) has done its job: release the
  // ripple at once instead of trailing it over the new state. Mimir's rail marks the
  // active item with `data-active`.
  const settle = new MutationObserver(() => {
    if (!grow || !press.hasAttribute("data-pressed")) return;
    if (!target.hasAttribute("data-active") && !target.hasAttribute("aria-current")) {
      return;
    }
    press.style.transitionDuration = "90ms";
    press.removeAttribute("data-pressed");
    window.setTimeout(() => press.style.removeProperty("transition-duration"), 120);
  });
  settle.observe(target, {
    attributes: true,
    attributeFilter: ["data-active", "aria-current"],
  });

  target.addEventListener("pointerdown", onPointerDown);
  target.addEventListener("pointerleave", onPointerLeave);
  target.addEventListener("keydown", onKeyDown);
  target.addEventListener("keyup", onKeyUp);
  target.addEventListener("click", onClick);
  return () => {
    settle.disconnect();
    cleanupUp();
    window.clearTimeout(touchTimer);
    target.removeEventListener("pointerdown", onPointerDown);
    target.removeEventListener("pointerleave", onPointerLeave);
    target.removeEventListener("keydown", onKeyDown);
    target.removeEventListener("keyup", onKeyUp);
    target.removeEventListener("click", onClick);
    grow?.cancel();
  };
}

export function Ripple({ disabled, className }: RippleProps) {
  const hostRef = React.useRef<HTMLSpanElement>(null);
  const pressRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const host = hostRef.current;
    const target = host && controlOf(host);
    if (!target) return undefined;
    return trackPress(target);
  }, []);

  React.useEffect(() => {
    const host = hostRef.current;
    const press = pressRef.current;
    const target = host && controlOf(host);
    if (!host || !press || !target || disabled) return undefined;
    return trackRipple(target, host, press);
  }, [disabled]);

  return (
    <span ref={hostRef} aria-hidden data-slot="ripple" className={cn("m3-ripple-host", className)}>
      <span ref={pressRef} className="m3-ripple" />
    </span>
  );
}

export { trackPress };
