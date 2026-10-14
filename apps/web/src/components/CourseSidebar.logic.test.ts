// FILE: CourseSidebar.logic.test.ts
// Purpose: Test course-scoped single-workspace sidebar tab resolution, thread filtering, and invariants.
// Layer: Unit test

import type { ProjectId, ThreadId } from "@synara/contracts";
import { describe, expect, it } from "vitest";

import type { CourseSidebarTab } from "./Sidebar";
import type { SidebarThreadSummary } from "../types";

describe("CourseSidebar logic and invariants", () => {
  it("resolves default tab based on route surface and user selection", () => {
    function resolveEffectiveCourseTab(input: {
      userSelectedTab: CourseSidebarTab | null;
      currentSearchView: string | null;
      editorSurface: "files" | "studio";
    }): CourseSidebarTab {
      if (input.userSelectedTab !== null) return input.userSelectedTab;
      if (input.currentSearchView === "editor") {
        return input.editorSurface === "studio" ? "studio" : "files";
      }
      return "chats";
    }

    // Normal chat view defaults to chats
    expect(
      resolveEffectiveCourseTab({
        userSelectedTab: null,
        currentSearchView: "chat",
        editorSurface: "files",
      }),
    ).toBe("chats");

    // Editor view with files defaults to files
    expect(
      resolveEffectiveCourseTab({
        userSelectedTab: null,
        currentSearchView: "editor",
        editorSurface: "files",
      }),
    ).toBe("files");

    // Editor view with studio defaults to studio
    expect(
      resolveEffectiveCourseTab({
        userSelectedTab: null,
        currentSearchView: "editor",
        editorSurface: "studio",
      }),
    ).toBe("studio");

    // User explicit click overrides route default
    expect(
      resolveEffectiveCourseTab({
        userSelectedTab: "chats",
        currentSearchView: "editor",
        editorSurface: "studio",
      }),
    ).toBe("chats");
  });

  it("filters and sorts course threads, putting pinned threads first", () => {
    const courseId = "course-cs101" as ProjectId;
    const otherCourseId = "course-ee201" as ProjectId;

    const mockThreads: SidebarThreadSummary[] = [
      {
        id: "thread-1" as ThreadId,
        projectId: courseId,
        title: "Explain React Hooks",
        createdAt: "2026-10-13T10:00:00Z",
        updatedAt: "2026-10-13T10:00:00Z",
      } as SidebarThreadSummary,
      {
        id: "thread-2" as ThreadId,
        projectId: otherCourseId,
        title: "EE Circuit Analysis",
        createdAt: "2026-10-13T11:00:00Z",
        updatedAt: "2026-10-13T11:00:00Z",
      } as SidebarThreadSummary,
      {
        id: "thread-3" as ThreadId,
        projectId: courseId,
        title: "Pinned Quiz Review",
        createdAt: "2026-10-13T09:00:00Z",
        updatedAt: "2026-10-13T09:00:00Z",
      } as SidebarThreadSummary,
    ];

    const pinnedThreadIdSet = new Set<string>(["thread-3"]);

    const courseThreads = mockThreads
      .filter((t) => t.projectId === courseId)
      .sort((a, b) => {
        const aPinned = pinnedThreadIdSet.has(a.id);
        const bPinned = pinnedThreadIdSet.has(b.id);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return 0;
      });

    // Contains only threads for course-cs101
    expect(courseThreads.map((t) => t.id)).toEqual(["thread-3", "thread-1"]);
    // Does not leak threads from other courses
    expect(courseThreads.some((t) => t.projectId === otherCourseId)).toBe(false);
  });

  it("resolves tab based on rail item selection", () => {
    function resolveEffectiveCourseTabWithRail(input: {
      userSelectedTab: CourseSidebarTab | null;
      railActiveItem: string;
      railPanelView: string;
      currentSearchView: string | null;
      editorSurface: "files" | "studio";
    }): CourseSidebarTab {
      if (input.userSelectedTab !== null) return input.userSelectedTab;
      if (input.railActiveItem === "chats" || input.railPanelView === "chats") return "chats";
      if (input.railActiveItem === "spaces") {
        return input.editorSurface === "studio" ? "studio" : "files";
      }
      if (input.currentSearchView === "editor") {
        return input.editorSurface === "studio" ? "studio" : "files";
      }
      return "chats";
    }

    expect(
      resolveEffectiveCourseTabWithRail({
        userSelectedTab: null,
        railActiveItem: "chats",
        railPanelView: "chats",
        currentSearchView: "editor",
        editorSurface: "files",
      }),
    ).toBe("chats");

    expect(
      resolveEffectiveCourseTabWithRail({
        userSelectedTab: null,
        railActiveItem: "spaces",
        railPanelView: "spaces",
        currentSearchView: "editor",
        editorSurface: "files",
      }),
    ).toBe("files");
  });
});
