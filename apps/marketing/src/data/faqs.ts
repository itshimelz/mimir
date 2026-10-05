// FILE: data/faqs.ts
// Purpose: Shared FAQ copy used by the homepage UI and FAQPage JSON-LD.
// Layer: static content (server/client importable).

import { PRODUCT_DESCRIPTION } from "@/data/product";

export const FAQ_ITEMS = [
  {
    question: "What is Mimir?",
    answer: PRODUCT_DESCRIPTION,
  },
  {
    question: "Does Mimir include models or require another AI subscription?",
    answer:
      "Mimir does not sell a separate model plan. It connects to supported coding-agent runtimes and the provider accounts already configured on your machine. Each provider keeps its own authentication, models, limits, tools, and permissions.",
  },
  {
    question: "What must be installed before I start?",
    answer:
      "Install the Mimir desktop app and at least one supported coding-agent runtime. Authenticate that runtime outside Mimir, verify that its executable works from a fresh terminal, then confirm that Mimir detects it in provider settings.",
  },
  {
    question: "Can several agents work at the same time?",
    answer:
      "Yes. Create separate tasks and use isolated Git worktrees when agents may edit concurrently. Each task keeps its own provider session, working directory, terminal, browser, diff, and delivery state so ownership remains visible.",
  },
  {
    question: "Can I switch providers without starting the task over?",
    answer:
      "Mimir supports provider handoffs for supported runtimes. The next provider continues in the same task environment with the context Mimir passes forward. Review the working tree before and after a handoff because providers do not have identical tools or session semantics.",
  },
  {
    question: "How does Mimir fit into Git and pull-request workflows?",
    answer:
      "Use a normal branch or an isolated worktree, inspect the resulting diff, run the required checks, commit the intended changes, push the branch, and open or review the pull request from the same task workflow.",
  },
  {
    question: "Does Mimir upload my code to its own cloud?",
    answer:
      "Mimir does not require a Mimir cloud workspace account or proxy normal provider traffic through its own model service. The selected provider still receives the prompts, files, diffs, command output, and tool results required for that provider session.",
  },
] as const;
