// FILE: Features.tsx
// Purpose: Renders homepage provider and product-system sections.
// Layer: Marketing UI section (M3E cards, badges, type scale)

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
import { SplitShowcase } from "@/components/SplitShowcase";
import { WorktreeMock } from "@/components/WorktreeMock";
import { MultiProjectShowcase } from "@/components/MultiProjectShowcase";
import { OneClickPrMock } from "@/components/OneClickPrMock";
import { PRODUCT_PILLARS } from "@/data/product";
import { Badge } from "@/components/m3e/badge";
import { Card } from "@/components/m3e/card";

type GenericIcon = ComponentType<{ className?: string }>;

const heading = "text-headline-medium text-on-surface sm:text-headline-large";
const body = "mt-5 max-w-2xl text-body-large text-on-surface-variant";
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

export default function Features() {
  return (
    <div>
      <section className="border-t border-outline-variant py-14 sm:py-20">
        <div className={container}>
          <p className="text-label-large text-primary">Provider portability</p>
          <h2 className={`${heading} mt-3`}>Keep the runtimes you already trust.</h2>
          <p className={body}>
            Mimir sits around your coding agents rather than replacing them. Each provider keeps its
            own authentication, models, tools, and permissions while Mimir gives the work a
            consistent task, environment, review, and delivery layer.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {activeHarnesses.map(({ name, tagline, Icon, accent, status }) => (
              <Card key={name} variant="outlined" className="rounded-lg p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-container-high">
                      <Icon className={`size-5 ${accent}`} aria-hidden="true" />
                    </span>
                    <span className="truncate text-title-medium text-on-surface">{name}</span>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {status}
                  </Badge>
                </div>
                <p className="mt-3 text-body-medium text-on-surface-variant">{tagline}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-outline-variant py-14 sm:py-20">
        <div className={container}>
          <p className="text-label-large text-primary">Durable task ownership</p>
          <h2 className={`${heading} mt-3 max-w-2xl`}>One workspace. Separate tasks. Shared control.</h2>
          <p className={body}>
            A coding agent is only one part of the job. Mimir keeps the objective, environment, live
            processes, verification evidence, and delivery state attached to the work from first
            prompt to pull request.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PRODUCT_PILLARS.map(({ title, description }) => (
              <Card key={title} variant="outlined" className="rounded-lg p-6">
                <h3 className="text-title-medium text-on-surface">{title}</h3>
                <p className="mt-2 text-body-medium text-on-surface-variant">{description}</p>
              </Card>
            ))}
          </div>

          <SplitShowcase
            kicker="01 / delivery"
            title="Deliver from the same task"
            description="Review the final diff, run the required checks, commit the intended changes, and open the pull request without reconstructing the work in another tool."
            reverse={false}
          >
            <OneClickPrMock />
          </SplitShowcase>

          <SplitShowcase
            kicker="02 / parallel work"
            title="Isolate concurrent work"
            description="Give parallel tasks separate Git worktrees so each agent has a clear branch, working directory, and ownership boundary."
            reverse
          >
            <WorktreeMock />
          </SplitShowcase>
        </div>
      </section>

      <MultiProjectShowcase />
    </div>
  );
}
