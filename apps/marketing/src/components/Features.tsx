// FILE: Features.tsx
// Purpose: Renders homepage provider portability and durable task ownership sections.
// Layer: Marketing UI section (M3E cards, badges, icons, type scale)

import type { ComponentType } from "react";
import { SiOpenai } from "react-icons/si";
import {
  AntigravityIcon,
  ClaudeIcon,
  CursorIcon,
  DevinIcon,
  DroidIcon,
  GrokIcon,
  OpencodeIcon,
  PiIcon,
} from "@/components/BrandIcons";
import { MultiProjectShowcase } from "@/components/MultiProjectShowcase";
import { Badge } from "@/components/m3e/badge";
import { Card } from "@/components/m3e/card";
import { Icon } from "@/components/m3e/icon";

type GenericIcon = ComponentType<{ className?: string }>;

const heading =
  "text-headline-medium text-on-surface sm:text-headline-large font-heading font-semibold tracking-tight";
const body = "mt-4 max-w-2xl text-body-large text-on-surface-variant leading-relaxed";
const container = "mx-auto w-full max-w-6xl px-4 sm:px-6";

type Harness = {
  name: string;
  tagline: string;
  Icon: GenericIcon;
  accent: string;
  status: string;
};

const activeHarnesses: Harness[] = [
  {
    name: "Claude Code",
    tagline: "Use the Claude Code runtime and account already configured on your machine.",
    Icon: ClaudeIcon,
    accent: "text-[#D97757]",
    status: "CLI + account",
  },
  {
    name: "Codex",
    tagline:
      "Run Codex tasks with the authenticated CLI, repository, and review surfaces together.",
    Icon: SiOpenai,
    accent: "text-on-surface",
    status: "CLI + account",
  },
  {
    name: "OpenCode",
    tagline: "Bring OpenCode and its configured provider catalog into the same task system.",
    Icon: OpencodeIcon,
    accent: "text-on-surface",
    status: "Configured models",
  },
  {
    name: "Cursor",
    tagline: "Use Cursor Agent beside other runtimes without moving the work to another workspace.",
    Icon: CursorIcon,
    accent: "text-on-surface",
    status: "Agent CLI",
  },
  {
    name: "Antigravity",
    tagline: "Run Antigravity with its own account, models, permissions, and session behavior.",
    Icon: AntigravityIcon,
    accent: "",
    status: "agy CLI",
  },
  {
    name: "Grok Build",
    tagline: "Use Grok Build through its local runtime and Agent Client Protocol integration.",
    Icon: GrokIcon,
    accent: "text-on-surface",
    status: "grok CLI",
  },
  {
    name: "Devin CLI",
    tagline:
      "Run Devin locally through ACP with its account, models, commands, plan mode, and compaction.",
    Icon: DevinIcon,
    accent: "text-on-surface",
    status: "ACP + account",
  },
  {
    name: "Pi",
    tagline: "Run Pi with its provider registry, thinking levels, skills, and native steering.",
    Icon: PiIcon,
    accent: "text-on-surface",
    status: "Model registry",
  },
  {
    name: "Factory Droid",
    tagline: "Use Droid through its authenticated runtime, model controls, and ACP session.",
    Icon: DroidIcon,
    accent: "text-on-surface",
    status: "droid CLI",
  },
];

const TASK_PILLARS = [
  {
    icon: "folder",
    title: "Local workspace state",
    description:
      "Task notes, reasoning scratchpads, and active traces persist locally in .mimir/work/ rather than in an ephemeral cloud buffer.",
  },
  {
    icon: "shield",
    title: "Bounded task boundaries",
    description:
      "Each study goal runs in an isolated context. Questions on cellular genetics never contaminate your algorithms review.",
  },
  {
    icon: "menu_book",
    title: "Dual Study & Studio modes",
    description:
      "Switch effortlessly between deep PDF/slide reading in the Study editor and interactive review in the Studio canvas.",
  },
  {
    icon: "hub",
    title: "Permanent Studio outbox",
    description:
      "Generated interactive quizzes, visual concept diagrams, and flashcard decks remain accessible forever on your machine.",
  },
] as const;

