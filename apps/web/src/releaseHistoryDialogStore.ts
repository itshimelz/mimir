// FILE: releaseHistoryDialogStore.ts
// Purpose: Owns the global Release History dialog state across app surfaces.
// Layer: Web UI state
// Depends on: Zustand

import { create } from "zustand";

interface ReleaseHistoryDialogStore {
  isOpen: boolean;
  version: string | null;
  openDialog: (version?: string | null) => void;
  setOpen: (open: boolean) => void;
}

export const useReleaseHistoryDialogStore = create<ReleaseHistoryDialogStore>((set) => ({
  isOpen: false,
  version: null,
  openDialog: (version = null) =>
    set({ isOpen: true, version: typeof version === "string" ? version : null }),
  setOpen: (open) => set(open ? { isOpen: true } : { isOpen: false, version: null }),
}));
