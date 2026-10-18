// FILE: StudioWorkspaceHome.tsx
// Purpose: Dedicated workspace canvas for Pillar 3: Study Studio (/studio, Cmd+3).
//          Prepares the student for co-reading, note synthesis, and Socratic tutoring.
// Layer: Web UI component

import { useState } from "react";
import type { Project } from "~/types";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { RouteSurfaceHeader } from "~/components/RouteSurface";
import {
  BookOpenIcon,
  BrainIcon,
  ChatBubbleIcon,
  FolderIcon,
  PageTextIcon,
  PlayIcon,
  SparkleIcon,
  AddPlusIcon,
} from "~/lib/icons";

export interface StudioWorkspaceHomeProps {
  readonly course: Project | null;
  readonly onStartStudySession: (initialPrompt?: string) => void;
  readonly onOpenEditor: () => void;
}

const PEDAGOGICAL_MODES = [
  {
    id: "socratic",
    name: "Socratic Co-Reader",
    badge: "Bloom 2-Sigma Default",
    desc: "Co-read lecture slides and textbooks side-by-side. Never gives the answer upfront—guides you step-by-step through questions.",
    prompt:
      "I am co-reading my course materials. Act as my Socratic tutor: do not spoil direct answers, guide me with progressive questions, and test my comprehension.",
  },
  {
    id: "feynman",
    name: "Feynman Teach-Back",
    badge: "Active Interrogation",
    desc: "Explain a concept in your own words. Mimir cross-checks against the slides, flagging missed nuances and misconceptions.",
    prompt:
      "I want to explain a concept in my own words using the Feynman technique. Listen to my explanation, point out any misconceptions, and highlight what the professor's slides emphasized that I missed.",
  },
  {
    id: "verifier",
    name: "Step-Checked Problem Verifier",
    badge: "Anti-Spoiler",
    desc: "Verify homework derivations and mathematical proofs line-by-line using a 3-tier progressive hint ladder.",
    prompt:
      "Verify my problem-solving steps line-by-line. If I make an error, do not give away the solution—give me a Tier 1 conceptual nudge.",
  },
  {
    id: "synthesizer",
    name: "Synthesis Note Co-Author",
    badge: "Source Grounded",
    desc: "Co-author living Cornell study notes with strict [Slide, Page] citations anchored directly to your textbook and slides.",
    prompt:
      "Help me co-author a structured synthesis note for this module. Include key definitions, formulas, comparison tables, and exact source citations.",
  },
] as const;

export function StudioWorkspaceHome(props: StudioWorkspaceHomeProps) {
  const { course, onStartStudySession, onOpenEditor } = props;

  if (!course) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
          <SparkleIcon className="size-7" />
        </div>
        <h2 className="font-heading font-semibold text-xl text-foreground">
          No Course Workspace Active
        </h2>
        <p className="mt-1 max-w-sm text-ui text-muted-foreground">
          Open a course workspace from Courses & Library to enter the Study Studio.
        </p>
      </div>
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
        <div className="flex w-full max-w-5xl flex-col p-6 md:p-10 mx-auto gap-8">
          {/* Header Hero */}
          <div className="flex flex-col gap-2 border-b border-border/60 pb-6">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-ui-2xs font-medium">
                Pillar 3: Study Studio
              </Badge>
              <Badge variant="outline" className="text-ui-2xs font-mono">
                Tri-Pane Canvas
              </Badge>
            </div>
            <h1 className="font-heading font-bold text-2xl md:text-3xl tracking-tight text-foreground">
              Source-Grounded Co-Reading & Synthesis
            </h1>
            <p className="text-ui text-muted-foreground max-w-2xl">
              Study side-by-side with your lecture slides, textbooks, and notes. The contextual
              Socratic tutor stays anchored to your reading position without spoiling answers.
            </p>
          </div>

          {/* Tri-Pane Overview Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="plain" className="border-border/60 bg-card/60 p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-ui-xs font-semibold text-foreground">
                <PageTextIcon className="size-4 text-blue-500" />
                <span>Pane A: Source Reader</span>
              </div>
              <p className="text-ui-xs text-muted-foreground">
                45% viewport width. Textbook PDFs, slide decks, and time-synced lecture audio
                transcripts with margin mastery indicators.
              </p>
            </Card>

            <Card variant="plain" className="border-border/60 bg-card/60 p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-ui-xs font-semibold text-foreground">
                <BookOpenIcon className="size-4 text-amber-500" />
                <span>Pane B: Living Notes</span>
              </div>
              <p className="text-ui-xs text-muted-foreground">
                30% viewport width. Lexical synthesis canvas and step-checked scratchpad with
                clickable source citation pills.
              </p>
            </Card>

            <Card variant="plain" className="border-border/60 bg-card/60 p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-ui-xs font-semibold text-foreground">
                <SparkleIcon className="size-4 text-primary" />
                <span>Pane C: Socratic Companion</span>
              </div>
              <p className="text-ui-xs text-muted-foreground">
                25% viewport width. Context-aware companion synced to visible slide and text
                selection; collapsible with Cmd+\.
              </p>
            </Card>
          </div>

          {/* Pedagogical Intent Launchers */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-ui-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Choose Pedagogical Studio Mode
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenEditor}
                className="gap-1.5 text-ui-xs"
              >
                <FolderIcon className="size-3.5" />
                <span>Open Files in Editor</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PEDAGOGICAL_MODES.map((mode) => (
                <Card
                  key={mode.id}
                  variant="plain"
                  interactive={true}
                  onClick={() => onStartStudySession(mode.prompt)}
                  className="flex flex-col justify-between p-5 transition-all hover:border-primary/40 hover:bg-card/90"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-semibold text-ui-lg text-foreground">
                        {mode.name}
                      </h3>
                      <Badge variant="secondary" className="text-ui-2xs font-medium">
                        {mode.badge}
                      </Badge>
                    </div>
                    <p className="text-ui-xs text-muted-foreground leading-relaxed">{mode.desc}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-ui-xs font-medium text-primary">
                    <PlayIcon className="size-3" />
                    <span>Launch Session</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
