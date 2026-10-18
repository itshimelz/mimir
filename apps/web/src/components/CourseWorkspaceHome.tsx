// FILE: CourseWorkspaceHome.tsx
// Purpose: Student workspace dashboard for the currently active course in Mimir.
// Layer: Web UI component
// Architecture: Single-workspace course model in Mimir.

import { useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  ArrowRightIcon,
  BookOpenIcon,
  BrainIcon,
  CalendarIcon,
  FolderIcon,
  PageTextIcon,
  PlayIcon,
  SparkleIcon,
} from "~/lib/icons";
import {
  type CourseStudyActionConfig,
  COURSE_STUDY_ACTIONS,
  buildCourseStudyPrompt,
} from "~/lib/courseStudyPrompts";
import { RouteSurfaceHeader } from "~/components/RouteSurface";
import { useEditorSurfaceStore } from "~/editorSurfaceStore";
import { useRailShellStore } from "~/railShellStore";
import { readNativeApi } from "~/nativeApi";
import { type Project } from "~/types";

const OUTBOX_CATEGORIES = [
  { name: "Lessons", desc: "Breakdowns & milestones" },
  { name: "Quizzes", desc: "Practice & flashcards" },
  { name: "Notes", desc: "Consolidated summaries" },
  { name: "Assignments", desc: "Worksheets & checklists" },
  { name: "Handouts", desc: "Quick cheat-sheets" },
  { name: "References", desc: "Citations & indices" },
] as const;

