// FILE: _chat.index.tsx
// Purpose: Single-course workspace entry and restoration landing for Mimir.
//          Opens the most recent course on its Today view when no course is bound, binds "/"
//          to the active course, restores the course-scoped recent thread, or presents the
//          CourseWorkspaceHome / CoursePickerLanding.
// Layer: Routing

import { SpaceId, type ProjectId } from "@synara/contracts";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { CoursePickerLanding } from "../components/CoursePickerLanding";
import { CourseWorkspaceHome } from "../components/CourseWorkspaceHome";
import {
  RestoreOrCreateChatRoute,
  type RestoreRouteResolver,
} from "../components/RestoreOrCreateChatRoute";
import { useProjectAgentSummariesStore } from "../components/chat/project/useProjectAgentSummaries";
import { readSidebarUiState } from "../components/Sidebar.uiState";
import { SplashScreen } from "../components/SplashScreen";
import { useComposerDraftStore } from "../composerDraftStore";
import { useCourseWorkspaceStore } from "../courseWorkspaceStore";
import { useHandleNewThread } from "../hooks/useHandleNewThread";
import { collectGroupProjectIds } from "../lib/groupProjects";
import { VOID_SPACE_KEY } from "../lib/spaceGrouping";
import { resolveSplitViewThreadIds, useSplitViewStore } from "../splitViewStore";
import { EMPTY_THREAD_IDS, useStore } from "../store";
import { useWorkspacePathsStore } from "../workspacePathsStore";
import {
  resolveChatIndexLaunchCourseId,
  resolveChatIndexRestoreRoute,
  type ChatIndexLandingSpace,
} from "./-chatIndexRoute.logic";

export interface ChatIndexSearch {
  readonly space?: string | undefined;
  readonly view?: "editor" | undefined;
  readonly editorFilePath?: string | undefined;
  readonly home?: boolean | undefined;
}

