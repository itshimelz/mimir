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
      "Mimir does not sell a separate model plan. It connects to your existing AI provider runtimes and accounts configured on your machine. Each provider maintains its own authentication, models, tools, and permissions.",
  },
  {
    question: "What must be installed before I start?",
    answer:
      "Install the Mimir desktop app and connect at least one supported AI runtime. Mimir automatically detects your configured providers and local models in settings.",
  },
  {
    question: "Can several agents work at the same time?",
    answer:
      "Yes. You can run multiple study tasks simultaneously across different Course Spaces. Each task maintains its own document context, reasoning scratchpad, and outbox artifacts so your courses never interfere with each other.",
  },
  {
    question: "Can I switch providers without starting the task over?",
    answer:
      "Yes. Mimir supports provider handoffs. You can switch between connected AI providers within a task while preserving your active Course Space context, reading notes, and generated artifacts.",
  },
  {
    question: "How does Mimir organize course materials and files?",
    answer:
      "Mimir organizes each class into an isolated Course Space on your computer. Add lecture slides, syllabi, reading PDFs, and notes into the space. Mimir stores intermediate scratchpads in .mimir/work and delivers generated quizzes, lessons, and diagrams into your permanent Outbox.",
  },
  {
    question: "Does Mimir upload coursework to its own cloud?",
    answer:
      "No. Mimir runs locally and does not require a cloud workspace account. Your documents, task history, and study notes remain on your machine. Selected AI providers only receive the context required for that specific study session.",
  },
] as const;
