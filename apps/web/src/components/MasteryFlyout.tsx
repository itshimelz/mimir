// FILE: MasteryFlyout.tsx
// Purpose: Sidebar flyout view for Pillar 4: Practice & Mastery (Cmd+4).
//          Renders topic mastery heatmap summary, due FSRS recall decks,
//          and weakest concepts diagnostic launchers.
// Layer: Web UI component

import type { Project } from "~/types";
import { BrainIcon, SparkleIcon, CheckIcon, PlayIcon } from "~/lib/icons";
import { Button } from "~/components/ui/button";

export interface MasteryFlyoutProps {
  readonly course: Project | null;
  readonly onOpenMasteryDashboard: () => void;
  readonly onStartQuizDrill: () => void;
  readonly onStartFeynmanChallenge: () => void;
}

const MOCK_TOPIC_MASTERY = [
  { topic: "Resting Membrane Potential", retrievability: 92, status: "Mastered" },
  { topic: "Action Potential Generation", retrievability: 64, status: "Needs Review" },
  { topic: "Synaptic Transmission", retrievability: 85, status: "Stable" },
  { topic: "Neurotransmitter Receptors", retrievability: 71, status: "Decaying" },
];

export function MasteryFlyout(props: MasteryFlyoutProps) {
  const { course, onOpenMasteryDashboard, onStartQuizDrill, onStartFeynmanChallenge } = props;

  if (!course) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center p-4 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
          <BrainIcon className="size-5" />
        </div>
        <p className="text-ui font-medium text-foreground">No active course</p>
        <p className="mt-1 text-ui-xs text-muted-foreground">
          Select or open a course to view topic mastery and flashcard drills.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-3 overflow-y-auto px-2 py-1.5">
      {/* 1. Mastery Status Card & Full Dashboard Action */}
      <div className="rounded-lg border border-primary/25 bg-primary/5 p-3">
        <div className="flex items-center justify-between text-ui-xs font-semibold text-foreground">
          <div className="flex items-center gap-1.5">
            <BrainIcon className="size-4 text-primary shrink-0" />
            <span>FSRS Mastery Engine</span>
          </div>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-ui-2xs font-bold text-primary">
            78% Overall
          </span>
        </div>
        <p className="mt-1 text-ui-2xs text-muted-foreground">
          Tracks concept difficulty, stability, and retrievability across your entire syllabus.
        </p>
        <Button
          size="sm"
          className="mt-2.5 w-full gap-1.5 text-ui font-medium shadow-xs"
          onClick={onOpenMasteryDashboard}
        >
          <SparkleIcon className="size-3.5" />
          <span>Open Mastery Dashboard</span>
        </Button>
      </div>

      {/* 2. Topic Mastery Heatmap Preview */}
      <div className="rounded-lg border border-border/60 bg-secondary/20 p-3">
        <span className="text-ui-xs font-semibold text-foreground">Topic Mastery Heatmap</span>
        <div className="mt-2 flex flex-col gap-2">
          {MOCK_TOPIC_MASTERY.map((item) => (
            <div key={item.topic} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-ui-2xs">
                <span className="truncate font-medium text-foreground">{item.topic}</span>
                <span
                  className={
                    item.retrievability < 75
                      ? "font-semibold text-amber-600 dark:text-amber-400"
                      : "font-semibold text-emerald-600 dark:text-emerald-400"
                  }
                >
                  {item.retrievability}% R
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={
                    item.retrievability < 75
                      ? "h-full rounded-full bg-amber-500"
                      : "h-full rounded-full bg-emerald-500"
                  }
                  style={{ width: `${item.retrievability}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Interactive Pedagogical Practice Actions */}
      <div className="rounded-lg border border-border/60 bg-secondary/20 p-3">
        <span className="text-ui-xs font-semibold text-foreground">Active Retrieval Drills</span>
        <div className="mt-2 flex flex-col gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-ui-xs"
            onClick={onStartQuizDrill}
          >
            <PlayIcon className="size-3 text-primary" />
            <span>Interactive Quiz Drill (Anti-Spoiler)</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-ui-xs"
            onClick={onStartFeynmanChallenge}
          >
            <BrainIcon className="size-3 text-primary" />
            <span>Feynman Teach-Back Challenge</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
