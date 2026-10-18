// FILE: MasteryDashboardHome.tsx
// Purpose: Dedicated workspace canvas for Pillar 4: Practice & Mastery (/mastery, Cmd+4).
//          Renders active retrieval drill launchers and FSRS review options.
// Layer: Web UI component

import type { Project } from "~/types";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { RouteSurfaceHeader } from "~/components/RouteSurface";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { BrainIcon, ClockIcon, PlayIcon, SparkleIcon } from "~/lib/icons";

export interface MasteryDashboardHomeProps {
  readonly course: Project | null;
  readonly onStartQuizDrill: () => void;
  readonly onStartFeynmanChallenge: () => void;
  readonly onStartExamSimulation: () => void;
}

export function MasteryDashboardHome(props: MasteryDashboardHomeProps) {
  const { course, onStartQuizDrill, onStartFeynmanChallenge, onStartExamSimulation } = props;

  if (!course) {
    return (
      <Empty className="h-full flex-1 p-8">
        <EmptyMedia variant="icon">
          <BrainIcon className="size-6" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle className="text-ui-lg font-semibold">No Course Workspace Active</EmptyTitle>
          <EmptyDescription className="text-ui">
            Select or open a course to access your practice drills and retention analytics.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <RouteSurfaceHeader divider className="shrink-0">
        <div className="flex items-center gap-2 text-ui-xs">
          <BrainIcon className="size-4 text-primary shrink-0" />
          <span className="font-semibold text-foreground">Practice & Mastery</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground truncate">{course.name}</span>
        </div>
      </RouteSurfaceHeader>

      <div className="flex min-h-0 flex-1 w-full flex-col overflow-y-auto">
        <div className="flex w-full max-w-4xl flex-col p-6 md:p-8 mx-auto gap-6">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" size="sm">
                Pillar 4: Mastery
              </Badge>
              <Badge variant="outline" size="sm">
                FSRS Retrieval Engine
              </Badge>
            </div>
            <h1 className="font-heading font-bold text-2xl md:text-3xl tracking-tight text-foreground">
              Active Recall & Practice Drills
            </h1>
            <p className="text-ui text-muted-foreground max-w-2xl">
              Turn-by-turn retrieval practice tracking difficulty, stability, and retrievability to
              reinforce long-term retention before exams.
            </p>
          </div>

          {/* Drill Launchers Section */}
          <div className="flex flex-col gap-4">
            <span className="text-ui-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Retrieval Drills
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card
                variant="plain"
                interactive
                onClick={onStartQuizDrill}
                className="justify-between"
              >
                <CardHeader>
                  <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary mb-1">
                    <SparkleIcon className="size-4" />
                  </div>
                  <CardTitle className="text-ui-lg">Practice Quiz</CardTitle>
                  <CardDescription className="text-ui-xs leading-relaxed">
                    Turn-by-turn questions that guide your reasoning without spoiling solutions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-1.5 text-ui-xs font-medium text-primary">
                    <PlayIcon className="size-3" />
                    <span>Start Quiz</span>
                  </div>
                </CardContent>
              </Card>

              <Card
                variant="plain"
                interactive
                onClick={onStartFeynmanChallenge}
                className="justify-between"
              >
                <CardHeader>
                  <div className="flex size-8 items-center justify-center rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-1">
                    <BrainIcon className="size-4" />
                  </div>
                  <CardTitle className="text-ui-lg">Feynman Teach-Back</CardTitle>
                  <CardDescription className="text-ui-xs leading-relaxed">
                    Explain a concept in your own words. Mimir checks for misconceptions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-1.5 text-ui-xs font-medium text-primary">
                    <PlayIcon className="size-3" />
                    <span>Start Teach-Back</span>
                  </div>
                </CardContent>
              </Card>

              <Card
                variant="plain"
                interactive
                onClick={onStartExamSimulation}
                className="justify-between"
              >
                <CardHeader>
                  <div className="flex size-8 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-1">
                    <ClockIcon className="size-4" />
                  </div>
                  <CardTitle className="text-ui-lg">Exam Diagnostic</CardTitle>
                  <CardDescription className="text-ui-xs leading-relaxed">
                    Diagnostic simulation focusing on high-weight course concepts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-1.5 text-ui-xs font-medium text-primary">
                    <PlayIcon className="size-3" />
                    <span>Start Simulation</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Retention Progress Card */}
          <Card variant="muted" size="sm" className="gap-2 p-4">
            <CardHeader className="p-0">
              <CardTitle className="text-ui-xs font-semibold">Mastery Status</CardTitle>
              <CardDescription className="text-ui-xs text-muted-foreground">
                Your topic mastery heatmap and stability metrics will populate as you complete
                retrieval quizzes and teach-back sessions for this course.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
