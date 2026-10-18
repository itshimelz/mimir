// FILE: _chat.editor.tsx
// Purpose: Dedicated route for /editor — restores or creates the editor workspace
//          for the active course/project and keeps the editor path valid across reloads.
// Layer: Routing

import { type ThreadId } from "@synara/contracts";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { parseDiffRouteSearch, type DiffRouteSearch } from "../diffRouteSearch";
import { readSidebarUiState } from "../components/Sidebar.uiState";
import { ChatMountLoader } from "../components/chat/ChatThreadSurfacePrimitives";
import { useComposerDraftStore } from "../composerDraftStore";
import { useCourseWorkspaceStore } from "../courseWorkspaceStore";
import { useHandleNewThread } from "../hooks/useHandleNewThread";
import { useRailShellStore } from "../railShellStore";
import { useSplitViewStore } from "../splitViewStore";
import { EMPTY_THREAD_IDS, useStore } from "../store";

function ChatEditorRouteView() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const threadsHydrated = useStore((store) => store.threadsHydrated);
  const threadIds = useStore((store) => store.threadIds ?? EMPTY_THREAD_IDS);
  const threadShellById = useStore((store) => store.threadShellById);
  const sidebarThreadSummaryById = useStore((store) => store.sidebarThreadSummaryById);
  const projects = useStore((store) => store.projects);
  const splitViewsHydrated = useSplitViewStore((store) => store.hasHydrated);
  const { handleNewThread } = useHandleNewThread();

  useEffect(() => {
    if (!threadsHydrated || !splitViewsHydrated) {
      return;
    }

    // Ensure the Courses/Workspace panel is active
    useRailShellStore.getState().selectPanelItem("spaces");

    const isThreadKnown = (id: string) =>
      Boolean(
        threadShellById?.[id as ThreadId] ||
        sidebarThreadSummaryById[id as ThreadId] ||
        useComposerDraftStore.getState().draftThreadsByThreadId[id as ThreadId],
      );

    const activeCourseId = useCourseWorkspaceStore.getState().activeCourseId;
    const recentThreadIdByCourse = useCourseWorkspaceStore.getState().recentThreadIdByCourse;
    const courseRecentThreadId = activeCourseId
      ? recentThreadIdByCourse[activeCourseId]
      : undefined;

    const buildEditorSearch = (previous?: Record<string, unknown>) => {
      const { home: _, editorFilePath: _prevFile, ...rest } = previous ?? {};
      return {
        ...rest,
        view: "editor" as const,
        ...(search.editorFilePath ? { editorFilePath: search.editorFilePath } : {}),
      };
    };

    // 1. If active course has a recent thread, navigate to it in editor view
    if (courseRecentThreadId && isThreadKnown(courseRecentThreadId)) {
      void navigate({
        to: "/$threadId",
        params: { threadId: courseRecentThreadId },
        replace: true,
        search: (previous) => buildEditorSearch(previous as Record<string, unknown>),
      });
      return;
    }

    // 2. Try any thread belonging to active course
    if (activeCourseId) {
      const courseThread = threadIds.find((id) => {
        const shell = threadShellById?.[id as ThreadId];
        const summary = sidebarThreadSummaryById[id as ThreadId];
        return (shell?.projectId ?? summary?.projectId) === activeCourseId;
      });
      if (courseThread) {
        void navigate({
          to: "/$threadId",
          params: { threadId: courseThread },
          replace: true,
          search: (previous) => buildEditorSearch(previous as Record<string, unknown>),
        });
        return;
      }
    }

    // 3. Fallback when activeCourseId is set: create a fresh thread for activeCourseId.
    // Never fall back to an unrelated course's thread when activeCourseId is chosen.
    if (activeCourseId) {
      void handleNewThread(activeCourseId, undefined, {
        search: (previous) => buildEditorSearch(previous as Record<string, unknown>),
      });
      return;
    }

    // 4. No activeCourseId: Try lastThreadRoute
    const lastThreadRoute = readSidebarUiState().lastThreadRoute;
    if (lastThreadRoute?.threadId && isThreadKnown(lastThreadRoute.threadId)) {
      void navigate({
        to: "/$threadId",
        params: { threadId: lastThreadRoute.threadId },
        replace: true,
        search: (previous) => buildEditorSearch(previous as Record<string, unknown>),
      });
      return;
    }

    // 5. Try the first available thread
    const candidateThreadId = threadIds[0];
    if (candidateThreadId) {
      void navigate({
        to: "/$threadId",
        params: { threadId: candidateThreadId },
        replace: true,
        search: (previous) => buildEditorSearch(previous as Record<string, unknown>),
      });
      return;
    }

    // 6. Final fallback: create fresh thread for the first project
    const targetProjectId = projects[0]?.id;
    if (targetProjectId) {
      void handleNewThread(targetProjectId, undefined, {
        search: (previous) => buildEditorSearch(previous as Record<string, unknown>),
      });
    }
  }, [
    handleNewThread,
    navigate,
    projects,
    search,
    sidebarThreadSummaryById,
    splitViewsHydrated,
    threadIds,
    threadShellById,
    threadsHydrated,
  ]);

  return <ChatMountLoader />;
}

export const Route = createFileRoute("/_chat/editor")({
  validateSearch: (search: Record<string, unknown>): DiffRouteSearch =>
    parseDiffRouteSearch(search),
  component: ChatEditorRouteView,
});
