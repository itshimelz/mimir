// FILE: MasteryDashboardHome.tsx
// Purpose: Dedicated workspace canvas for Pillar 4: Practice & Mastery (/mastery, Cmd+4).
//          Visualizes FSRS spaced repetition metrics (D, S, R), course syllabus
//          mastery heatmap, and interactive anti-spoiler drill launchers.
// Layer: Web UI component

import type { Project } from "~/types";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { RouteSurfaceHeader } from "~/components/RouteSurface";
import { BrainIcon, PlayIcon, SparkleIcon, ClockIcon } from "~/lib/icons";

export interface MasteryDashboardHomeProps {
  readonly course: Project | null;
  readonly onStartQuizDrill: () => void;
  readonly onStartFeynmanChallenge: () => void;
  readonly onStartExamSimulation: () => void;
}

const HEATMAP_TOPICS = [
  {
    week: "Week 1",
    topic: "Resting Membrane Potential & Nernst Equation",
    retrievability: 92,
    stabilityDays: 24,
    status: "Mastered",
    dueCards: 0,
  },
  {
    week: "Week 2",
    topic: "Action Potential Generation & Voltage Gating",
    retrievability: 64,
    stabilityDays: 4,
    status: "Needs Review",
    dueCards: 5,
  },
  {
    week: "Week 3",
    topic: "Synaptic Transmission & Vesicle Release",
    retrievability: 85,
    stabilityDays: 16,
    status: "Stable",
    dueCards: 2,
  },
  {
    week: "Week 4",
    topic: "Postsynaptic Receptors & Plasticity",
    retrievability: 71,
    stabilityDays: 8,
    status: "Decaying",
    dueCards: 5,
  },
] as const;

