// FILE: StudioFlyout.tsx
// Purpose: Sidebar flyout view for Pillar 3: Study Studio (Cmd+3).
//          Shows real source files, living notes, and studio triggers.
// Layer: Web UI component

import type { Project } from "~/types";
import { BookOpenIcon, PageTextIcon, SparkleIcon, AddPlusIcon, PlayIcon } from "~/lib/icons";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";

export interface StudioFlyoutProps {
  readonly course: Project | null;
  readonly recentFiles?: readonly string[] | undefined;
  readonly onOpenStudioWorkspace: () => void;
  readonly onOpenSourceFile: (fileName: string) => void;
  readonly onOpenSynthesisNote: () => void;
  readonly onStartNewSession: () => void;
}

export function StudioFlyout(props: StudioFlyoutProps) {
  const {
    course,
    recentFiles = [],
    onOpenStudioWorkspace,
    onOpenSourceFile,
    onOpenSynthesisNote,
    onStartNewSession,
  } = props;

  if (!course) {
    return (
      <Empty className="h-full flex-1 p-4">
        <EmptyMedia variant="icon">
          <SparkleIcon className="size-4.5" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle className="text-ui font-semibold">No active course</EmptyTitle>
          <EmptyDescription className="text-ui-xs">
            Select or open a course to launch the Study Studio.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const displayFiles = recentFiles.slice(0, 4);

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto px-2.5 py-2">
      {/* 1. Studio Status & Full Workspace Trigger */}
      <Card variant="plain" size="sm" className="gap-2.5">
        <CardHeader>
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <SparkleIcon className="size-3.5 text-primary shrink-0" />
            <CardTitle className="text-ui-xs font-semibold">Study Studio</CardTitle>
          </div>
          <CardAction>
            <Badge variant="outline" size="sm">
              Tri-Pane
            </Badge>
          </CardAction>
          <CardDescription className="text-ui-2xs text-muted-foreground">
            Synchronized co-reading reader, living synthesis notes, and Socratic tutor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            size="sm"
            className="w-full gap-1.5 text-ui font-medium shadow-xs"
            onClick={onOpenStudioWorkspace}
          >
            <BookOpenIcon className="size-3.5" />
            <span>Launch Studio Canvas</span>
          </Button>
        </CardContent>
      </Card>

      {/* 2. Current Session Source Stack */}
      <Card variant="plain" size="sm" className="gap-2.5">
        <CardHeader>
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <PageTextIcon className="size-3.5 text-primary shrink-0" />
            <CardTitle className="text-ui-xs font-semibold">Source Stack</CardTitle>
          </div>
          {displayFiles.length > 0 ? (
            <CardAction>
              <Badge variant="secondary" size="sm">
                {displayFiles.length}
              </Badge>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          {displayFiles.length > 0 ? (
            displayFiles.map((file) => {
              const fileName = file.split("/").pop() ?? file;
              return (
                <button
                  key={file}
                  type="button"
                  onClick={() => onOpenSourceFile(file)}
                  className="flex items-center justify-between rounded-md border border-border/40 bg-muted/30 px-2.5 py-1.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <span className="truncate text-ui-xs font-medium text-foreground">
                    {fileName}
                  </span>
                  <PlayIcon className="size-3 text-muted-foreground shrink-0 ms-1.5" />
                </button>
              );
            })
          ) : (
            <div className="rounded-md border border-dashed border-border/50 p-2.5 text-center text-ui-2xs text-muted-foreground">
              No course documents found. Place slides or readings in the course folder.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Living Notes Action */}
      <Card variant="plain" size="sm" className="gap-2">
        <CardHeader>
          <CardTitle className="text-ui-xs font-semibold">Synthesis Notes</CardTitle>
          <CardAction>
            <Button
              variant="link"
              size="chip"
              onClick={onOpenSynthesisNote}
              className="text-ui-2xs text-primary hover:underline h-auto p-0"
            >
              Open →
            </Button>
          </CardAction>
          <CardDescription className="text-ui-2xs text-muted-foreground">
            Co-authored living notes with source citations.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 4. Quick Socratic Ask */}
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2 text-ui-xs font-medium shadow-xs"
        onClick={onStartNewSession}
      >
        <AddPlusIcon className="size-3.5 text-primary" />
        <span>Ask Socratic Tutor</span>
      </Button>
    </div>
  );
}
