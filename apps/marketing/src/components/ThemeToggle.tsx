// FILE: ThemeToggle.tsx
// Purpose: Light/dark switch as an M3E standard icon button.
"use client";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/m3e/button";
import { Icon } from "@/components/m3e/icon";

const THEME_KEY = "mimir-theme";
const THEME_CHANGE_EVENT = "mimir-theme-change";

function subscribeToThemeChanges(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
function getThemeSnapshot() {
  return document.documentElement.classList.contains("dark");
}
function getServerThemeSnapshot() {
  return false;
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribeToThemeChanges, getThemeSnapshot, getServerThemeSnapshot);
  function toggle() {
    const nextDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.setItem(THEME_KEY, nextDark ? "dark" : "light");
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Icon name={isDark ? "light_mode" : "dark_mode"} />
    </Button>
  );
}
