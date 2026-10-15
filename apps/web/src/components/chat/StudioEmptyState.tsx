// FILE: StudioEmptyState.tsx
// Purpose: Role-aware action starter cards and empty state for Mimir Studio, eliminating
//          blank-canvas paralysis for Students, Teachers, and Researchers.
// Layer: Studio presentation component
// Exports: StudioEmptyState.

import type { SpaceIconName } from "@synara/contracts";
import {
  BookOpenIcon,
  BrainIcon,
  FileIcon,
  FlaskConicalIcon,
  LightbulbIcon,
  SparkleIcon,
} from "~/lib/icons";
import { cn } from "~/lib/utils";

export interface StudioEmptyStateProps {
  spaceIcon?: SpaceIconName | undefined;
  spaceName?: string | null | undefined;
  hasOutputs: boolean;
  onSelectStarterPrompt?: ((prompt: string) => void) | undefined;
  onOpenChat?: (() => void) | undefined;
}

interface ActionStarterCard {
  id: string;
  icon: typeof SparkleIcon;
  title: string;
  description: string;
  prompt: string;
}

interface RoleConfig {
  badge: string;
  title: string;
  subtitle: string;
  cards: ActionStarterCard[];
}

function getRoleConfig(icon?: SpaceIconName, spaceName?: string | null): RoleConfig {
  const contextName = spaceName ? ` in ${spaceName}` : "";

  if (icon === "school") {
    return {
      badge: "Teaching Studio",
      title: "Design Course Content & Evaluations",
      subtitle: `Generate rubrics, lecture outlines, assignment problem sets, and grading criteria${contextName}.`,
      cards: [
        {
          id: "rubric",
          icon: FileIcon,
          title: "Create Grading Rubric",
          description:
            "Build structured evaluation criteria with multi-tiered performance levels and clear metrics.",
          prompt:
            "Draft a comprehensive grading rubric with clear evaluation criteria, weights, and performance tiers.",
        },
        {
          id: "outline",
          icon: BookOpenIcon,
          title: "Draft Lecture Outline",
          description:
            "Structure lesson objectives, discussion prompts, active learning tasks, and pacing.",
          prompt:
            "Create a structured lecture outline including learning objectives, discussion prompts, and key activities.",
        },
        {
          id: "assignment",
          icon: LightbulbIcon,
          title: "Design Assignment Brief",
          description:
            "Author engaging problem sets, lab exercises, or project briefs with milestone guidelines.",
          prompt:
            "Design an engaging assignment problem set with milestone guidelines, deliverables, and assessment criteria.",
        },
      ],
    };
  }

  if (icon === "lab") {
    return {
      badge: "Research Studio",
      title: "Synthesize Literature & Research",
      subtitle: `Extract methodologies, summarize papers, and draft structured research notes${contextName}.`,
      cards: [
        {
          id: "synthesis",
          icon: FileIcon,
          title: "Paper Synthesis",
          description:
            "Extract core research questions, theoretical contributions, and empirical methodology.",
          prompt:
            "Summarize and synthesize the main research questions, methodology, and theoretical contributions of this material.",
        },
        {
          id: "notes",
          icon: BrainIcon,
          title: "Draft Research Notes",
          description:
            "Map out literature connections, hypotheses, limitations, and open research questions.",
          prompt:
            "Draft structured research notes identifying key literature connections, hypotheses, and open research questions.",
        },
        {
          id: "methodology",
          icon: FlaskConicalIcon,
          title: "Methodology Outline",
          description:
            "Define experimental setups, baseline comparisons, dataset pipelines, and evaluation metrics.",
          prompt:
            "Outline an experimental methodology with datasets, baseline comparisons, and evaluation metrics.",
        },
      ],
    };
  }

  // Default: Student
  return {
    badge: "Study Studio",
    title: "Master Your Course Material",
    subtitle: `Transform your course notes and readings${contextName} into deep explanations, practice quizzes, and summaries.`,
    cards: [
      {
        id: "concept",
        icon: BrainIcon,
        title: "Explain Core Concept",
        description:
          "Get a step-by-step conceptual breakdown with intuitive analogies and clear examples.",
        prompt:
          "Can you provide a step-by-step conceptual explanation of our course material with intuitive analogies and examples?",
      },
      {
        id: "quiz",
        icon: LightbulbIcon,
        title: "Generate Practice Quiz",
        description:
          "Create a 5-question multiple choice quiz with answer keys and detailed explanations.",
        prompt:
          "Create a 5-question practice quiz based on our course material with multiple-choice questions, answer keys, and explanations.",
      },
      {
        id: "guide",
        icon: BookOpenIcon,
        title: "Build Study Guide",
        description:
          "Synthesize definitions, formulas, and essential takeaways into a concise cheat sheet.",
        prompt:
          "Synthesize the key concepts, formulas, and definitions from our course into a concise study guide.",
      },
    ],
  };
}

export function StudioEmptyState(props: StudioEmptyStateProps) {
  const { badge, title, subtitle, cards } = getRoleConfig(props.spaceIcon, props.spaceName);

  const handleCardClick = (card: ActionStarterCard) => {
    props.onSelectStarterPrompt?.(card.prompt);
    props.onOpenChat?.();
  };

  return (
    <div
      data-testid="studio-empty-state"
      className="flex min-h-0 flex-1 flex-col items-center justify-center p-6 sm:p-8"
    >
      <div className="w-full max-w-2xl space-y-6 text-center">
        {/* Header badge & title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-ui-xs font-semibold text-primary">
            <SparkleIcon className="size-3.5" />
            <span>{badge}</span>
          </div>
          <h2 className="text-ui-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {title}
          </h2>
          <p className="mx-auto max-w-lg text-ui-sm text-muted-foreground">
            {props.hasOutputs
              ? "Select an artifact from the Outbox sidebar to review it, or select a starter prompt below to produce a new artifact."
              : subtitle}
          </p>
        </div>

        {/* Action Starter Cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleCardClick(card)}
                className={cn(
                  "group flex flex-col items-start gap-2.5 rounded-xl border border-border/70 bg-card p-4 text-left transition-all",
                  "hover:border-primary/50 hover:bg-muted/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                )}
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-4" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-ui font-medium text-foreground transition-colors group-hover:text-primary">
                    {card.title}
                  </h3>
                  <p className="text-ui-xs leading-relaxed text-muted-foreground">
                    {card.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer hint */}
        <p className="text-ui-xs text-muted-foreground/75">
          {props.hasOutputs
            ? "Tip: Artifacts created by Mimir stay organized in your Outbox by category."
            : "Clicking a starter card will open Mimir chat and suggest the prompt."}
        </p>
      </div>
    </div>
  );
}
