"use client";
import { useSyncExternalStore } from "react";
import { MIconButton } from "@/components/m3e/icon-button";
import { MIcon } from "@/components/m3e/icon";

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
    <MIconButton type="button" onClick={toggle} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}>
      <MIcon name={isDark ? "light_mode" : "dark_mode"} size={20} />
    </MIconButton>
  );
}