function ChatIndexRouteView() {
  const navigate = useNavigate();
  const { handleNewThread, handleNewCourseStudyThread } = useHandleNewThread();
  const landingSpaceKey = Route.useSearch({ select: (search) => search.space });
  const searchHome = Route.useSearch({ select: (search) => search.home });
  const searchView = Route.useSearch({ select: (search) => search.view });
  const _searchEditorFilePath = Route.useSearch({ select: (search) => search.editorFilePath });

  const threadsHydrated = useStore((state) => state.threadsHydrated);
  const threadIds = useStore((state) => state.threadIds ?? EMPTY_THREAD_IDS);
  const projects = useStore((state) => state.projects);
  const summariesByProjectId = useProjectAgentSummariesStore((state) => state.summariesByProjectId);
  const sidebarThreadSummaryById = useStore((state) => state.sidebarThreadSummaryById);
  const draftThreadsByThreadId = useComposerDraftStore((state) => state.draftThreadsByThreadId);
  const homeDir = useWorkspacePathsStore((state) => state.homeDir);
  const chatWorkspaceRoot = useWorkspacePathsStore((state) => state.chatWorkspaceRoot);
  const studioWorkspaceRoot = useWorkspacePathsStore((state) => state.studioWorkspaceRoot);
  const groupsWorkspaceRoot = useWorkspacePathsStore((state) => state.groupsWorkspaceRoot);

  const activeCourseId = useCourseWorkspaceStore((state) => state.activeCourseId);
  const recentThreadIdByCourse = useCourseWorkspaceStore((state) => state.recentThreadIdByCourse);
  const clearActiveCourse = useCourseWorkspaceStore((state) => state.clearActiveCourse);
  const setActiveCourseId = useCourseWorkspaceStore((state) => state.setActiveCourseId);
  const coursePickerRequested = useCourseWorkspaceStore((state) => state.coursePickerRequested);

  // 1. The bound course is only usable while the snapshot still lists it: a course that was
  //    deleted, or a binding restored from an older profile, leaves nothing to show.
  const activeCourse = activeCourseId
    ? (projects.find((p) => p.id === activeCourseId) ?? null)
    : null;

  // 2. A launch with no course to show opens the most recent one, on its Today view, instead
  //    of the picker. A workspace with no courses at all — or a course the user just switched
  //    away from — still lands on the picker.
  const autoCourseId =
    activeCourse === null && !coursePickerRequested
      ? resolveChatIndexLaunchCourseId(projects)
      : null;
  // Latched for as long as this mount lives: binding the course must not hand the landing to
  // the restored-thread policy below on the next render. Coming back to "/" is a new mount, so
  // a later visit restores the remembered thread again.
  const [autoOpenedCourseHome, setAutoOpenedCourseHome] = useState(false);

  useEffect(() => {
    if (autoCourseId === null) return;
    setActiveCourseId(autoCourseId);
    setAutoOpenedCourseHome(true);
  }, [autoCourseId, setActiveCourseId]);

  // 3. If hydration has not completed yet, show the splash screen
  if (!threadsHydrated) {
    return <SplashScreen />;
  }

  // 4. The course this landing shows: the bound one, or the one this launch opened.
  const landingCourse =
    activeCourse ?? (autoCourseId ? (projects.find((p) => p.id === autoCourseId) ?? null) : null);

  // 5. If there is no course to open, show the course picker landing
  if (!landingCourse) {
    return (
      <CoursePickerLanding
        onCourseSelected={(courseId) => {
          setActiveCourseId(courseId);
        }}
      />
    );
  }

  const handleStartStudySession = async (initialPrompt?: string) => {
    await handleNewCourseStudyThread({ ...(initialPrompt ? { initialPrompt } : {}) });
  };

  const handleOpenEditor = () => {
    void navigate({
      to: "/editor",
      search: { view: "editor" },
    });
  };

  // 6. Today: asked for explicitly (?home=true), or the view this launch opened the course on.
  if (searchHome === true || autoOpenedCourseHome) {
    return (
      <CourseWorkspaceHome
        course={landingCourse}
        onStartStudySession={handleStartStudySession}
        onSwitchCourse={clearActiveCourse}
        onOpenEditor={handleOpenEditor}
      />
    );
  }

  // 7. Normal route landing: attempt to restore the course-scoped recent thread.
  //    If no thread exists in this course, fallback to CourseWorkspaceHome.
  const workspacePaths = { homeDir, chatWorkspaceRoot, studioWorkspaceRoot, groupsWorkspaceRoot };
  const groupProjectIds = collectGroupProjectIds(projects, workspacePaths);

  const draftProjectIdByThreadId = new Map<string, ProjectId>();
  for (const [threadId, draft] of Object.entries(draftThreadsByThreadId)) {
    if (draft.entryPoint === "chat" && draft.promotedTo === undefined) {
      draftProjectIdByThreadId.set(threadId, draft.projectId);
    }
  }

  const landingSpace: ChatIndexLandingSpace | null =
    landingSpaceKey === undefined
      ? null
      : {
          spaceId: landingSpaceKey === VOID_SPACE_KEY ? null : SpaceId.makeUnsafe(landingSpaceKey),
          projectById: new Map(projects.map((project) => [project.id, project])),
          workspacePaths,
        };

  const courseRecentThreadId = recentThreadIdByCourse[landingCourse.id];
  const courseRecentThreadRoute = courseRecentThreadId ? { threadId: courseRecentThreadId } : null;

  const resolveRestoreRoute: RestoreRouteResolver = ({ availableSplitViewIds }) => {
    const lastThreadRoute = readSidebarUiState().lastThreadRoute;
    const rememberedSplitView = lastThreadRoute?.splitViewId
      ? useSplitViewStore.getState().splitViewsById[lastThreadRoute.splitViewId]
      : undefined;

    const resolved = resolveChatIndexRestoreRoute({
      lastThreadRoute,
      courseRecentThreadRoute,
      selectedCourseId: landingCourse.id,
      availableSplitViewIds,
      threadIds,
      sidebarThreadSummaryById,
      groupProjectIds,
      summariesByProjectId,
      draftProjectIdByThreadId,
      rememberedSplitViewThreadIds: rememberedSplitView
        ? resolveSplitViewThreadIds(rememberedSplitView)
        : undefined,
      landingSpace,
    });

    if (resolved && searchView === "editor") {
      return {
        ...resolved,
        view: "editor",
      };
    }
    return resolved;
  };

  return (
    <RestoreOrCreateChatRoute
      resolveRestoreRoute={resolveRestoreRoute}
      fallbackContent={
        <CourseWorkspaceHome
          course={landingCourse}
          onStartStudySession={handleStartStudySession}
          onSwitchCourse={clearActiveCourse}
          onOpenEditor={handleOpenEditor}
        />
      }
    />
  );
}

export const Route = createFileRoute("/_chat/")({
  validateSearch: (raw: Record<string, unknown>): ChatIndexSearch => ({
    ...(typeof raw.space === "string" && raw.space.length > 0 ? { space: raw.space } : {}),
    ...(raw.view === "editor" ? { view: "editor" as const } : {}),
    ...(raw.home === true ? { home: true } : {}),
    ...(typeof raw.editorFilePath === "string" && raw.editorFilePath.length > 0
      ? { editorFilePath: raw.editorFilePath }
      : {}),
  }),
  component: ChatIndexRouteView,
});