export function CourseWorkspaceHome(props: {
  readonly course: Project;
  readonly onStartStudySession: (initialPrompt?: string) => void;
  readonly onSwitchCourse?: () => void;
  readonly onOpenEditor?: (filePath?: string) => void;
  readonly onOpenStudio?: (filePath?: string) => void;
}) {
  const { course, onStartStudySession, onSwitchCourse, onOpenEditor, onOpenStudio } = props;

  const [selectedActionForTopic, setSelectedActionForTopic] =
    useState<CourseStudyActionConfig | null>(null);
  const [customTopic, setCustomTopic] = useState("");

  const handleResumeReading = (filePath: string) => {
    useRailShellStore.getState().selectPanelItem("studio");
    useEditorSurfaceStore.getState().setSurface("studio");
    if (onOpenStudio) {
      onOpenStudio(filePath);
    } else if (onOpenEditor) {
      onOpenEditor(filePath);
    } else {
      const api = readNativeApi();
      if (api?.shell?.showInFolder) {
        void api.shell.showInFolder(`${course.cwd}/${filePath}`);
      }
    }
  };

  const handleOpenFolder = (subPath?: string) => {
    const api = readNativeApi();
    if (api?.shell?.showInFolder) {
      const target = subPath ? `${course.cwd}/${subPath}` : course.cwd;
      void api.shell.showInFolder(target);
    } else if (onOpenStudio && subPath === "Outbox") {
      useRailShellStore.getState().selectPanelItem("studio");
      useEditorSurfaceStore.getState().setSurface("studio");
      onOpenStudio();
    } else if (onOpenEditor) {
      if (subPath === "Outbox") {
        useEditorSurfaceStore.getState().setSurface("studio");
      } else {
        useEditorSurfaceStore.getState().setSurface("study");
      }
      onOpenEditor();
    }
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <RouteSurfaceHeader divider className="shrink-0">
        <div className="flex items-center gap-2 text-ui-xs">
          <BookOpenIcon className="size-4 text-primary shrink-0" />
          <span className="font-semibold text-foreground">Today&apos;s Study Briefing</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground truncate">{course.name}</span>
        </div>
      </RouteSurfaceHeader>

      <div className="flex min-h-0 flex-1 w-full flex-col overflow-y-auto">
        <div className="flex w-full flex-col p-6 md:p-10 max-w-5xl mx-auto gap-8">
          {/* Course Header & Primary Navigation */}
          <div className="shrink-0 flex flex-col gap-4 border-b border-border/60 pb-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-ui-2xs font-medium">
                  Active Course
                </Badge>
              </div>
              <h1 className="font-heading font-bold text-2xl md:text-3xl tracking-tight text-foreground">
                {course.name}
              </h1>
              <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-ui-xs">
                <FolderIcon className="size-3.5 shrink-0" />
                <span className="truncate">{course.cwd}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onOpenEditor && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenEditor()}
                  className="gap-1.5 text-ui-xs font-medium shadow-2xs hover:border-primary/40 hover:bg-primary/5"
                >
                  <BookOpenIcon className="size-4 text-primary" />
                  <span>Course Files</span>
                </Button>
              )}
              {onSwitchCourse && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSwitchCourse}
                  className="gap-1.5 text-ui-xs"
                >
                  <span>Switch Course</span>
                </Button>
              )}
            </div>
          </div>

          {/* Exam Countdown & Readiness Banner */}
          <div className="shrink-0 relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card/90 to-secondary/10 p-6 md:p-8 shadow-xs">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <CalendarIcon className="size-4" />
                  </div>
                  <span className="font-heading font-semibold text-ui-lg text-foreground">
                    Midterm 1 in 5 Days (Thursday, Oct 24)
                  </span>
                  <Badge variant="outline" className="text-ui-2xs font-normal">
                    Weight: 25%
                  </Badge>
                </div>
                <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-ui-xs font-semibold">
                  <BrainIcon className="size-3 text-primary" />
                  <span>Readiness: 74% (B+) • 12/16 Mastered</span>
                </Badge>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-1">
                <div className="flex flex-col gap-2 max-w-2xl">
                  <h2 className="font-heading font-bold text-xl md:text-2xl text-foreground tracking-tight">
                    Ready to begin studying?
                  </h2>
                  <p className="text-ui text-muted-foreground leading-relaxed">
                    Hodgkin-Huxley gating variables and voltage-dependent potassium kinetics have
                    your lowest memory stability. 15 minutes of active retrieval practice today
                    prevents pre-exam decay.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="default"
                    onClick={() => onStartStudySession()}
                    className="gap-2 font-medium shadow-sm"
                  >
                    <SparkleIcon className="size-4.5" />
                    <span>Start Study Session</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onStartStudySession(
                        "Conduct a 15-minute high-yield Socratic review for Midterm 1 covering Hodgkin-Huxley gating variables and ion channel kinetics.",
                      )
                    }
                    className="gap-1.5 text-ui-xs font-medium"
                  >
                    <PlayIcon className="size-3.5 text-primary" />
                    <span>15-Min High-Yield Review</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Study Queue: Resume Reading & Due Spaced Retrieval */}
          <div className="shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card A: Resume Active Reading & Synthesis (1-Click Jump to Studio) */}
            <Card variant="plain" className="shrink-0 p-5 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-primary/10 text-primary">
                      <PageTextIcon className="size-4" />
                    </div>
                    <div>
                      <CardTitle className="text-ui font-semibold text-foreground">
                        Resume Active Reading
                      </CardTitle>
                      <CardDescription className="text-ui-2xs text-muted-foreground">
                        Tri-Pane Studio with margin tutor &amp; notes
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-ui-2xs font-mono">
                    Cmd+3
                  </Badge>
                </div>

                <div className="flex flex-col gap-1.5 rounded-lg border border-border/50 bg-muted/20 p-3">
                  <div className="flex items-center justify-between text-ui-xs font-medium text-foreground">
                    <span className="truncate">Lecture_03_Hodgkin_Huxley_Model.md</span>
                    <Badge variant="secondary" className="text-ui-2xs font-normal">
                      Active
                    </Badge>
                  </div>
                  <p className="text-ui-2xs text-muted-foreground">
                    Bookmark: Section 3.2 — Sodium Gating &amp; Inactivation
                  </p>
                </div>

                <div className="flex flex-col gap-1 text-ui-2xs text-muted-foreground">
                  <span className="font-medium text-foreground">Other Course Sources:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleResumeReading("Lecture_02_Action_Potentials_and_Voltage_Gating.md")
                      }
                      className="rounded border border-border/60 bg-muted/30 px-2 py-0.5 text-left hover:bg-muted/60 transition-colors"
                    >
                      Lecture 02: Voltage Gating
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleResumeReading("Problem_Set_02_Hodgkin_Huxley_Kinetics.md")
                      }
                      className="rounded border border-border/60 bg-muted/30 px-2 py-0.5 text-left hover:bg-muted/60 transition-colors"
                    >
                      Problem Set 2
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResumeReading("Syllabus.md")}
                      className="rounded border border-border/60 bg-muted/30 px-2 py-0.5 text-left hover:bg-muted/60 transition-colors"
                    >
                      Syllabus
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border/40">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleResumeReading("Lecture_03_Hodgkin_Huxley_Model.md")}
                  className="w-full gap-2 text-ui-xs font-medium shadow-xs"
                >
                  <PlayIcon className="size-3.5" />
                  <span>Resume Reading in Studio</span>
                </Button>
              </div>
            </Card>

            {/* Card B: Spaced Retrieval & FSRS Queue */}
            <Card variant="plain" className="shrink-0 p-5 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-primary/10 text-primary">
                      <BrainIcon className="size-4" />
                    </div>
                    <div>
                      <CardTitle className="text-ui font-semibold text-foreground">
                        Spaced Retrieval Queue
                      </CardTitle>
                      <CardDescription className="text-ui-2xs text-muted-foreground">
                        FSRS DSR memory decay tracker
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-ui-2xs font-semibold text-primary">
                    8 Due
                  </Badge>
                </div>

                <div className="flex flex-col gap-1.5 rounded-lg border border-border/50 bg-muted/20 p-2.5 text-ui-2xs">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-foreground font-medium">
                      Resting Membrane Potential (GHK)
                    </span>
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
                      R: 72% • S: 2.1d
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="truncate text-foreground font-medium">
                      Voltage-Gated K⁺ Channel Kinetics
                    </span>
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
                      R: 68% • S: 1.9d
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="truncate text-foreground font-medium">
                      Nernst vs. GHK Steady-State
                    </span>
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
                      R: 64% • S: 1.5d
                    </span>
                  </div>
                </div>

                <p className="text-ui-2xs text-muted-foreground leading-relaxed">
                  Lock in decaying concepts before the threshold drops below 85% retrievability.
                </p>
              </div>

              <div className="pt-2 border-t border-border/40">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onStartStudySession(
                      "Quiz me on my due FSRS active recall queue for this course. Start with the most decayed concept (Nernst vs. Goldman-Hodgkin-Katz equation), asking one question at a time without spoiling the answer.",
                    )
                  }
                  className="w-full gap-2 text-ui-xs font-medium shadow-xs"
                >
                  <SparkleIcon className="size-3.5 text-primary" />
                  <span>Start 5-Minute Recall Drill</span>
                </Button>
              </div>
            </Card>
          </div>

          {/* Guided Study Actions Grid */}
          <div className="shrink-0 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-ui font-semibold text-foreground tracking-tight">
                Guided Study Actions
              </h2>
              <span className="text-ui-xs text-muted-foreground">
                Select an action to launch a focused session
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {COURSE_STUDY_ACTIONS.map((action) => (
                <Card
                  key={action.id}
                  variant="plain"
                  interactive={true}
                  onClick={() => onStartStudySession(action.defaultPrompt)}
                  className="shrink-0 flex flex-col justify-between p-4.5 transition-all hover:border-primary/40 hover:bg-card/90 group"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-ui font-semibold text-foreground group-hover:text-primary transition-colors">
                        {action.title}
                      </span>
                      <Badge variant="outline" className="text-ui-2xs font-normal">
                        {action.badge}
                      </Badge>
                    </div>
                    <p className="text-ui-xs text-muted-foreground leading-relaxed">
                      {action.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-1 border-t border-border/40">
                    <Button
                      variant="ghost"
                      size="xs"
                      aria-label={`Specify topic for ${action.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedActionForTopic(action);
                        setCustomTopic("");
                      }}
                      className="text-muted-foreground hover:text-foreground text-ui-xs font-normal h-6 px-2"
                    >
                      Specify topic...
                    </Button>

                    <div className="flex items-center gap-1 text-primary text-ui-xs font-medium">
                      <span>Begin session</span>
                      <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Specify Topic Dialog */}
          <Dialog
            open={selectedActionForTopic !== null}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedActionForTopic(null);
                setCustomTopic("");
              }
            }}
          >
            <DialogPopup className="max-w-md overflow-hidden">
              {selectedActionForTopic && (
                <>
                  <DialogHeader className="px-6 pt-6 pb-2">
                    <div className="flex items-center gap-2 text-primary">
                      <SparkleIcon className="size-5" />
                      <DialogTitle>{selectedActionForTopic.title}</DialogTitle>
                    </div>
                    <DialogDescription className="text-ui-sm text-muted-foreground mt-1.5 leading-relaxed">
                      Optionally specify a concept, reading, or assignment to tailor your Socratic
                      study session.
                    </DialogDescription>
                  </DialogHeader>

                  <DialogPanel className="px-6 py-2">
                    <form
                      id="specify-topic-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const prompt = buildCourseStudyPrompt(
                          selectedActionForTopic.id,
                          customTopic.trim() || undefined,
                        );
                        onStartStudySession(prompt);
                        setSelectedActionForTopic(null);
                        setCustomTopic("");
                      }}
                      className="flex flex-col gap-3"
                    >
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="course-study-topic-input"
                          className="text-ui-xs font-medium text-foreground"
                        >
                          Topic or Focus Area (optional)
                        </label>
                        <Input
                          id="course-study-topic-input"
                          aria-label="Topic or Focus Area (optional)"
                          value={customTopic}
                          onChange={(e) => setCustomTopic(e.target.value)}
                          placeholder={selectedActionForTopic.placeholder}
                          autoFocus
                          className="text-ui"
                        />
                        <p className="text-ui-xs text-muted-foreground">
                          Leave blank to start with the standard guided prompt.
                        </p>
                      </div>
                    </form>
                  </DialogPanel>

                  <DialogFooter className="px-6 pb-6 pt-3">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setSelectedActionForTopic(null);
                        setCustomTopic("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      form="specify-topic-form"
                      type="submit"
                      variant="default"
                      className="gap-1.5"
                    >
                      <SparkleIcon className="size-4" />
                      <span>Start Session</span>
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogPopup>
          </Dialog>

          {/* Course Workspace Organization (Inbox & Outbox) */}
          <div className="shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
            {/* Inbox Dropzone Card */}
            <Card variant="plain" className="shrink-0 p-5 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-secondary/30 text-foreground/80">
                      <FolderIcon className="size-4" />
                    </div>
                    <CardTitle className="text-ui font-semibold text-foreground">
                      Course Inbox
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-ui-2xs font-mono">
                    Inbox/
                  </Badge>
                </div>
                <CardDescription className="text-ui-xs text-muted-foreground leading-relaxed">
                  Drop your course slides, PDFs, notes, problem sets, and textbook chapters into
                  your{" "}
                  <code className="font-mono text-ui-xs bg-muted px-1 py-0.5 rounded">Inbox/</code>{" "}
                  folder. Your tutor will read and reference them directly.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenFolder("Inbox")}
                  className="gap-1.5 text-ui-xs"
                >
                  <FolderIcon className="size-3.5" />
                  <span>Open Inbox Folder</span>
                </Button>
              </div>
            </Card>

            {/* Deliverables (Outbox) Card */}
            <Card variant="plain" className="shrink-0 p-5 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-secondary/30 text-foreground/80">
                      <BookOpenIcon className="size-4" />
                    </div>
                    <CardTitle className="text-ui font-semibold text-foreground">
                      Study Deliverables
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-ui-2xs font-mono">
                    Outbox/
                  </Badge>
                </div>
                <CardDescription className="text-ui-xs text-muted-foreground leading-relaxed">
                  All generated lessons, flashcards, practice quizzes, and summaries are structured
                  in{" "}
                  <code className="font-mono text-ui-xs bg-muted px-1 py-0.5 rounded">Outbox/</code>{" "}
                  so your personal files remain clean.
                </CardDescription>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {OUTBOX_CATEGORIES.map((cat) => (
                    <span
                      key={cat.name}
                      className="rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 text-ui-2xs text-muted-foreground"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenFolder("Outbox")}
                  className="gap-1.5 text-ui-xs"
                >
                  <BookOpenIcon className="size-3.5" />
                  <span>Open Outbox Folder</span>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
