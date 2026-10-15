// FILE: courseWorkspaceStore.ts
// Purpose: Authoritative client store for the active single-course workspace
//          and per-course recent thread restoration in Mimir.
// Layer: State / UI store
// Backing: localStorage under "mimir:course-workspace:v1" (IDs only; zero transcripts or file contents).

import type { ProjectId, ThreadId } from "@synara/contracts";
import { create } from "zustand";

export const COURSE_WORKSPACE_STORAGE_KEY = "mimir:course-workspace:v1";

export interface PersistedCourseWorkspaceState {
  readonly activeCourseId: ProjectId | null;
  readonly recentThreadIdByCourse: Readonly<Record<ProjectId, ThreadId>>;
}

export interface CourseWorkspaceState extends PersistedCourseWorkspaceState {
  readonly setActiveCourseId: (courseId: ProjectId | null) => void;
  readonly setCourseRecentThreadId: (courseId: ProjectId, threadId: ThreadId) => void;
  readonly clearActiveCourse: () => void;
  readonly reconcile: (input: {
    readonly availableCourseIds: ReadonlySet<ProjectId>;
    readonly availableThreadIdsByCourse?: ReadonlyMap<ProjectId, ReadonlySet<ThreadId>>;
  }) => void;
}

export function readPersistedCourseWorkspaceState(
  storage?: Storage | null,
): PersistedCourseWorkspaceState {
  const defaultState: PersistedCourseWorkspaceState = {
    activeCourseId: null,
    recentThreadIdByCourse: {},
  };
  if (typeof window === "undefined" && !storage) {
    return defaultState;
  }
  const targetStorage = storage ?? (typeof window !== "undefined" ? window.localStorage : null);
  if (!targetStorage) {
    return defaultState;
  }
  try {
    const raw = targetStorage.getItem(COURSE_WORKSPACE_STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<PersistedCourseWorkspaceState> | null;
    if (!parsed || typeof parsed !== "object") return defaultState;

    const activeCourseId =
      typeof parsed.activeCourseId === "string" && parsed.activeCourseId.length > 0
        ? (parsed.activeCourseId as ProjectId)
        : null;

    const recentThreadIdByCourse: Record<ProjectId, ThreadId> = {};
    if (parsed.recentThreadIdByCourse && typeof parsed.recentThreadIdByCourse === "object") {
      for (const [courseId, threadId] of Object.entries(parsed.recentThreadIdByCourse)) {
        if (typeof courseId === "string" && typeof threadId === "string" && threadId.length > 0) {
          recentThreadIdByCourse[courseId as ProjectId] = threadId as ThreadId;
        }
      }
    }

    return {
      activeCourseId,
      recentThreadIdByCourse,
    };
  } catch {
    return defaultState;
  }
}

export function persistCourseWorkspaceState(
  state: PersistedCourseWorkspaceState,
  storage?: Storage | null,
): void {
  if (typeof window === "undefined" && !storage) return;
  const targetStorage = storage ?? (typeof window !== "undefined" ? window.localStorage : null);
  if (!targetStorage) return;
  try {
    targetStorage.setItem(
      COURSE_WORKSPACE_STORAGE_KEY,
      JSON.stringify({
        activeCourseId: state.activeCourseId,
        recentThreadIdByCourse: state.recentThreadIdByCourse,
      }),
    );
  } catch {
    // A blocked storage API or quota error must not break workspace interactions.
  }
}

export const useCourseWorkspaceStore = create<CourseWorkspaceState>((set, get) => ({
  ...readPersistedCourseWorkspaceState(),
  setActiveCourseId: (courseId) => {
    if (get().activeCourseId === courseId) return;
    set({ activeCourseId: courseId });
    persistCourseWorkspaceState(get());
  },
  setCourseRecentThreadId: (courseId, threadId) => {
    const currentRecent = get().recentThreadIdByCourse[courseId];
    if (currentRecent === threadId) return;
    set((state) => ({
      recentThreadIdByCourse: {
        ...state.recentThreadIdByCourse,
        [courseId]: threadId,
      },
    }));
    persistCourseWorkspaceState(get());
  },
  clearActiveCourse: () => {
    if (get().activeCourseId === null) return;
    set({ activeCourseId: null });
    persistCourseWorkspaceState(get());
  },
  reconcile: ({ availableCourseIds, availableThreadIdsByCourse }) => {
    const current = get();
    let changed = false;
    let nextActiveCourseId = current.activeCourseId;
    if (nextActiveCourseId !== null && !availableCourseIds.has(nextActiveCourseId)) {
      nextActiveCourseId = null;
      changed = true;
    }
    const nextRecent: Record<ProjectId, ThreadId> = {};
    for (const [courseId, threadId] of Object.entries(current.recentThreadIdByCourse)) {
      const pid = courseId as ProjectId;
      if (!availableCourseIds.has(pid)) {
        changed = true;
        continue;
      }
      if (availableThreadIdsByCourse) {
        const allowedThreads = availableThreadIdsByCourse.get(pid);
        if (allowedThreads && !allowedThreads.has(threadId)) {
          changed = true;
          continue;
        }
      }
      nextRecent[pid] = threadId;
    }
    if (
      changed ||
      Object.keys(nextRecent).length !== Object.keys(current.recentThreadIdByCourse).length
    ) {
      set({
        activeCourseId: nextActiveCourseId,
        recentThreadIdByCourse: nextRecent,
      });
      persistCourseWorkspaceState(get());
    }
  },
}));
