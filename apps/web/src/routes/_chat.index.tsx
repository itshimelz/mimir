// FILE: _chat.index.tsx
// Purpose: Single-course workspace entry and restoration landing for Mimir.
//          Binds "/" to the active course, restores the course-scoped recent thread,
//          or presents the CourseWorkspaceHome / CoursePickerLanding.
// Layer: Routing

import { SpaceId, type ProjectId } from "@synara/contracts";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { CoursePickerLanding } from "../components/CoursePickerLanding";
import { CourseWorkspaceHome } from "../components/CourseWorkspaceHome";
import {
  RestoreOrCreateChatRoute,
  type RestoreRouteResolver,
} from "../components/RestoreOrCreateChatRoute";
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
import { resolveChatIndexRestoreRoute, type ChatIndexLandingSpace } from "./-chatIndexRoute.logic";

export interface ChatIndexSearch {
  readonly space?: string | undefined;
  readonly view?: "editor" | undefined;
  readonly editorFilePath?: string | undefined;
  readonly home?: boolean | undefined;
}

function ChatIndexRouteView() {
  const navigate = useNavigate();
  const { handleNewThread } = useHandleNewThread();
  const landingSpaceKey = Route.useSearch({ select: (search) => search.space });
  const searchHome = Route.useSearch({ select: (search) => search.home });
  const searchView = Route.useSearch({ select: (search) => search.view });
  const _searchEditorFilePath = Route.useSearch({ select: (search) => search.editorFilePath });

  const threadsHydrated = useStore((state) => state.threadsHydrated);
  const threadIds = useStore((state) => state.threadIds ?? EMPTY_THREAD_IDS);
  const projects = useStore((state) => state.projects);
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

  // 1. If hydration has not completed yet, show the splash screen
  if (!threadsHydrated) {
    return <SplashScreen />;
  }

  // 2. Resolve active course from projects
  const activeCourse = activeCourseId
    ? (projects.find((p) => p.id === activeCourseId) ?? null)
    : null;

  // 3. If there is no valid active course selected, show the course picker landing
  if (!activeCourse) {
    return (
      <CoursePickerLanding
        onCourseSelected={(courseId) => {
          setActiveCourseId(courseId);
        }}
      />
    );
  }

  const handleStartStudySession = async (initialPrompt?: string) => {
    const threadId = await handleNewThread(activeCourse.id);
    if (threadId) {
      useCourseWorkspaceStore.getState().setCourseRecentThreadId(activeCourse.id, threadId);
      if (initialPrompt) {
        useComposerDraftStore.getState().setPrompt(threadId, initialPrompt);
      }
    }
  };

  const handleOpenEditor = () => {
    void navigate({
      search: ((prev: Record<string, unknown>) => ({
        ...prev,
        view: "editor",
      })) as never,
    });
  };

  // 4. If user explicitly navigated to Course Home (?home=true), show CourseWorkspaceHome
  if (searchHome) {
    return (
      <CourseWorkspaceHome
        course={activeCourse}
        onStartStudySession={handleStartStudySession}
        onSwitchCourse={clearActiveCourse}
        onOpenEditor={handleOpenEditor}
      />
    );
  }

  // 5. Normal route landing: attempt to restore the course-scoped recent thread.
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

  const courseRecentThreadId = recentThreadIdByCourse[activeCourse.id];
  const courseRecentThreadRoute = courseRecentThreadId ? { threadId: courseRecentThreadId } : null;

  const resolveRestoreRoute: RestoreRouteResolver = ({ availableSplitViewIds }) => {
    const lastThreadRoute = readSidebarUiState().lastThreadRoute;
    const rememberedSplitView = lastThreadRoute?.splitViewId
      ? useSplitViewStore.getState().splitViewsById[lastThreadRoute.splitViewId]
      : undefined;

    const resolved = resolveChatIndexRestoreRoute({
      lastThreadRoute,
      courseRecentThreadRoute,
      selectedCourseId: activeCourse.id,
      availableSplitViewIds,
      threadIds,
      sidebarThreadSummaryById,
      groupProjectIds,
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
          course={activeCourse}
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
