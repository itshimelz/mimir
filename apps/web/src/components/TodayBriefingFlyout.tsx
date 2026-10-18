// FILE: TodayBriefingFlyout.tsx
// Purpose: Sidebar flyout view for Pillar 1: Today & Briefing (Cmd+1).
//          Surfaces real course actions, study session triggers, and active files.
// Layer: Web UI component

import type { Project } from "~/types";
import {
  BookOpenIcon,
  BrainIcon,
  PageTextIcon,
  PlayIcon,
  SparkleIcon,
  AddPlusIcon,
} from "~/lib/icons";
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

export interface TodayBriefingFlyoutProps {
  readonly course: Project | null;
  readonly recentFiles?: readonly string[] | undefined;
  readonly onStartRecallSession: () => void;
  readonly onResumeReading: (filePath?: string) => void;
  readonly onStartNewSession: () => void;
  readonly onOpenMastery: () => void;
}

export function TodayBriefingFlyout(props: TodayBriefingFlyoutProps) {
  const {
    course,
    recentFiles = [],
    onStartRecallSession,
    onResumeReading,
    onStartNewSession,
    onOpenMastery,
  } = props;

  if (!course) {
    return (
      <Empty className="h-full flex-1 p-4">
        <EmptyMedia variant="icon">
          <BookOpenIcon className="size-4.5" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle className="text-ui font-semibold">No active course</EmptyTitle>
          <EmptyDescription className="text-ui-xs">
            Select or open a course to view your daily study briefing.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const displayFiles = recentFiles.slice(0, 3);

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-2.5 overflow-y-auto px-2 py-1.5">
      {/* 1. Daily Active Recall Card */}
      <Card variant="plain" size="sm" className="gap-2">
        <CardHeader className="p-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <BrainIcon className="size-3.5 text-primary shrink-0" />
              <CardTitle className="text-ui-xs font-semibold">Active Recall</CardTitle>
            </div>
            <Badge variant="outline" size="sm">
              Practice
            </Badge>
          </div>
          <CardDescription className="text-ui-2xs text-muted-foreground">
            Test concept comprehension with guided turn-by-turn prompts.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Button
            size="sm"
            className="w-full gap-1.5 text-ui font-medium shadow-xs"
            onClick={onStartRecallSession}
          >
            <SparkleIcon className="size-3.5" />
            <span>Practice Recall Queue</span>
          </Button>
        </CardContent>
      </Card>

      {/* 2. Reading Materials */}
      <Card variant="plain" size="sm" className="gap-2">
        <CardHeader className="p-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <PageTextIcon className="size-3.5 text-primary shrink-0" />
              <CardTitle className="text-ui-xs font-semibold">Course Materials</CardTitle>
            </div>
            {displayFiles.length > 0 ? (
              <Badge variant="secondary" size="sm">
                {displayFiles.length}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="p-0 flex flex-col gap-1.5">
          {displayFiles.length > 0 ? (
            displayFiles.map((file) => {
              const fileName = file.split("/").pop() ?? file;
              return (
                <button
                  key={file}
                  type="button"
                  onClick={() => onResumeReading(file)}
                  className="flex items-center justify-between rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <span className="truncate text-ui-xs font-medium text-foreground">
                    {fileName}
                  </span>
                  <PlayIcon className="size-3 text-muted-foreground shrink-0" />
                </button>
              );
            })
          ) : (
            <div className="rounded-md border border-dashed border-border/50 p-2.5 text-center text-ui-2xs text-muted-foreground">
              No recent documents open. Use the Courses panel to browse files.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Mastery Progress Link */}
      <Card variant="plain" size="sm" className="gap-2">
        <CardHeader className="p-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-ui-xs font-semibold">Mastery & Diagnostics</CardTitle>
            <Button
              variant="link"
              size="chip"
              onClick={onOpenMastery}
              className="text-ui-2xs p-0 text-primary hover:underline h-auto"
            >
              View →
            </Button>
          </div>
          <CardDescription className="text-ui-2xs text-muted-foreground">
            View topic diagnostics, retention curves, and exam prep drills.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 4. Quick Action */}
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2 text-ui-xs font-medium shadow-xs"
        onClick={onStartNewSession}
      >
        <AddPlusIcon className="size-3.5 text-primary" />
        <span>New Socratic Study Session</span>
      </Button>
    </div>
  );
}
