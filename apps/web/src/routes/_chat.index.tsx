// FILE: _chat.index.tsx
// Purpose: Single-course workspace entry and restoration landing for Mimir.
//          Binds "/" to the active course — opening the most recently used one on its Today
//          view when nothing usable is bound — restores the course-scoped recent thread, or
//          presents the CourseWorkspaceHome / CoursePickerLanding.
// Layer: Routing

import { SpaceId, type ProjectId } from "@synara/contracts";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";

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
import { useRailShellStore } from "../railShellStore";
import { useHandleNewThread } from "../hooks/useHandleNewThread";
import { useLatestProjectStore } from "../latestProjectStore";
import { collectGroupProjectIds } from "../lib/groupProjects";
import {
  resolveLatestProjectTargetId,
  resolveLatestProjectTargetIdWithFallback,
} from "../lib/projectShortcutTargets";
import { VOID_SPACE_KEY } from "../lib/spaceGrouping";
import { resolveSplitViewThreadIds, useSplitViewStore } from "../splitViewStore";
import { EMPTY_THREAD_IDS, useStore } from "../store";
import { createProjectLastActivityAtSelector } from "../storeSelectors";
import { useWorkspacePathsStore } from "../workspacePathsStore";
import { resolveChatIndexRestoreRoute, type ChatIndexLandingSpace } from "./-chatIndexRoute.logic";

export interface ChatIndexSearch {
  readonly space?: string | undefined;
  readonly view?: "editor" | undefined;
  readonly editorFilePath?: string | undefined;
  readonly home?: boolean | undefined;
  /** Switch Course asks for the picker explicitly, so the landing does not reopen a course. */
  readonly picker?: boolean | undefined;
}

function ChatIndexRouteView() {
  const navigate = useNavigate();
  const { handleNewThread, handleNewCourseStudyThread } = useHandleNewThread();
  const landingSpaceKey = Route.useSearch({ select: (search) => search.space });
  const searchHome = Route.useSearch({ select: (search) => search.home });
  const searchView = Route.useSearch({ select: (search) => search.view });
  const searchPicker = Route.useSearch({ select: (search) => search.picker });
  const searchEditorFilePath = Route.useSearch({ select: (search) => search.editorFilePath });

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
  const latestProjectId = useLatestProjectStore((state) => state.latestProjectId);
  const selectProjectLastActivityAt = useMemo(() => createProjectLastActivityAtSelector(), []);
  const projectLastActivityAt = useStore(selectProjectLastActivityAt);

  // 1. Which course "/" shows: the bound one while the snapshot still lists it, otherwise the
  //    most recently used course — the same target the Shell resolves for its new-thread
  //    shortcuts. A bound id whose course is gone (deleted, or restored from an older profile)
  //    is not usable, so it counts as nothing bound.
  const boundCourseId = resolveLatestProjectTargetId(projects, activeCourseId);
  const openingCourseId =
    boundCourseId === null
      ? resolveLatestProjectTargetIdWithFallback(projects, latestProjectId, projectLastActivityAt)
      : null;

  // 2. Opening a course lands on its Today view, the landing the rail's Today item produces, so
  //    record that in the URL it navigates to. Without it the restored-thread policy below takes
  //    over the moment the course is bound and pulls the window into an old thread. Switch Course
  //    asks for the picker the same way, through the URL, so the landing needs no extra state.
  useEffect(() => {
    if (openingCourseId === null || searchPicker === true || searchView === "editor") return;
    setActiveCourseId(openingCourseId);
    if (searchHome !== true) {
      void navigate({ to: "/", search: { home: true }, replace: true });
    }
  }, [navigate, openingCourseId, searchHome, searchPicker, searchView, setActiveCourseId]);

  // 2b. If the search explicitly requests the editor surface, forward immediately to the
  //     dedicated /editor route so the file or deliverable opens in the editor workspace.
  useEffect(() => {
    if (searchView === "editor") {
      useRailShellStore.getState().selectPanelItem("spaces");
      void navigate({
        to: "/editor",
        search: {
          view: "editor",
          ...(searchEditorFilePath ? { editorFilePath: searchEditorFilePath } : {}),
        },
        replace: true,
      });
    }
  }, [navigate, searchEditorFilePath, searchView]);

  if (searchView === "editor") {
    return <SplashScreen />;
  }

  // 3. If hydration has not completed yet, show the splash screen
  if (!threadsHydrated) {
    return <SplashScreen />;
  }

  // 4. The course this landing shows: the bound one, or the one this launch opened.
  const landingCourseId = boundCourseId ?? openingCourseId;
  const landingCourse =
    landingCourseId === null
      ? null
      : (projects.find((project) => project.id === landingCourseId) ?? null);

  // 5. The picker is the landing only when there is no course to open, or when Switch Course
  //    asked for it.
  if (searchPicker === true || landingCourse === null) {
    return (
      <CoursePickerLanding
        onCourseSelected={() => {
          // Drop ?picker, or the landing would keep rendering the picker over the new course.
          void navigate({ to: "/", search: {}, replace: true });
        }}
      />
    );
  }

  const handleStartStudySession = async (initialPrompt?: string) => {
    useRailShellStore.getState().selectPanelItem("chats");
    await handleNewCourseStudyThread({ ...(initialPrompt ? { initialPrompt } : {}) });
  };

  const handleOpenEditor = () => {
    useRailShellStore.getState().selectPanelItem("spaces");
    void navigate({
      to: "/editor",
      search: { view: "editor" },
    });
  };

  const handleSwitchCourse = () => {
    clearActiveCourse();
    void navigate({ to: "/", search: { picker: true } });
  };

  // 6. Today: asked for explicitly (?home=true), or the view this launch opened the course on.
  if (searchHome === true || openingCourseId !== null) {
    return (
      <CourseWorkspaceHome
        course={landingCourse}
        onStartStudySession={handleStartStudySession}
        onSwitchCourse={handleSwitchCourse}
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
          onSwitchCourse={handleSwitchCourse}
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
    ...(raw.picker === true ? { picker: true } : {}),
    ...(typeof raw.editorFilePath === "string" && raw.editorFilePath.length > 0
      ? { editorFilePath: raw.editorFilePath }
      : {}),
  }),
  component: ChatIndexRouteView,
});
