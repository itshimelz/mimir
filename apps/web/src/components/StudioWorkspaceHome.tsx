// FILE: StudioWorkspaceHome.tsx
// Purpose: Dedicated workspace canvas for Pillar 3: Study Studio (/studio, Cmd+3).
//          Presents pedagogical study modes and launches co-reading sessions.
// Layer: Web UI component

import type { Project } from "~/types";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { RouteSurfaceHeader } from "~/components/RouteSurface";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { FolderIcon, PlayIcon, SparkleIcon } from "~/lib/icons";

export interface StudioWorkspaceHomeProps {
  readonly course: Project | null;
  readonly onStartStudySession: (initialPrompt?: string) => void;
  readonly onOpenEditor: () => void;
  readonly onOpenStudioCanvas?: (() => void) | undefined;
}

const PEDAGOGICAL_MODES = [
  {
    id: "socratic",
    name: "Socratic Co-Reader",
    badge: "Guided",
    desc: "Co-read lecture slides and readings side-by-side. Never gives the answer upfront—guides you step-by-step through questions.",
    prompt:
      "I am co-reading my course materials. Act as my Socratic tutor: do not spoil direct answers, guide me with progressive questions, and test my comprehension.",
  },
  {
    id: "feynman",
    name: "Feynman Teach-Back",
    badge: "Evaluation",
    desc: "Explain a concept in your own words. Mimir cross-checks against the slides, flagging missed nuances and misconceptions.",
    prompt:
      "I want to explain a concept in my own words using the Feynman technique. Listen to my explanation, point out any misconceptions, and highlight what the professor's slides emphasized that I missed.",
  },
  {
    id: "verifier",
    name: "Problem Verifier",
    badge: "Step-Checked",
    desc: "Verify problem-solving derivations line-by-line using a progressive hint ladder without giving away the final answer.",
    prompt:
      "Verify my problem-solving steps line-by-line. If I make an error, do not give away the solution—give me a Tier 1 conceptual nudge.",
  },
  {
    id: "synthesizer",
    name: "Note Synthesizer",
    badge: "Citations",
    desc: "Co-author structured synthesis notes with direct source citations anchored to your slides and readings.",
    prompt:
      "Help me co-author a structured synthesis note for this module. Include key definitions, formulas, comparison tables, and exact source citations.",
  },
] as const;

export function StudioWorkspaceHome(props: StudioWorkspaceHomeProps) {
  const { course, onStartStudySession, onOpenEditor } = props;

  if (!course) {
    return (
      <Empty className="h-full flex-1 p-8">
        <EmptyMedia variant="icon">
          <SparkleIcon className="size-6" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle className="text-ui-lg font-semibold">No Course Workspace Active</EmptyTitle>
          <EmptyDescription className="text-ui">
            Select or open a course workspace from Courses & Library to enter the Study Studio.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <RouteSurfaceHeader divider className="shrink-0">
        <div className="flex items-center gap-2 text-ui-xs">
          <SparkleIcon className="size-4 text-primary shrink-0" />
          <span className="font-semibold text-foreground">Study Studio</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground truncate">{course.name}</span>
        </div>
      </RouteSurfaceHeader>

      <div className="flex min-h-0 flex-1 w-full flex-col overflow-y-auto">
        <div className="@container flex w-full max-w-4xl flex-col p-6 md:p-8 mx-auto gap-6">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" size="sm">
                Study Studio
              </Badge>
              <Badge variant="outline" size="sm">
                Pedagogical Modes
              </Badge>
            </div>
            <h1 className="font-heading font-bold text-2xl md:text-3xl tracking-tight text-foreground">
              Co-Reading & Synthesis Studio
            </h1>
            <p className="text-ui text-muted-foreground max-w-2xl">
              Study alongside lecture slides, textbooks, and notes with an AI tutor anchored to your
              course materials.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <span className="text-ui-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Study Modes
            </span>
            <div className="flex items-center gap-2">
              {props.onOpenStudioCanvas ? (
                <Button
                  size="sm"
                  onClick={props.onOpenStudioCanvas}
                  className="gap-1.5 text-ui-xs font-medium"
                >
                  <SparkleIcon className="size-3.5" />
                  <span>Launch Studio Canvas</span>
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenEditor}
                className="gap-1.5 text-ui-xs"
              >
                <FolderIcon className="size-3.5" />
                <span>Browse Course Files</span>
              </Button>
            </div>
          </div>

          {/* Pedagogical Intent Launchers */}
          <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
            {PEDAGOGICAL_MODES.map((mode) => (
              <Card
                key={mode.id}
                variant="plain"
                interactive
                onClick={() => onStartStudySession(mode.prompt)}
                className="justify-between"
              >
                <CardHeader>
                  <CardTitle className="text-ui-lg">{mode.name}</CardTitle>
                  <CardAction>
                    <Badge variant="secondary" size="sm">
                      {mode.badge}
                    </Badge>
                  </CardAction>
                  <CardDescription className="text-ui-xs leading-relaxed">
                    {mode.desc}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-1.5 text-ui-xs font-medium text-primary">
                    <PlayIcon className="size-3" />
                    <span>Start Session</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
