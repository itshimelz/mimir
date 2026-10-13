// FILE: CourseWorkspaceHome.tsx
// Purpose: Student workspace dashboard for the currently active course in Mimir.
// Layer: Web UI component
// Architecture: Single-workspace course model in Mimir.

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
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
import { readNativeApi } from "~/nativeApi";
import { type Project } from "~/types";

export interface GuidedStudyAction {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly prompt: string;
  readonly badge: string;
}

const GUIDED_STUDY_ACTIONS: ReadonlyArray<GuidedStudyAction> = [
  {
    id: "explain",
    title: "Explain a Concept",
    badge: "Socratic",
    description:
      "Deep conceptual breakdown with analogies and check-in questions to test understanding.",
    prompt:
      "Explain this concept step-by-step. Use analogies and real-world examples, and pause after the first key idea to ask a quick check-in question to test my understanding.",
  },
  {
    id: "review-inbox",
    title: "Review Materials in Inbox",
    badge: "Summarize",
    description: "Analyze slide decks, readings, and notes placed in your course Inbox/.",
    prompt:
      "Analyze the notes and files in my course Inbox/. Extract the core concepts, define key terminology, and highlight anything that might be confusing or difficult.",
  },
  {
    id: "practice-quiz",
    title: "Practice Quiz",
    badge: "Interactive",
    description: "Test yourself one question at a time with feedback before the next question.",
    prompt:
      "Quiz me on this topic one question at a time. Do not reveal the answer upfront. Wait for my response, give constructive feedback, and then ask the next question.",
  },
  {
    id: "breakdown-assignment",
    title: "Break Down Assignment",
    badge: "Roadmap",
    description: "Deconstruct complex problem sets or projects into actionable milestone steps.",
    prompt:
      "Help me understand this assignment. Break down the requirements into clear milestones and outline a step-by-step plan without doing the work for me.",
  },
];

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

  const handleOpenFolder = (subPath?: string) => {
    const api = readNativeApi();
    const target = subPath ? `${course.cwd}/${subPath}` : course.cwd;
    void api?.shell?.showInFolder(target);
  };

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenFolder()}
            className="gap-1.5"
            title="Open course folder in system file manager"
          >
            <FolderIcon className="size-4" />
            <span>Open Folder</span>
          </Button>
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
            onClick={() => onStartStudySession()}
            className="shrink-0 gap-2 shadow-sm font-medium"
          >
            <SparkleIcon className="size-5" />
            <span>Start Study Session</span>
          </Button>
        </div>
      </Card>

      {/* Guided Study Actions Grid */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-ui font-semibold text-foreground tracking-tight">
            Guided Study Actions
          </h2>
          <span className="text-ui-xs text-muted-foreground">
            Select an action to launch a focused session
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {GUIDED_STUDY_ACTIONS.map((action) => (
            <Card
              key={action.id}
              variant="plain"
              interactive={true}
              onClick={() => onStartStudySession(action.prompt)}
              className="flex flex-col justify-between p-4.5 transition-all hover:border-primary/40 hover:bg-card/90 group"
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

              <div className="flex items-center gap-1.5 text-primary text-ui-xs font-medium pt-3 mt-1 border-t border-border/40">
                <span>Begin session</span>
                <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Course Workspace Organization (Inbox & Outbox) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Inbox Dropzone Card */}
        <Card variant="plain" className="p-5 flex flex-col justify-between gap-4">
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
              Drop your course slides, PDFs, notes, problem sets, and textbook chapters into your{" "}
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
        <Card variant="plain" className="p-5 flex flex-col justify-between gap-4">
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
              All generated lessons, flashcards, practice quizzes, and summaries are structured in{" "}
              <code className="font-mono text-ui-xs bg-muted px-1 py-0.5 rounded">Outbox/</code> so
              your personal files remain clean.
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
  );
}
