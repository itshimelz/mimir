// FILE: inputModality.ts
// Purpose: Tracks whether the user is driving with a pointer or the keyboard, so
//          focus rings can stay off during mouse work without weakening them for
//          keyboard navigation.
// Layer: Renderer bootstrap
// Exports: installInputModalityTracker

const MODALITY_ATTRIBUTE = "data-input-modality";

type InputModality = "pointer" | "keyboard";

/**
 * Maintains `<html data-input-modality>`. The stylesheet reads it to drop
 * `:focus-visible` ring colours on non-editable controls in pointer mode, which
 * is what stops a restored focus (Base UI handing focus back to a dialog
 * trigger on close, or a click inside a scroll pane) from painting a ring the
 * user never asked for.
 *
 * Modifier chords are ignored: `Cmd+K`, `Cmd+Shift+P` and friends are keyboard
 * intent, but treating the bare modifier as modality would flip the app to
 * pointer mode for a shortcut the user typed.
 */
export function installInputModalityTracker(): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  const root = document.documentElement;
  if (!root.hasAttribute(MODALITY_ATTRIBUTE)) {
    root.setAttribute(MODALITY_ATTRIBUTE, "pointer");
  }

  const set = (modality: InputModality) => {
    if (root.getAttribute(MODALITY_ATTRIBUTE) === modality) return;
    root.setAttribute(MODALITY_ATTRIBUTE, modality);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    set("keyboard");
  };

  const onPointerDown = () => {
    set("pointer");
  };

  window.addEventListener("keydown", onKeyDown, { capture: true });
  window.addEventListener("pointerdown", onPointerDown, { capture: true });

  return () => {
    window.removeEventListener("keydown", onKeyDown, { capture: true });
    window.removeEventListener("pointerdown", onPointerDown, { capture: true });
  };
}
