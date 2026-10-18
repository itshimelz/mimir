// FILE: CourseKnowledgeTree.tsx
// Purpose: Renders the structured Course Knowledge Tree inside the sidebar flyout,
//          organizing courses into Syllabus Roadmap, Modules (Source Stack, Living Notes,
//          Study Sessions), and Course Library drawers.
// Layer: Web UI component

import { useState } from "react";
import type { ThreadId } from "@synara/contracts";
import {
  BookIcon,
  BookOpenIcon,
  ChatBubbleIcon,
  ChevronDownIcon,
  FolderIcon,
  PageTextIcon,
  PlayIcon,
  SparkleIcon,
  AddPlusIcon,
} from "~/lib/icons";
import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardAction, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import {
  DISCLOSURE_CHEVRON_MOTION_CLASS,
  DISCLOSURE_INNER_CLASS,
  DISCLOSURE_SHELL_CLOSED_CLASS,
  DISCLOSURE_SHELL_MOTION_CLASS,
  DISCLOSURE_SHELL_OPEN_CLASS,
} from "~/lib/disclosureMotion";
import type {
  CourseKnowledgeTree as CourseTreeType,
  CourseModule,
  CourseSourceItem,
} from "~/lib/courseTree";

export interface CourseKnowledgeTreeProps {
  readonly tree: CourseTreeType;
  readonly onOpenSourceItem: (item: CourseSourceItem) => void;
  readonly onOpenSynthesisNote: (path: string) => void;
  readonly onOpenStudySession: (threadId: ThreadId) => void;
  readonly onStartNewStudySession: (weekNumber?: number) => void;
  readonly onOpenLibraryFolder: (folder: "Inbox" | "Outbox") => void;
  readonly onReviewCards?: (moduleId: string) => void;
}

