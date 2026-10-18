// FILE: StudioFlyout.tsx
// Purpose: Sidebar flyout view for Pillar 3: Study Studio (Cmd+3).
//          Shows active module outline, pinned source stack, living synthesis notes,
//          and margin threads for deep co-reading.
// Layer: Web UI component

import type { Project } from "~/types";
import {
  BookOpenIcon,
  ChatBubbleIcon,
  PageTextIcon,
  SparkleIcon,
  AddPlusIcon,
  PlayIcon,
} from "~/lib/icons";
import { Button } from "~/components/ui/button";

export interface StudioFlyoutProps {
  readonly course: Project | null;
  readonly onOpenStudioWorkspace: () => void;
  readonly onOpenSourceFile: (fileName: string) => void;
  readonly onOpenSynthesisNote: () => void;
  readonly onStartNewSession: () => void;
}

export function StudioFlyout(props: StudioFlyoutProps) {
  const {
    course,
    onOpenStudioWorkspace,
    onOpenSourceFile,
    onOpenSynthesisNote,
    onStartNewSession,
  } = props;

  if (!course) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center p-4 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
          <SparkleIcon className="size-5" />
        </div>
        <p className="text-ui font-medium text-foreground">No active course</p>
        <p className="mt-1 text-ui-xs text-muted-foreground">
          Select or open a course to launch the Study Studio.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-3 overflow-y-auto px-2 py-1.5">
      {/* 1. Studio Status & Full Workspace Trigger */}
      <div className="rounded-lg border border-primary/25 bg-primary/5 p-3">
        <div className="flex items-center justify-between text-ui-xs font-semibold text-foreground">
          <div className="flex items-center gap-1.5">
            <SparkleIcon className="size-4 text-primary shrink-0" />
            <span>Study Studio Workspace</span>
          </div>
          <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-ui-2xs font-semibold text-primary">
            Tri-Pane
          </span>
        </div>
        <p className="mt-1 text-ui-2xs text-muted-foreground">
          Co-reading reader, living synthesis notes, and contextual Socratic tutor in one
          synchronized canvas.
        </p>
        <Button
          size="sm"
          className="mt-2.5 w-full gap-1.5 text-ui font-medium shadow-xs"
          onClick={onOpenStudioWorkspace}
        >
          <BookOpenIcon className="size-3.5" />
          <span>Launch Study Studio</span>
        </Button>
      </div>

      {/* 2. Current Session Pinned Source Stack */}
      <div className="rounded-lg border border-border/60 bg-secondary/20 p-3">
        <span className="text-ui-xs font-semibold text-foreground">Active Source Stack</span>
        <div className="mt-2 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => onOpenSourceFile("Lecture_03_Slides.pdf")}
            className="flex items-center justify-between rounded border border-border/40 bg-background/60 p-2 text-left hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <PageTextIcon className="size-3.5 text-blue-500 shrink-0" />
              <span className="truncate text-ui-xs font-medium text-foreground">
                Lecture_03_Slides.pdf
              </span>
            </div>
            <span className="text-ui-2xs text-muted-foreground shrink-0">p. 14</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenSourceFile("Lecture_03_Recording.mp3")}
            className="flex items-center justify-between rounded border border-border/40 bg-background/60 p-2 text-left hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <PlayIcon className="size-3.5 text-purple-500 shrink-0" />
              <span className="truncate text-ui-xs font-medium text-foreground">
                Lecture_03_Recording.mp3
              </span>
            </div>
            <span className="text-ui-2xs text-muted-foreground shrink-0">18:42</span>
          </button>
        </div>
      </div>

      {/* 3. Living Synthesis Note */}
      <div className="rounded-lg border border-border/60 bg-secondary/20 p-3">
        <div className="flex items-center justify-between text-ui-xs font-semibold text-foreground">
          <div className="flex items-center gap-1.5">
            <PageTextIcon className="size-3.5 text-primary shrink-0" />
            <span>Living Synthesis Note</span>
          </div>
          <button
            type="button"
            onClick={onOpenSynthesisNote}
            className="text-ui-2xs font-medium text-primary hover:underline"
          >
            Open Note
          </button>
        </div>
        <p className="mt-1 text-ui-2xs text-muted-foreground">
          Notes co-authored with Mimir containing clickable source citations.
        </p>
      </div>

      {/* 4. Anchored Margin Discussions */}
      <div className="rounded-lg border border-border/60 bg-secondary/20 p-3">
        <span className="text-ui-xs font-semibold text-foreground">Anchored Margin Threads</span>
        <div className="mt-2 flex flex-col gap-1 text-ui-xs">
          <div className="flex items-center gap-1.5 rounded p-1 text-muted-foreground hover:text-foreground">
            <ChatBubbleIcon className="size-3 text-muted-foreground shrink-0" />
            <span className="truncate">Slide 14: Goldman-Hodgkin-Katz eq</span>
          </div>
          <div className="flex items-center gap-1.5 rounded p-1 text-muted-foreground hover:text-foreground">
            <ChatBubbleIcon className="size-3 text-muted-foreground shrink-0" />
            <span className="truncate">Slide 22: Voltage-gated Na+ channels</span>
          </div>
        </div>
      </div>

      {/* 5. Quick Socratic Ask */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-ui-xs text-muted-foreground hover:text-foreground"
        onClick={onStartNewSession}
      >
        <AddPlusIcon className="size-3.5 text-primary" />
        <span>Ask Socratic Tutor Question</span>
      </Button>
    </div>
  );
}
