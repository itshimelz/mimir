// FILE: CourseKnowledgeTree.tsx
// Purpose: Renders the structured Course Knowledge Tree inside the sidebar flyout,
//          organizing courses into Syllabus Roadmap, Modules (Source Stack, Living Notes,
//          Study Sessions, Recall Cards), and Course Library.
// Layer: Web UI component

import { useState } from "react";
import type { ProjectId, ThreadId } from "@synara/contracts";
import {
  BookIcon,
  BookOpenIcon,
  BrainIcon,
  ChatBubbleIcon,
  ChevronDownIcon,
  FolderIcon,
  PageTextIcon,
  PlayIcon,
  SparkleIcon,
  AddPlusIcon,
  CheckIcon,
} from "~/lib/icons";
import { cn } from "~/lib/utils";
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
    onReviewCards,
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
        return <PageTextIcon className="size-3.5 text-blue-500 shrink-0" />;
      case "recording":
        return <PlayIcon className="size-3.5 text-purple-500 shrink-0" />;
      case "textbook":
        return <BookIcon className="size-3.5 text-amber-500 shrink-0" />;
      case "assignment":
        return <SparkleIcon className="size-3.5 text-emerald-500 shrink-0" />;
      default:
        return <PageTextIcon className="size-3.5 text-muted-foreground shrink-0" />;
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-y-auto px-1.5 py-1">
      {/* 1. Syllabus & Milestones Summary Card */}
      <div className="mb-2 rounded-lg border border-border/60 bg-secondary/30 p-2.5">
        <div className="flex items-center justify-between text-ui-xs">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <BookOpenIcon className="size-3.5 text-primary shrink-0" />
            <span>Syllabus & Roadmap</span>
          </div>
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-ui-2xs font-semibold text-primary">
            {tree.syllabus.overallMastery}% Mastery
          </span>
        </div>
        {tree.syllabus.nextMilestone ? (
          <div className="mt-1.5 flex items-center justify-between text-ui-2xs text-muted-foreground">
            <span className="truncate">{tree.syllabus.nextMilestone.name}</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400 shrink-0">
              {tree.syllabus.nextMilestone.date}
            </span>
          </div>
        ) : null}
      </div>

      {/* 2. Modules / Weekly Tree */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between px-1 text-ui-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Weekly Knowledge Modules</span>
          <button
            type="button"
            onClick={() => onStartNewStudySession()}
            className="flex items-center gap-1 text-primary hover:underline"
            title="Start new study session"
          >
            <AddPlusIcon className="size-3" />
            <span>New Session</span>
          </button>
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
                className="flex w-full items-center justify-between gap-2 p-2 text-left hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-md"
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

                <div className="flex items-center gap-1 shrink-0">
                  {mod.mastery.dueCards > 0 ? (
                    <span
                      title={`${mod.mastery.dueCards} cards due for recall`}
                      className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-ui-2xs font-semibold text-amber-600 dark:text-amber-400"
                    >
                      {mod.mastery.dueCards} due
                    </span>
                  ) : (
                    <span
                      title="Mastery Retrievability"
                      className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-ui-2xs font-semibold text-emerald-600 dark:text-emerald-400"
                    >
                      {mod.mastery.retrievability}%
                    </span>
                  )}
                </div>
              </button>

              {/* Collapsible Module Details */}
              <div
                className={cn(
                  DISCLOSURE_SHELL_MOTION_CLASS,
                  isExpanded ? DISCLOSURE_SHELL_OPEN_CLASS : DISCLOSURE_SHELL_CLOSED_CLASS,
                )}
              >
                <div className={cn(DISCLOSURE_INNER_CLASS, "flex flex-col gap-2 p-2 pt-0")}>
                  {/* Canonical Source Stack */}
                  <div className="flex flex-col gap-1 rounded bg-secondary/20 p-1.5">
                    <span className="text-ui-2xs font-medium text-muted-foreground">
                      Source Stack ({mod.sourceStack.length})
                    </span>
                    {mod.sourceStack.length === 0 ? (
                      <span className="text-ui-2xs italic text-muted-foreground/80">
                        Drop slides or textbook chapters here
                      </span>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        {mod.sourceStack.map((src) => (
                          <button
                            key={src.id}
                            type="button"
                            onClick={() => onOpenSourceItem(src)}
                            className="flex items-center gap-1.5 rounded px-1.5 py-1 text-left text-ui-xs hover:bg-secondary/60 transition-colors"
                          >
                            {renderSourceKindIcon(src.kind)}
                            <span className="truncate flex-1 text-foreground">{src.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Living Synthesis Note */}
                  <div className="flex items-center justify-between rounded bg-secondary/20 p-1.5 text-ui-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <PageTextIcon className="size-3.5 text-primary shrink-0" />
                      <span className="truncate text-foreground font-medium">
                        {mod.synthesisNote
                          ? mod.synthesisNote.name
                          : `Week ${mod.weekNumber} Synthesis Note`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenSynthesisNote(
                          mod.synthesisNote?.path ?? `Outbox/Notes/Week_${mod.weekNumber}_Notes.md`,
                        )
                      }
                      className="text-ui-2xs font-semibold text-primary hover:underline shrink-0"
                    >
                      {mod.synthesisNote ? "Open Note" : "Create Note"}
                    </button>
                  </div>

                  {/* Anchored Study Sessions */}
                  {mod.studySessions.length > 0 ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-ui-2xs font-medium text-muted-foreground px-1">
                        Study Sessions ({mod.studySessions.length})
                      </span>
                      {mod.studySessions.map((session) => (
                        <button
                          key={session.threadId}
                          type="button"
                          onClick={() => onOpenStudySession(session.threadId)}
                          className="flex items-center gap-1.5 rounded px-1.5 py-0.5 text-left text-ui-xs text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
                        >
                          <ChatBubbleIcon className="size-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{session.title}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {/* Active Recall Deck Trigger */}
                  <div className="flex items-center justify-between border-t border-border/40 pt-1.5 text-ui-2xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BrainIcon className="size-3 text-primary shrink-0" />
                      <span>{mod.mastery.totalCards} Flashcards</span>
                    </div>
                    {onReviewCards ? (
                      <button
                        type="button"
                        onClick={() => onReviewCards(mod.id)}
                        className="font-medium text-primary hover:underline"
                      >
                        Drill Recall
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Course Library Drawers */}
      <div className="mt-3 flex flex-col gap-1 border-t border-border/60 pt-2">
        <span className="px-1 text-ui-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          Course Library
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onOpenLibraryFolder("Inbox")}
            className="flex items-center gap-1.5 rounded-md border border-border/40 bg-secondary/20 p-2 text-left hover:bg-secondary/50 transition-colors"
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
            className="flex items-center gap-1.5 rounded-md border border-border/40 bg-secondary/20 p-2 text-left hover:bg-secondary/50 transition-colors"
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
