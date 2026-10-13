// FILE: CourseWorkspaceHome.tsx
// Purpose: Student workspace dashboard for the currently active course in Mimir.
// Layer: Web UI component
// Architecture: Single-workspace course model in Mimir.

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { BookOpenIcon, FolderIcon, SparkleIcon } from "~/lib/icons";
import { type Project } from "~/types";

export function CourseWorkspaceHome(props: {
  readonly course: Project;
  readonly onStartStudySession: () => void;
  readonly onSwitchCourse?: () => void;
  readonly onOpenEditor?: () => void;
}) {
  const { course, onStartStudySession, onSwitchCourse, onOpenEditor } = props;

  return (
    <div className="flex min-h-screen w-full flex-col p-6 md:p-10 max-w-5xl mx-auto gap-8">
      {/* Top Bar Navigation / Metadata */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-ui-2xs font-medium">
              Course Workspace
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
            <Button variant="outline" size="sm" onClick={onOpenEditor} className="gap-1.5">
              <BookOpenIcon className="size-4" />
              <span>Course Files</span>
            </Button>
          )}
          {onSwitchCourse && (
            <Button variant="outline" size="sm" onClick={onSwitchCourse} className="gap-1.5">
              <span>Switch Course</span>
            </Button>
          )}
        </div>
      </div>

      {/* Hero Study Action */}
      <Card
        variant="raised"
        className="relative overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/8 via-card to-secondary/15 p-6 md:p-8"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="flex items-center gap-2 text-primary font-semibold text-ui-sm">
              <SparkleIcon className="size-4.5" />
              <span>Agentic Co-Learner Ready</span>
            </div>
            <CardTitle className="font-heading font-bold text-xl md:text-2xl text-foreground">
              Ready to begin studying?
            </CardTitle>
            <CardDescription className="text-ui text-muted-foreground leading-relaxed">
              Ask questions about lecture materials, review your syllabus, practice quizzes one
              question at a time, or clarify confusing concepts with your Mimir tutor.
            </CardDescription>
          </div>

          <Button
            size="lg"
            variant="default"
            onClick={onStartStudySession}
            className="shrink-0 gap-2 shadow-sm font-medium"
          >
            <SparkleIcon className="size-5" />
            <span>Start Study Session</span>
          </Button>
        </div>
      </Card>

      {/* Structured Co-Learning Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Inbox Overview */}
        <Card variant="plain" className="p-5 flex flex-col gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-secondary/30 text-foreground/80">
            <FolderIcon className="size-4.5" />
          </div>
          <CardTitle className="text-ui-lg font-semibold text-foreground">Course Inbox</CardTitle>
          <CardDescription className="text-ui-sm text-muted-foreground leading-snug">
            Place your lecture slides, PDFs, notes, and readings in{" "}
            <code className="font-mono text-ui-xs bg-muted px-1 py-0.5 rounded">Inbox/</code> for
            your tutor to inspect.
          </CardDescription>
        </Card>

        {/* Outbox Overview */}
        <Card variant="plain" className="p-5 flex flex-col gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-secondary/30 text-foreground/80">
            <BookOpenIcon className="size-4.5" />
          </div>
          <CardTitle className="text-ui-lg font-semibold text-foreground">
            Study Deliverables
          </CardTitle>
          <CardDescription className="text-ui-sm text-muted-foreground leading-snug">
            Generated notes, flashcard quizzes, and lesson summaries are safely organized in{" "}
            <code className="font-mono text-ui-xs bg-muted px-1 py-0.5 rounded">Outbox/</code>.
          </CardDescription>
        </Card>

        {/* Co-Learning Pedagogy */}
        <Card variant="plain" className="p-5 flex flex-col gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-secondary/30 text-foreground/80">
            <SparkleIcon className="size-4.5" />
          </div>
          <CardTitle className="text-ui-lg font-semibold text-foreground">
            Socratic Guidance
          </CardTitle>
          <CardDescription className="text-ui-sm text-muted-foreground leading-snug">
            Mimir encourages active learning by asking check-in questions and guiding your
            problem-solving step by step.
          </CardDescription>
        </Card>
      </div>
    </div>
  );
}
