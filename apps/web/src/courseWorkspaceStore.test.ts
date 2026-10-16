import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectId, ThreadId } from "@synara/contracts";

import {
  COURSE_WORKSPACE_STORAGE_KEY,
  persistCourseWorkspaceState,
  readPersistedCourseWorkspaceState,
  useCourseWorkspaceStore,
} from "./courseWorkspaceStore";

describe("courseWorkspaceStore", () => {
  let localStorageEntries: Map<string, string>;

  beforeEach(() => {
    localStorageEntries = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        clear: () => localStorageEntries.clear(),
        getItem: (key: string) => localStorageEntries.get(key) ?? null,
        setItem: (key: string, value: string) => localStorageEntries.set(key, value),
      },
    });
    useCourseWorkspaceStore.setState({
      activeCourseId: null,
      recentThreadIdByCourse: {},
      coursePickerRequested: false,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("readPersistedCourseWorkspaceState", () => {
    it("returns default state when storage is empty", () => {
      const state = readPersistedCourseWorkspaceState();
      expect(state).toEqual({
        activeCourseId: null,
        recentThreadIdByCourse: {},
      });
    });

    it("parses valid persisted state", () => {
      const courseId = ProjectId.makeUnsafe("course-cs101");
      const threadId = ThreadId.makeUnsafe("thread-intro");
      localStorageEntries.set(
        COURSE_WORKSPACE_STORAGE_KEY,
        JSON.stringify({
          activeCourseId: courseId,
          recentThreadIdByCourse: { [courseId]: threadId },
        }),
      );

      const state = readPersistedCourseWorkspaceState();
      expect(state.activeCourseId).toBe(courseId);
      expect(state.recentThreadIdByCourse[courseId]).toBe(threadId);
    });

    it("handles corrupted JSON gracefully without throwing", () => {
      localStorageEntries.set(COURSE_WORKSPACE_STORAGE_KEY, "invalid-json{{[");
      const state = readPersistedCourseWorkspaceState();
      expect(state).toEqual({
        activeCourseId: null,
        recentThreadIdByCourse: {},
      });
    });

    it("sanitizes invalid or malformed data shapes", () => {
      localStorageEntries.set(
        COURSE_WORKSPACE_STORAGE_KEY,
        JSON.stringify({
          activeCourseId: 12345, // Not a string
          recentThreadIdByCourse: "not-an-object",
        }),
      );
      const state = readPersistedCourseWorkspaceState();
      expect(state).toEqual({
        activeCourseId: null,
        recentThreadIdByCourse: {},
      });
    });
  });

  describe("persistCourseWorkspaceState", () => {
    it("persists active course and recent threads", () => {
      const courseId = ProjectId.makeUnsafe("course-math201");
      const threadId = ThreadId.makeUnsafe("thread-calculus");
      persistCourseWorkspaceState({
        activeCourseId: courseId,
        recentThreadIdByCourse: { [courseId]: threadId },
      });

      const raw = localStorageEntries.get(COURSE_WORKSPACE_STORAGE_KEY);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.activeCourseId).toBe(courseId);
      expect(parsed.recentThreadIdByCourse[courseId]).toBe(threadId);
    });
  });

  describe("useCourseWorkspaceStore actions", () => {
    it("updates active course and persists to localStorage", () => {
      const courseId = ProjectId.makeUnsafe("course-history");
      useCourseWorkspaceStore.getState().setActiveCourseId(courseId);

      expect(useCourseWorkspaceStore.getState().activeCourseId).toBe(courseId);
      const persisted = JSON.parse(localStorageEntries.get(COURSE_WORKSPACE_STORAGE_KEY)!);
      expect(persisted.activeCourseId).toBe(courseId);
    });

    it("records recent thread per course", () => {
      const courseA = ProjectId.makeUnsafe("course-a");
      const courseB = ProjectId.makeUnsafe("course-b");
      const threadA = ThreadId.makeUnsafe("thread-a");
      const threadB = ThreadId.makeUnsafe("thread-b");

      useCourseWorkspaceStore.getState().setCourseRecentThreadId(courseA, threadA);
      useCourseWorkspaceStore.getState().setCourseRecentThreadId(courseB, threadB);

      const state = useCourseWorkspaceStore.getState();
      expect(state.recentThreadIdByCourse[courseA]).toBe(threadA);
      expect(state.recentThreadIdByCourse[courseB]).toBe(threadB);
    });

    it("clears active course", () => {
      const courseId = ProjectId.makeUnsafe("course-physics");
      useCourseWorkspaceStore.getState().setActiveCourseId(courseId);
      expect(useCourseWorkspaceStore.getState().activeCourseId).toBe(courseId);

      useCourseWorkspaceStore.getState().clearActiveCourse();
      expect(useCourseWorkspaceStore.getState().activeCourseId).toBeNull();
    });

    it("stands the picker request down once a course is chosen", () => {
      const courseId = ProjectId.makeUnsafe("course-chemistry");
      useCourseWorkspaceStore.getState().setActiveCourseId(courseId);
      useCourseWorkspaceStore.getState().clearActiveCourse();
      // Switch Course asks for the picker, so the "/" landing must not reopen a course.
      expect(useCourseWorkspaceStore.getState().coursePickerRequested).toBe(true);

      useCourseWorkspaceStore.getState().setActiveCourseId(courseId);
      expect(useCourseWorkspaceStore.getState().activeCourseId).toBe(courseId);
      expect(useCourseWorkspaceStore.getState().coursePickerRequested).toBe(false);
    });

    it("keeps the picker request out of persisted state", () => {
      useCourseWorkspaceStore.getState().clearActiveCourse();
      const persisted = JSON.parse(localStorageEntries.get(COURSE_WORKSPACE_STORAGE_KEY)!);
      expect(persisted).not.toHaveProperty("coursePickerRequested");
    });

    it("reconciles removed courses and dead threads", () => {
      const courseLive = ProjectId.makeUnsafe("course-live");
      const courseDead = ProjectId.makeUnsafe("course-dead");
      const threadLive = ThreadId.makeUnsafe("thread-live");
      const threadDead = ThreadId.makeUnsafe("thread-dead");

      useCourseWorkspaceStore.getState().setActiveCourseId(courseDead);
      useCourseWorkspaceStore.getState().setCourseRecentThreadId(courseLive, threadDead);
      useCourseWorkspaceStore.getState().setCourseRecentThreadId(courseDead, threadLive);

      useCourseWorkspaceStore.getState().reconcile({
        availableCourseIds: new Set([courseLive]),
        availableThreadIdsByCourse: new Map([[courseLive, new Set([threadLive])]]),
      });

      const state = useCourseWorkspaceStore.getState();
      // Dead course cleared as active
      expect(state.activeCourseId).toBeNull();
      // Dead course removed from recents, and dead thread for live course pruned
      expect(state.recentThreadIdByCourse[courseDead]).toBeUndefined();
      expect(state.recentThreadIdByCourse[courseLive]).toBeUndefined();
    });
  });
});
