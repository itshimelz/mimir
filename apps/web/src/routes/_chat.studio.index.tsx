// FILE: _chat.studio.index.tsx
// Purpose: Dedicated landing for Pillar 3: Study Studio (/studio, Cmd+3).
//          Renders the Study Studio workspace canvas.
// Layer: Routing

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { StudioWorkspaceHome } from "~/components/StudioWorkspaceHome";
import { useCourseWorkspaceStore } from "~/courseWorkspaceStore";
import { useHandleNewThread } from "~/hooks/useHandleNewThread";
import { useRailShellStore } from "~/railShellStore";
import { useStore } from "~/store";

function StudioIndexRouteView() {
  const navigate = useNavigate();
  const { handleNewCourseStudyThread } = useHandleNewThread();
  const activeCourseId = useCourseWorkspaceStore((state) => state.activeCourseId);
  const projects = useStore((state) => state.projects);

  const activeCourse = activeCourseId
    ? (projects.find((p) => p.id === activeCourseId) ?? null)
    : null;

  useEffect(() => {
    useRailShellStore.getState().selectPanelItem("studio");
  }, []);

  const handleStartStudySession = async (initialPrompt?: string) => {
    await handleNewCourseStudyThread({ ...(initialPrompt ? { initialPrompt } : {}) });
  };

  const handleOpenEditor = () => {
    void navigate({
      to: "/editor",
      search: { view: "editor" },
    });
  };

  return (
    <StudioWorkspaceHome
      course={activeCourse}
      onStartStudySession={handleStartStudySession}
      onOpenEditor={handleOpenEditor}
    />
  );
}

export const Route = createFileRoute("/_chat/studio/")({
  component: StudioIndexRouteView,
});
