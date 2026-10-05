// FILE: m3e/ripple.tsx — press ripple (M3E behavior, reduced-motion aware).
"use client";
import { useCallback, useRef } from "react";

export function Ripple({ disabled }: { disabled?: boolean }) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const host = hostRef.current;
      if (!host) return;
      const rect = host.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2.2;
      const el = document.createElement("span");
      el.className = "m3-ripple";
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.left = `${e.clientX - rect.left - size / 2}px`;
      el.style.top = `${e.clientY - rect.top - size / 2}px`;
      host.appendChild(el);
      requestAnimationFrame(() => el.setAttribute("data-pressed", ""));
      const release = () => {
        el.removeAttribute("data-pressed");
        window.setTimeout(() => el.remove(), 420);
        window.removeEventListener("pointerup", release);
        window.removeEventListener("pointercancel", release);
      };
      window.addEventListener("pointerup", release);
      window.addEventListener("pointercancel", release);
    },
    [disabled],
  );
  return (
    <span ref={hostRef} data-slot="ripple" aria-hidden className="m3-ripple-host" onPointerDown={onPointerDown} />
  );
}
