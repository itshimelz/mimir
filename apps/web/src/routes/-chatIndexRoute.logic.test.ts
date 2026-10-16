import { describe, expect, it } from "vitest";
import { ProjectId, ThreadId } from "@synara/contracts";

import {
  resolveChatIndexLaunchCourseId,
  resolveChatIndexRestoreRoute,
} from "./-chatIndexRoute.logic";

describe("resolveChatIndexRestoreRoute", () => {
  const courseA = ProjectId.makeUnsafe("project-course-a");
  const courseB = ProjectId.makeUnsafe("project-course-b");
  const groupProject = ProjectId.makeUnsafe("project-group");

  const threadA1 = ThreadId.makeUnsafe("thread-a1");
  const threadA2 = ThreadId.makeUnsafe("thread-a2");
  const threadB1 = ThreadId.makeUnsafe("thread-b1");
  const draftA = ThreadId.makeUnsafe("draft-a");
  const draftB = ThreadId.makeUnsafe("draft-b");

  const sidebarThreadSummaryById = {
    [threadA1]: { projectId: courseA },
    [threadA2]: { projectId: courseA },
    [threadB1]: { projectId: courseB },
  };

  const baseInput = {
    availableSplitViewIds: new Set<string>(),
    threadIds: [threadA1, threadA2, threadB1],
    sidebarThreadSummaryById,
    groupProjectIds: new Set([groupProject]),
    draftProjectIdByThreadId: new Map<string, ProjectId>([
      [draftA, courseA],
      [draftB, courseB],
    ]),
    rememberedSplitViewThreadIds: undefined,
    landingSpace: null,
  };

  describe("without course filter (unscoped)", () => {
    it("restores valid thread from lastThreadRoute", () => {
      const result = resolveChatIndexRestoreRoute({
        ...baseInput,
        lastThreadRoute: { threadId: threadA1 },
      });
      expect(result).toEqual({ threadId: threadA1 });
    });

    it("restores valid draft from lastThreadRoute", () => {
      const result = resolveChatIndexRestoreRoute({
        ...baseInput,
        lastThreadRoute: { threadId: draftB },
      });
      expect(result).toEqual({ threadId: draftB });
    });

    it("returns null if thread is unknown", () => {
      const result = resolveChatIndexRestoreRoute({
        ...baseInput,
        lastThreadRoute: { threadId: ThreadId.makeUnsafe("nonexistent") },
      });
      expect(result).toBeNull();
    });
  });

  describe("with selectedCourseId (course-scoped)", () => {
    it("restores thread belonging to the selected course", () => {
      const result = resolveChatIndexRestoreRoute({
        ...baseInput,
        selectedCourseId: courseA,
        lastThreadRoute: { threadId: threadA1 },
      });
      expect(result).toEqual({ threadId: threadA1 });
    });

    it("rejects thread belonging to another course even if in lastThreadRoute", () => {
      const result = resolveChatIndexRestoreRoute({
        ...baseInput,
        selectedCourseId: courseA,
        lastThreadRoute: { threadId: threadB1 },
      });
      // Thread B belongs to Course B, so restoring into Course A must fail closed
      expect(result).toBeNull();
    });

    it("falls back to courseRecentThreadRoute when lastThreadRoute is from another course", () => {
      const result = resolveChatIndexRestoreRoute({
        ...baseInput,
        selectedCourseId: courseA,
        lastThreadRoute: { threadId: threadB1 },
        courseRecentThreadRoute: { threadId: threadA2 },
      });
      // Thread B is rejected, but course recent thread A2 is restored
      expect(result).toEqual({ threadId: threadA2 });
    });

    it("falls back to courseRecentThreadRoute when lastThreadRoute is null", () => {
      const result = resolveChatIndexRestoreRoute({
        ...baseInput,
        selectedCourseId: courseA,
        lastThreadRoute: null,
        courseRecentThreadRoute: { threadId: threadA1 },
      });
      expect(result).toEqual({ threadId: threadA1 });
    });

    it("returns null when courseRecentThreadRoute was deleted and lastThreadRoute is invalid", () => {
      const deletedThread = ThreadId.makeUnsafe("thread-deleted");
      const result = resolveChatIndexRestoreRoute({
        ...baseInput,
        selectedCourseId: courseA,
        lastThreadRoute: { threadId: threadB1 },
        courseRecentThreadRoute: { threadId: deletedThread },
      });
      expect(result).toBeNull();
    });

    it("restores unsent draft if it belongs to the selected course", () => {
      const result = resolveChatIndexRestoreRoute({
        ...baseInput,
        selectedCourseId: courseA,
        lastThreadRoute: { threadId: draftA },
      });
      expect(result).toEqual({ threadId: draftA });
    });

    it("rejects unsent draft from another course", () => {
      const result = resolveChatIndexRestoreRoute({
        ...baseInput,
        selectedCourseId: courseA,
        lastThreadRoute: { threadId: draftB },
      });
      expect(result).toBeNull();
    });
  });
});

describe("resolveChatIndexLaunchCourseId", () => {
  const courseA = ProjectId.makeUnsafe("project-course-a");
  const courseB = ProjectId.makeUnsafe("project-course-b");
  const courseC = ProjectId.makeUnsafe("project-course-c");

  it("opens the most recently updated course", () => {
    expect(
      resolveChatIndexLaunchCourseId([
        {
          id: courseA,
          createdAt: "2026-10-01T09:00:00.000Z",
          updatedAt: "2026-10-02T09:00:00.000Z",
        },
        {
          id: courseB,
          createdAt: "2026-10-03T09:00:00.000Z",
          updatedAt: "2026-10-04T09:00:00.000Z",
        },
      ]),
    ).toBe(courseB);
  });

  it("falls back to creation time for a course the snapshot never updated", () => {
    expect(
      resolveChatIndexLaunchCourseId([
        { id: courseA, createdAt: "2026-10-05T09:00:00.000Z", updatedAt: undefined },
        {
          id: courseB,
          createdAt: "2026-10-01T09:00:00.000Z",
          updatedAt: "2026-10-02T09:00:00.000Z",
        },
      ]),
    ).toBe(courseA);
  });

  it("keeps the snapshot's order when no course carries a timestamp", () => {
    expect(resolveChatIndexLaunchCourseId([{ id: courseC }, { id: courseA }])).toBe(courseC);
  });

  it("keeps the snapshot's order between courses of the same recency", () => {
    const updatedAt = "2026-10-04T09:00:00.000Z";
    expect(
      resolveChatIndexLaunchCourseId([
        { id: courseB, updatedAt },
        { id: courseA, updatedAt },
      ]),
    ).toBe(courseB);
  });

  it("has nothing to open without a course", () => {
    expect(resolveChatIndexLaunchCourseId([])).toBeNull();
  });
});
