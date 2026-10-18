// FILE: TodayBriefingFlyout.tsx
// Purpose: Sidebar flyout view for Pillar 1: Today & Briefing (Cmd+1).
//          Surfaces today's due FSRS recall queue, active reading bookmarks,
//          and upcoming exam countdowns to eliminate student cold-start friction.
// Layer: Web UI component

import type { Project } from "~/types";
import {
  BookOpenIcon,
  BrainIcon,
  ClockIcon,
  PageTextIcon,
  PlayIcon,
  SparkleIcon,
  AddPlusIcon,
} from "~/lib/icons";
import { Button } from "~/components/ui/button";

export interface TodayBriefingFlyoutProps {
  readonly course: Project | null;
  readonly onStartRecallSession: () => void;
  readonly onResumeReading: () => void;
  readonly onStartNewSession: () => void;
  readonly onOpenMastery: () => void;
}

export function TodayBriefingFlyout(props: TodayBriefingFlyoutProps) {
  const { course, onStartRecallSession, onResumeReading, onStartNewSession, onOpenMastery } = props;

  if (!course) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center p-4 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
          <BookOpenIcon className="size-5" />
        </div>
        <p className="text-ui font-medium text-foreground">No active course</p>
        <p className="mt-1 text-ui-xs text-muted-foreground">
          Select or open a course to view your daily study briefing.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-3 overflow-y-auto px-2 py-1.5">
      {/* 1. Daily Due FSRS Recall Queue */}
      <div className="rounded-lg border border-primary/25 bg-primary/5 p-3">
        <div className="flex items-center justify-between text-ui-xs">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <BrainIcon className="size-4 text-primary shrink-0" />
            <span>Due Active Recall</span>
          </div>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-ui-2xs font-bold text-primary">
            12 Cards Due
          </span>
        </div>
        <p className="mt-1 text-ui-2xs text-muted-foreground">
          3 concepts are below 85% retrievability (high decay risk before exam).
        </p>
        <Button
          size="sm"
          className="mt-2.5 w-full gap-1.5 text-ui font-medium shadow-xs"
          onClick={onStartRecallSession}
        >
          <SparkleIcon className="size-3.5" />
          <span>Start 5-min Recall Queue</span>
        </Button>
      </div>

      {/* 2. Active Reading Bookmark */}
      <div className="rounded-lg border border-border/60 bg-secondary/20 p-3">
        <div className="flex items-center gap-1.5 text-ui-xs font-semibold text-foreground">
          <PageTextIcon className="size-3.5 text-blue-500 shrink-0" />
          <span>Resume Reading</span>
        </div>
        <div className="mt-2 flex flex-col gap-1 rounded border border-border/40 bg-background/60 p-2">
          <span className="text-ui-xs font-medium text-foreground">Lecture 03 Slides.pdf</span>
          <div className="flex items-center justify-between text-ui-2xs text-muted-foreground">
            <span>Slide 14 of 42</span>
            <span>Recorded at 18:42</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2.5 w-full gap-1.5 text-ui-xs"
          onClick={onResumeReading}
        >
          <PlayIcon className="size-3" />
          <span>Resume at Slide 14</span>
        </Button>
      </div>

      {/* 3. 7-Day Exam & Milestone Countdown */}
      <div className="rounded-lg border border-border/60 bg-secondary/20 p-3">
        <div className="flex items-center justify-between text-ui-xs font-semibold text-foreground">
          <div className="flex items-center gap-1.5">
            <ClockIcon className="size-3.5 text-amber-500 shrink-0" />
            <span>Upcoming Exam</span>
          </div>
          <span className="text-ui-2xs font-bold text-amber-600 dark:text-amber-400">
            8 Days Left
          </span>
        </div>
        <div className="mt-2 flex flex-col gap-1">
          <span className="text-ui-xs font-medium text-foreground">Midterm Exam (Weeks 1–4)</span>
          <div className="flex items-center justify-between text-ui-2xs text-muted-foreground">
            <span>Course Weight: 25%</span>
            <span>Prep Readiness: 78%</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenMastery}
          className="mt-2 text-left text-ui-2xs font-medium text-primary hover:underline"
        >
          View Weakest Concepts Diagnostic →
        </button>
      </div>

      {/* 4. Quick Action */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-ui-xs text-muted-foreground hover:text-foreground"
        onClick={onStartNewSession}
      >
        <AddPlusIcon className="size-3.5 text-primary" />
        <span>New Socratic Study Session</span>
      </Button>
    </div>
  );
}