export function CourseKnowledgeTree(props: CourseKnowledgeTreeProps) {
  const {
    tree,
    onOpenSourceItem,
    onOpenSynthesisNote,
    onOpenStudySession,
    onStartNewStudySession,
    onOpenLibraryFolder,
  } = props;

  // Track expanded weeks (default Week 1 expanded)
  const [expandedWeeks, setExpandedWeeks] = useState<ReadonlySet<number>>(new Set([1]));

  const toggleWeek = (weekNum: number) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekNum)) {
        next.delete(weekNum);
      } else {
        next.add(weekNum);
      }
      return next;
    });
  };

  const renderSourceKindIcon = (kind: CourseSourceItem["kind"]) => {
    switch (kind) {
      case "slides":
        return <PageTextIcon className="size-3.5 text-primary shrink-0" />;
      case "recording":
        return <PlayIcon className="size-3.5 text-primary shrink-0" />;
      case "textbook":
        return <BookIcon className="size-3.5 text-primary shrink-0" />;
      case "assignment":
        return <SparkleIcon className="size-3.5 text-primary shrink-0" />;
      default:
        return <PageTextIcon className="size-3.5 text-muted-foreground shrink-0" />;
    }
  };

  if (tree.modules.length === 0) {
    return (
      <Empty className="h-full flex-1 p-4">
        <EmptyMedia variant="icon">
          <BookOpenIcon className="size-4.5" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle className="text-ui font-semibold">No course modules</EmptyTitle>
          <EmptyDescription className="text-ui-xs">
            Add lecture slides or course files to your course folder to organize them into modules.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-3 overflow-y-auto px-2 py-1.5">
      {/* 1. Syllabus Roadmap Card */}
      <Card variant="plain" size="sm" className="gap-2">
        <CardHeader>
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <BookOpenIcon className="size-3.5 text-primary shrink-0" />
            <CardTitle className="text-ui-xs font-semibold">Syllabus & Roadmap</CardTitle>
          </div>
          {tree.syllabus.fileName ? (
            <CardAction>
              <Badge variant="outline" size="sm">
                {tree.syllabus.fileName}
              </Badge>
            </CardAction>
          ) : null}
          {tree.syllabus.nextMilestone ? (
            <div className="mt-1 flex items-center justify-between text-ui-2xs text-muted-foreground">
              <span className="truncate">{tree.syllabus.nextMilestone.name}</span>
              <span className="font-semibold text-primary shrink-0 ms-1">
                {tree.syllabus.nextMilestone.date}
              </span>
            </div>
          ) : null}
        </CardHeader>
      </Card>

      {/* 2. Modules / Weekly Tree */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-1 text-ui-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Weekly Knowledge Modules</span>
          <Button
            variant="ghost"
            size="chip"
            onClick={() => onStartNewStudySession()}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-primary hover:bg-muted/50 hover:text-primary transition-colors"
            title="Start new study session"
          >
            <AddPlusIcon className="size-3" />
            <span>New Session</span>
          </Button>
        </div>

        {tree.modules.map((mod: CourseModule) => {
          const isExpanded = expandedWeeks.has(mod.weekNumber);
          return (
            <div
              key={mod.id}
              className="flex flex-col rounded-md border border-border/40 bg-card/40 transition-colors"
            >
              {/* Module Header Bar */}
              <button
                type="button"
                onClick={() => toggleWeek(mod.weekNumber)}
                className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-md transition-colors"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <ChevronDownIcon
                    className={cn(DISCLOSURE_CHEVRON_MOTION_CLASS, !isExpanded && "-rotate-90")}
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-ui-xs font-semibold text-foreground">
                      {mod.title}
                    </span>
                    <span className="truncate text-ui-2xs text-muted-foreground">
                      {mod.description}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ms-1">
                  {mod.sourceStack.length > 0 ? (
                    <Badge variant="secondary" size="sm">
                      {mod.sourceStack.length}
                    </Badge>
                  ) : null}
                </div>
              </button>

              {/* Collapsible Module Details */}
              <div
                className={cn(
                  DISCLOSURE_SHELL_MOTION_CLASS,
                  isExpanded ? DISCLOSURE_SHELL_OPEN_CLASS : DISCLOSURE_SHELL_CLOSED_CLASS,
                )}
              >
                <div className={cn(DISCLOSURE_INNER_CLASS, "flex flex-col gap-2 px-2.5 pb-2.5")}>
                  {/* Canonical Source Stack */}
                  <div className="flex flex-col gap-1 rounded-md bg-muted/30 p-2">
                    <span className="text-ui-2xs font-medium text-muted-foreground">
                      Source Stack ({mod.sourceStack.length})
                    </span>
                    {mod.sourceStack.length === 0 ? (
                      <span className="text-ui-2xs text-muted-foreground">
                        No materials added yet
                      </span>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        {mod.sourceStack.map((src) => (
                          <button
                            key={src.id}
                            type="button"
                            onClick={() => onOpenSourceItem(src)}
                            className="flex items-center gap-2 rounded px-2 py-1 text-left text-ui-xs hover:bg-muted/60 transition-colors"
                          >
                            {renderSourceKindIcon(src.kind)}
                            <span className="truncate flex-1 text-foreground">{src.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Living Synthesis Note */}
                  <div className="flex items-center justify-between rounded-md bg-muted/30 px-2 py-1.5 text-ui-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <PageTextIcon className="size-3.5 text-primary shrink-0" />
                      <span className="truncate text-foreground font-medium">
                        {mod.synthesisNote
                          ? mod.synthesisNote.name
                          : `Week ${mod.weekNumber} Synthesis Note`}
                      </span>
                    </div>
                    <Button
                      variant="link"
                      size="chip"
                      onClick={() =>
                        onOpenSynthesisNote(
                          mod.synthesisNote?.path ?? `Outbox/Notes/Week_${mod.weekNumber}_Notes.md`,
                        )
                      }
                      className="text-ui-2xs font-semibold text-primary hover:underline shrink-0 h-auto p-0 ms-1.5"
                    >
                      {mod.synthesisNote ? "Open" : "Create"}
                    </Button>
                  </div>

                  {/* Anchored Study Sessions */}
                  {mod.studySessions.length > 0 ? (
                    <div className="flex flex-col gap-0.5 pt-0.5">
                      <span className="text-ui-2xs font-medium text-muted-foreground px-2">
                        Study Sessions ({mod.studySessions.length})
                      </span>
                      {mod.studySessions.map((session) => (
                        <button
                          key={session.threadId}
                          type="button"
                          onClick={() => onOpenStudySession(session.threadId)}
                          className="flex items-center gap-2 rounded px-2 py-1 text-left text-ui-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                        >
                          <ChatBubbleIcon className="size-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{session.title}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Course Library Drawers */}
      <div className="mt-4 flex flex-col gap-1.5 border-t border-border/30 pt-3">
        <span className="px-1 text-ui-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          Course Library
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onOpenLibraryFolder("Inbox")}
            className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/20 p-2 text-left hover:bg-muted/50 transition-colors"
          >
            <FolderIcon className="size-3.5 text-primary shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-ui-xs font-medium text-foreground">Inbox/</span>
              <span className="text-ui-2xs text-muted-foreground">
                {tree.inboxFiles.length} files
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onOpenLibraryFolder("Outbox")}
            className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/20 p-2 text-left hover:bg-muted/50 transition-colors"
          >
            <SparkleIcon className="size-3.5 text-primary shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-ui-xs font-medium text-foreground">Outbox/</span>
              <span className="text-ui-2xs text-muted-foreground">{tree.outboxCount} outputs</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
