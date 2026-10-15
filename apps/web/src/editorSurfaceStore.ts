// FILE: editorSurfaceStore.ts
// Purpose: Shared store for the active editor surface (Study vs Studio) and the selected studio artifact.

import { create } from "zustand";
import type { EditorSurface } from "~/lib/editorCenterMode";

export const EDITOR_SURFACE_STORAGE_KEY = "synara.editor.surface";

function readStoredEditorSurface(): EditorSurface {
  if (typeof window === "undefined") {
    return "study";
  }
  try {
    return window.localStorage.getItem(EDITOR_SURFACE_STORAGE_KEY) === "studio"
      ? "studio"
      : "study";
  } catch {
    return "study";
  }
}

interface EditorSurfaceState {
  surface: EditorSurface;
  setSurface: (surface: EditorSurface) => void;
  selectedStudioOutputPath: string | null;
  setSelectedStudioOutputPath: (path: string | null) => void;
}

export const useEditorSurfaceStore = create<EditorSurfaceState>((set) => ({
  surface: readStoredEditorSurface(),
  setSurface: (surface) => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(EDITOR_SURFACE_STORAGE_KEY, surface);
      } catch {
        // Best-effort preference persistence only.
      }
    }
    set({ surface });
  },
  selectedStudioOutputPath: null,
  setSelectedStudioOutputPath: (selectedStudioOutputPath) => {
    set({ selectedStudioOutputPath });
  },
}));