export default function Features() {
  return (
    <div>
      {/* =========================================================================
       * PROVIDER PORTABILITY SECTION
       * ========================================================================= */}
      <section className="border-t border-outline-variant py-14 sm:py-20">
        <div className={container}>
          <Badge
            variant="secondary"
            className="rounded-full px-3.5 py-1 text-label-medium font-medium shadow-xs"
          >
            Provider portability
          </Badge>
          <h2 className={`${heading} mt-4`}>Keep the runtimes you already trust.</h2>
          <p className={body}>
            Mimir connects directly to your existing AI agent runtimes without lock-in. Each
            provider maintains its authentication, models, and tools, while Mimir unifies your
            course spaces, document study, and interactive learning outbox.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeHarnesses.map(({ name, tagline, Icon, accent, status }) => (
              <Card
                key={name}
                variant="outlined"
                className="rounded-2xl p-5 hover:border-outline transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high">
                      <Icon className={`size-5 ${accent}`} aria-hidden="true" />
                    </span>
                    <span className="truncate text-title-medium font-medium text-on-surface">
                      {name}
                    </span>
                  </div>
                  <Badge variant="outline" className="shrink-0 font-mono text-label-small">
                    {status}
                  </Badge>
                </div>
                <p className="mt-3 text-body-medium text-on-surface-variant leading-relaxed">
                  {tagline}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
       * DURABLE TASK OWNERSHIP SECTION (M3E Redesign for Mimir)
       * ========================================================================= */}
      <section className="border-t border-outline-variant py-14 sm:py-20 bg-surface-container-lowest/50">
        <div className={container}>
          <div className="flex flex-col gap-2">
            <Badge
              variant="secondary"
              className="w-fit rounded-full px-3.5 py-1 text-label-medium font-medium shadow-xs"
            >
              Durable task ownership
            </Badge>
            <h2 className={`${heading} mt-3 max-w-3xl`}>
              One course space. Autonomous study tasks. Permanent traces.
            </h2>
            <p className={body}>
              Learning shouldn&apos;t vanish into disposable, endless chat threads. Mimir keeps your
              study objectives, lecture slides, active retrieval logs, and generated studio
              artifacts permanently attached to the task.
            </p>
          </div>

          {/* 4 Task Architecture Pillars */}
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TASK_PILLARS.map(({ icon, title, description }) => (
              <Card
                key={title}
                variant="outlined"
                className="flex flex-col justify-between rounded-2xl p-5 border-outline-variant/40 bg-surface-container-low"
              >
                <div>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                    <Icon name={icon} size={18} />
                  </div>
                  <h3 className="mt-4 text-title-small font-semibold text-on-surface">{title}</h3>
                  <p className="mt-2 text-body-small text-on-surface-variant leading-relaxed">
                    {description}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {/* Deep Showcase 1: Bounded Study Task Execution */}
          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
            <div>
              <p className="text-label-medium font-mono font-medium text-primary uppercase tracking-wide">
                01 / Task Execution
              </p>
              <h3 className="mt-2 text-headline-small font-heading font-semibold text-on-surface">
                Autonomous tasks with verifiable learning checkpoints
              </h3>
              <p className="mt-3 text-body-large text-on-surface-variant leading-relaxed">
                Assign high-level objectives—like &ldquo;Synthesize Chapter 4 with Lecture 05
                Slides&rdquo;—inside an isolated environment. The agent inspects referenced
                documents, writes step-by-step reasoning in
                <code className="mx-1 rounded-sm bg-surface-container-high px-1.5 py-0.5 font-mono text-label-small">
                  .mimir/work
                </code>
                , and pauses for active retrieval checkpoints before declaring the task complete.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-label-small">
                <Badge variant="outline" className="rounded-full">
                  Step-by-step hint reveals
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  Cited lecture slide timestamps
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  Zero hallucination guard
                </Badge>
              </div>
            </div>

            {/* Interactive M3E Task Card Mockup */}
            <Card
              variant="elevated"
              className="rounded-3xl border border-outline-variant/40 bg-surface-container-low p-6 shadow-elevation-1"
            >
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2">
                  <Icon name="assignment" size={18} className="text-primary" />
                  <span className="text-label-medium font-semibold text-on-surface">
                    Task: Cellular respiration review
                  </span>
                </div>
                <span className="rounded-full bg-primary-container px-2.5 py-0.5 text-label-small font-medium text-on-primary-container">
                  Step 3 of 4
                </span>
              </div>

              <div className="mt-4 space-y-3 text-body-small">
                <div className="rounded-xl bg-surface-container p-3 border border-outline-variant/20">
                  <p className="text-label-small font-medium text-on-surface-variant">
                    Referenced documents:
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    <span className="rounded-md bg-surface-container-high px-2 py-0.5 text-label-small text-on-surface">
                      📄 lecture-05-glycolysis.pdf
                    </span>
                    <span className="rounded-md bg-surface-container-high px-2 py-0.5 text-label-small text-on-surface">
                      📝 krebs-cycle-notes.md
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-surface-container p-3 border border-outline-variant/20">
                  <div className="flex items-center gap-1.5 text-label-small font-medium text-tertiary">
                    <Icon name="psychology" size={16} />
                    <span>Agent reasoning trace:</span>
                  </div>
                  <p className="mt-1 text-on-surface italic text-body-small">
                    &ldquo;Identified common student confusion between substrate-level
                    phosphorylation and oxidative phosphorylation. Preparing targeted retrieval
                    prompt...&rdquo;
                  </p>
                </div>

                <div className="rounded-xl bg-secondary-container/30 p-3 border border-secondary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-label-small font-semibold text-secondary">
                      Active checkpoint (in progress)
                    </span>
                    <span className="text-label-small font-mono text-on-secondary-container">
                      Checkpoint #2
                    </span>
                  </div>
                  <p className="mt-1 text-on-surface text-label-medium">
                    &ldquo;What is the net ATP yield from one glucose molecule through glycolysis
                    alone?&rdquo;
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Deep Showcase 2: Studio Artifact Outbox */}
          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
            <div className="lg:order-2">
              <p className="text-label-medium font-mono font-medium text-secondary uppercase tracking-wide">
                02 / Studio Artifacts
              </p>
              <h3 className="mt-2 text-headline-small font-heading font-semibold text-on-surface">
                Artifacts that live beyond the conversation
              </h3>
              <p className="mt-3 text-body-large text-on-surface-variant leading-relaxed">
                Standard chat windows bury valuable conclusions in a linear scroll that disappears
                when the session ends. Mimir deposits concrete, interactive learning
                objects—practice quizzes with step-by-step hints, visual concept diagrams, and
                high-yield flashcard decks—straight into your Course Outbox.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-label-small">
                <Badge variant="outline" className="rounded-full">
                  Export to Anki & Markdown
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  Instant offline practice
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  Permanent revision library
                </Badge>
              </div>
            </div>

            {/* Interactive M3E Outbox Card Mockup */}
            <div className="lg:order-1">
              <Card
                variant="elevated"
                className="rounded-3xl border border-outline-variant/40 bg-surface-container-low p-6 shadow-elevation-1"
              >
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <div className="flex items-center gap-2">
                    <Icon name="hub" size={18} className="text-secondary" />
                    <span className="text-label-medium font-semibold text-on-surface">
                      Outbox · Biology 101 knowledge assets
                    </span>
                  </div>
                  <Badge variant="secondary" className="font-mono text-label-small">
                    3 new artifacts
                  </Badge>
                </div>

                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between rounded-xl bg-surface-container p-3 border border-outline-variant/20">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container">
                        <Icon name="help" size={16} />
                      </span>
                      <div>
                        <p className="text-label-medium font-medium text-on-surface">
                          Glycolysis vs Krebs Quiz
                        </p>
                        <p className="text-label-small text-on-surface-variant">
                          12 Questions · 92% Retrieval score
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-label-small text-on-surface-variant">
                      Studio ready
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-surface-container p-3 border border-outline-variant/20">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                        <Icon name="account_tree" size={16} />
                      </span>
                      <div>
                        <p className="text-label-medium font-medium text-on-surface">
                          Metabolic Pathway Diagram
                        </p>
                        <p className="text-label-small text-on-surface-variant">
                          18 Interlinked nodes · Canvas Map
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-label-small text-on-surface-variant">
                      Visual map
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-surface-container p-3 border border-outline-variant/20">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-tertiary-container text-on-tertiary-container">
                        <Icon name="menu_book" size={16} />
                      </span>
                      <div>
                        <p className="text-label-medium font-medium text-on-surface">
                          High-Yield Exam Synthesis
                        </p>
                        <p className="text-label-small text-on-surface-variant">
                          Summary notes with slide citations
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-label-small text-on-surface-variant">
                      Study deck
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Course Spaces Persistence Showcase */}
      <MultiProjectShowcase />
    </div>
  );
}
