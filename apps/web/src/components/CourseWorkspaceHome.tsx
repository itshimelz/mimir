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
  CheckIcon,
  CircleQuestionIcon,
  FolderIcon,
  LightbulbIcon,
  PageTextIcon,
  SparkleIcon,
} from "~/lib/icons";
import {
  type CourseStudyActionConfig,
  COURSE_STUDY_ACTIONS,
  buildCourseStudyPrompt,
} from "~/lib/courseStudyPrompts";
import { RouteSurfaceHeader } from "~/components/RouteSurface";
import { useEditorSurfaceStore } from "~/editorSurfaceStore";
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
  readonly onOpenEditor?: () => void;
}) {
  const { course, onStartStudySession, onSwitchCourse, onOpenEditor } = props;

  const [selectedActionForTopic, setSelectedActionForTopic] =
    useState<CourseStudyActionConfig | null>(null);
  const [customTopic, setCustomTopic] = useState("");

  const handleOpenFolder = (subPath?: string) => {
    const api = readNativeApi();
    if (api?.shell?.showInFolder) {
      const target = subPath ? `${course.cwd}/${subPath}` : course.cwd;
      void api.shell.showInFolder(target);
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
          <span className="font-semibold text-foreground">Course Overview</span>
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
                  onClick={onOpenEditor}
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

          {/* Hero Study Action */}
          <div className="shrink-0 relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card/90 to-secondary/10 p-6 md:p-8 shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex flex-col gap-2.5 max-w-xl">
                <div className="inline-flex items-center gap-2 text-primary font-semibold text-ui-sm">
                  <SparkleIcon className="size-4" />
                  <span>Agentic Co-Learner Ready</span>
                </div>
                <h2 className="font-heading font-bold text-xl md:text-2xl text-foreground tracking-tight">
                  Ready to begin studying?
                </h2>
                <p className="text-ui text-muted-foreground leading-relaxed">
                  Ask questions about lecture materials, review your syllabus, practice quizzes one
                  question at a time, or clarify confusing concepts with your Mimir tutor.
                </p>
              </div>

              <Button
                size="lg"
                variant="default"
                onClick={() => onStartStudySession()}
                className="shrink-0 gap-2 font-medium shadow-sm"
              >
                <SparkleIcon className="size-4.5" />
                <span>Start Study Session</span>
              </Button>
            </div>
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