export function MasteryDashboardHome(props: MasteryDashboardHomeProps) {
  const { course, onStartQuizDrill, onStartFeynmanChallenge, onStartExamSimulation } = props;

  if (!course) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
          <BrainIcon className="size-7" />
        </div>
        <h2 className="font-heading font-semibold text-xl text-foreground">
          No Course Workspace Active
        </h2>
        <p className="mt-1 max-w-sm text-ui text-muted-foreground">
          Open a course workspace to view your FSRS mastery analytics and practice drills.
        </p>
      </div>
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
        <div className="flex w-full max-w-5xl flex-col p-6 md:p-10 mx-auto gap-8">
          {/* Header Hero */}
          <div className="flex flex-col gap-2 border-b border-border/60 pb-6">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-ui-2xs font-medium">
                Pillar 4: Practice & Mastery
              </Badge>
              <Badge variant="outline" className="text-ui-2xs font-mono">
                FSRS v4/v5 Engine
              </Badge>
            </div>
            <h1 className="font-heading font-bold text-2xl md:text-3xl tracking-tight text-foreground">
              Retention & Active Recall Drills
            </h1>
            <p className="text-ui text-muted-foreground max-w-2xl">
              Spaced repetition scheduler tracking concept Difficulty (D), Stability (S), and
              Retrievability (R). Ensures high retention before midterm and final exams without
              cramming.
            </p>
          </div>

          {/* FSRS High-Level Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-card/60 p-4">
              <span className="text-ui-2xs uppercase tracking-wider text-muted-foreground">
                Average Retrievability
              </span>
              <span className="font-heading font-bold text-2xl text-foreground">78%</span>
              <span className="text-ui-2xs text-emerald-600 dark:text-emerald-400">
                Target: 90%
              </span>
            </div>

            <div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-card/60 p-4">
              <span className="text-ui-2xs uppercase tracking-wider text-muted-foreground">
                Memory Stability (S)
              </span>
              <span className="font-heading font-bold text-2xl text-foreground">14.2 days</span>
              <span className="text-ui-2xs text-muted-foreground">Half-life of retained facts</span>
            </div>

            <div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-card/60 p-4">
              <span className="text-ui-2xs uppercase tracking-wider text-muted-foreground">
                Reviews Due Today
              </span>
              <span className="font-heading font-bold text-2xl text-amber-600 dark:text-amber-400">
                12 Cards
              </span>
              <span className="text-ui-2xs text-muted-foreground">~5 mins drill time</span>
            </div>

            <div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-card/60 p-4">
              <span className="text-ui-2xs uppercase tracking-wider text-muted-foreground">
                Exam Readiness
              </span>
              <span className="font-heading font-bold text-2xl text-primary">82%</span>
              <span className="text-ui-2xs text-muted-foreground">Next exam in 8 days</span>
            </div>
          </div>

          {/* Course Syllabus Topic Mastery Heatmap */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-ui-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Syllabus Topic Mastery Heatmap
              </span>
              <span className="text-ui-2xs text-muted-foreground">
                Based on active quizzes & scratchpad checks
              </span>
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card/40 p-4">
              {HEATMAP_TOPICS.map((item) => (
                <div
                  key={item.topic}
                  className="flex flex-col gap-1.5 border-b border-border/30 pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center justify-between text-ui-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-ui-2xs text-muted-foreground shrink-0">
                        {item.week}
                      </span>
                      <span className="font-semibold text-foreground truncate">{item.topic}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.dueCards > 0 ? (
                        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-ui-2xs font-semibold text-amber-600 dark:text-amber-400">
                          {item.dueCards} due
                        </span>
                      ) : null}
                      <span
                        className={
                          item.retrievability < 75
                            ? "font-bold text-amber-600 dark:text-amber-400"
                            : "font-bold text-emerald-600 dark:text-emerald-400"
                        }
                      >
                        {item.retrievability}% Retrievability
                      </span>
                    </div>
                  </div>

                  {/* Visual retention bar */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
                    <div
                      className={
                        item.retrievability < 75
                          ? "h-full rounded-full bg-amber-500 transition-all duration-300"
                          : "h-full rounded-full bg-emerald-500 transition-all duration-300"
                      }
                      style={{ width: `${item.retrievability}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Pedagogical Drill Launchers */}
          <div className="flex flex-col gap-4">
            <span className="text-ui-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Launch Active Mastery Sessions
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card
                variant="plain"
                interactive={true}
                onClick={onStartQuizDrill}
                className="flex flex-col justify-between p-5 transition-all hover:border-primary/40 hover:bg-card/90"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <SparkleIcon className="size-5" />
                  </div>
                  <h3 className="font-heading font-semibold text-ui-lg text-foreground">
                    Anti-Spoiler Practice Quiz
                  </h3>
                  <p className="text-ui-xs text-muted-foreground">
                    1-on-1 turn-by-turn quiz that guides your thinking without giving away
                    solutions.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-ui-xs font-medium text-primary">
                  <PlayIcon className="size-3" />
                  <span>Start Quiz Drill</span>
                </div>
              </Card>

              <Card
                variant="plain"
                interactive={true}
                onClick={onStartFeynmanChallenge}
                className="flex flex-col justify-between p-5 transition-all hover:border-primary/40 hover:bg-card/90"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <BrainIcon className="size-5" />
                  </div>
                  <h3 className="font-heading font-semibold text-ui-lg text-foreground">
                    Feynman Teach-Back
                  </h3>
                  <p className="text-ui-xs text-muted-foreground">
                    Explain a concept in plain words. Mimir verifies against slides and spots blind
                    spots.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-ui-xs font-medium text-primary">
                  <PlayIcon className="size-3" />
                  <span>Start Teach-Back</span>
                </div>
              </Card>

              <Card
                variant="plain"
                interactive={true}
                onClick={onStartExamSimulation}
                className="flex flex-col justify-between p-5 transition-all hover:border-primary/40 hover:bg-card/90"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <ClockIcon className="size-5" />
                  </div>
                  <h3 className="font-heading font-semibold text-ui-lg text-foreground">
                    Pre-Exam Diagnostic
                  </h3>
                  <p className="text-ui-xs text-muted-foreground">
                    Adaptive simulation targeting your lowest retrievability topics before the
                    midterm.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-ui-xs font-medium text-primary">
                  <PlayIcon className="size-3" />
                  <span>Start Simulation</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
