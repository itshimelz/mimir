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
          sidebarThreadSummaryById[id] ||
          useComposerDraftStore.getState().draftThreadsByThreadId[id],
      );

    // 1. Try lastThreadRoute
    const lastThreadRoute = readSidebarUiState().lastThreadRoute;
    if (lastThreadRoute?.threadId && isThreadKnown(lastThreadRoute.threadId)) {
      void navigate({
        to: "/$threadId",
        params: { threadId: lastThreadRoute.threadId },
        replace: true,
        search: (previous) => ({
          ...previous,
          ...search,
          view: "editor",
        }),
      });
      return;
    }

    // 2. Try the first available thread
    const candidateThreadId = threadIds[0];
    if (candidateThreadId) {
      void navigate({
        to: "/$threadId",
        params: { threadId: candidateThreadId },
        replace: true,
        search: (previous) => ({
          ...previous,
          ...search,
          view: "editor",
        }),
      });
      return;
    }

    // 3. Fallback: create fresh thread for the first project
    const firstProject = projects[0];
    if (firstProject) {
      void handleNewThread(firstProject.id, undefined, {
        search: (previous) => ({
          ...previous,
          ...search,
          view: "editor",
        }),
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
