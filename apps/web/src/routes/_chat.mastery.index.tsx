// FILE: _chat.mastery.index.tsx
// Purpose: Dedicated landing for Pillar 4: Practice & Mastery (/mastery, Cmd+4).
//          Renders the Practice & Mastery workspace canvas with FSRS analytics.
// Layer: Routing

import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { MasteryDashboardHome } from "~/components/MasteryDashboardHome";
import { useCourseWorkspaceStore } from "~/courseWorkspaceStore";
import { useHandleNewThread } from "~/hooks/useHandleNewThread";
import { useRailShellStore } from "~/railShellStore";
import { useStore } from "~/store";

function MasteryIndexRouteView() {
  const { handleNewCourseStudyThread } = useHandleNewThread();
  const activeCourseId = useCourseWorkspaceStore((state) => state.activeCourseId);
  const projects = useStore((state) => state.projects);

  const activeCourse = activeCourseId
    ? (projects.find((p) => p.id === activeCourseId) ?? null)
    : null;

  useEffect(() => {
    useRailShellStore.getState().selectPanelItem("mastery");
  }, []);

  const handleStartQuizDrill = async () => {
    await handleNewCourseStudyThread({
      initialPrompt:
        "Quiz me on our course concepts one question at a time. Do not give away the solution upfront. Wait for my answer, diagnose my understanding, and guide me through errors.",
    });
  };

  const handleStartFeynmanChallenge = async () => {
    await handleNewCourseStudyThread({
      initialPrompt:
        "I want to explain a key concept from our course in my own words using the Feynman technique. Ask me which topic I want to teach you, then evaluate my explanation against the lecture slides.",
    });
  };

  const handleStartExamSimulation = async () => {
    await handleNewCourseStudyThread({
      initialPrompt:
        "Generate a diagnostic pre-exam simulation targeting our lowest retrievability topics. Present 3 progressive free-response questions with step-by-step scoring.",
    });
  };

  return (
    <MasteryDashboardHome
      course={activeCourse}
      onStartQuizDrill={handleStartQuizDrill}
      onStartFeynmanChallenge={handleStartFeynmanChallenge}
      onStartExamSimulation={handleStartExamSimulation}
    />
  );
}

export const Route = createFileRoute("/_chat/mastery/")({
  component: MasteryIndexRouteView,
});
