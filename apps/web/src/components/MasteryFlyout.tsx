// FILE: MasteryFlyout.tsx
// Purpose: Sidebar flyout view for Pillar 4: Practice & Mastery (Cmd+4).
//          Renders active retrieval drill launchers and mastery status.
// Layer: Web UI component

import type { Project } from "~/types";
import { BrainIcon, SparkleIcon, PlayIcon } from "~/lib/icons";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";

export interface MasteryFlyoutProps {
  readonly course: Project | null;
  readonly onOpenMasteryDashboard: () => void;
  readonly onStartQuizDrill: () => void;
  readonly onStartFeynmanChallenge: () => void;
}

export function MasteryFlyout(props: MasteryFlyoutProps) {
  const { course, onOpenMasteryDashboard, onStartQuizDrill, onStartFeynmanChallenge } = props;

  if (!course) {
    return (
      <Empty className="h-full flex-1 p-4">
        <EmptyMedia variant="icon">
          <BrainIcon className="size-4.5" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle className="text-ui font-semibold">No active course</EmptyTitle>
          <EmptyDescription className="text-ui-xs">
            Select or open a course to view topic mastery and flashcard drills.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-2.5 overflow-y-auto px-2 py-1.5">
      {/* 1. Mastery Status Card & Full Dashboard Action */}
      <Card variant="plain" size="sm" className="gap-2">
        <CardHeader className="p-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <BrainIcon className="size-3.5 text-primary shrink-0" />
              <CardTitle className="text-ui-xs font-semibold">Mastery Engine</CardTitle>
            </div>
            <Badge variant="outline" size="sm">
              FSRS
            </Badge>
          </div>
          <CardDescription className="text-ui-2xs text-muted-foreground">
            Tracks concept difficulty, memory stability, and retrievability.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Button
            size="sm"
            className="w-full gap-1.5 text-ui font-medium shadow-xs"
            onClick={onOpenMasteryDashboard}
          >
            <SparkleIcon className="size-3.5" />
            <span>Open Mastery Dashboard</span>
          </Button>
        </CardContent>
      </Card>

      {/* 2. Interactive Pedagogical Practice Actions */}
      <Card variant="plain" size="sm" className="gap-2">
        <CardHeader className="p-0">
          <CardTitle className="text-ui-xs font-semibold">Active Retrieval Drills</CardTitle>
          <CardDescription className="text-ui-2xs text-muted-foreground">
            Turn-by-turn guided sessions designed to reinforce long-term memory.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex flex-col gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-ui-xs font-medium shadow-xs"
            onClick={onStartQuizDrill}
          >
            <PlayIcon className="size-3 text-primary shrink-0" />
            <span className="truncate">Anti-Spoiler Practice Quiz</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-ui-xs font-medium shadow-xs"
            onClick={onStartFeynmanChallenge}
          >
            <BrainIcon className="size-3 text-primary shrink-0" />
            <span className="truncate">Feynman Teach-Back</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
