// FILE: data/product.ts
// Purpose: Canonical public product language shared by marketing, metadata,
//          structured data, FAQs, and AI-readable discovery surfaces.
// Layer: static content (server/client importable).

export const PRODUCT_NAME = "Mimir";

export const PRODUCT_CATEGORY =
  "The desktop-first agentic learning workspace for university students.";

export const PRODUCT_HERO_TITLE = "The desktop-first agentic co-learner";

export const PRODUCT_HERO_DESCRIPTION =
  "Mimir transforms university coursework into an active, adaptive learning environment. Organize courses into Spaces, inspect slides and PDFs in the Study view, and collaborate with AI agents that craft interactive lessons, practice quizzes, and visual knowledge maps in the Studio.";

export const PRODUCT_META_DESCRIPTION =
  "Mimir is the desktop-first agentic co-learner for university students. Study coursework, practice with AI tutors, and generate interactive learning artifacts.";

export const PRODUCT_DESCRIPTION =
  "Mimir is a free, local-first agentic co-learner and study workspace designed for university students. Organize courses into Spaces, inspect PDFs and lecture slides in the Study view, generate interactive lessons, quizzes, and visual concept maps in the Studio view, and learn with an agentic tutor in an expressive Material 3 environment.";

export const SUPPORTED_PROVIDERS = [
  "Claude Code",
  "Codex",
  "OpenCode",
  "Cursor",
  "Antigravity",
  "Grok Build",
  "Devin CLI",
  "Pi",
  "Factory Droid",
] as const;

export const PRODUCT_PILLARS = [
  {
    title: "One course, one dedicated Space",
    description:
      "Keep lecture slides, textbook readings, syllabi, notes, and generated study artifacts together in an isolated, local course space.",
  },
  {
    title: "Dual Study & Studio views",
    description:
      "Switch seamlessly between the Study editor for reading and writing, and the Studio for reviewing agent-crafted visual lessons and quizzes.",
  },
  {
    title: "Active retrieval, not passive reading",
    description:
      "The Mimir tutor prompts questions and scaffolds thinking with step-by-step hints before explaining, maximizing long-term retention.",
  },
  {
    title: "Durable learning traces",
    description:
      "Capture insights, reflections, questions, and practice performance directly into your permanent course knowledge base.",
  },
] as const;
