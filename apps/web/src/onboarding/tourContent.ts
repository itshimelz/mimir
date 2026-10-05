// FILE: tourContent.ts
// Purpose: Copy and links for the "what Mimir can do" tour.
// Layer: Web content (no React)

import type { LucideIcon } from "~/lib/icons";
import { BrainIcon, FolderIcon, KeyboardIcon, MessageCircleIcon, SparkleIcon } from "~/lib/icons";

export const MIMIR_DOCS_URL = "https://mimir.himelz.studio/docs";

export interface TourCard {
  readonly id: string;
  /** Short tab label. */
  readonly label: string;
  readonly title: string;
  readonly description: string;
  readonly highlights: ReadonlyArray<string>;
  /**
   * Guide link for the card. Omitted where no page actually covers what the card now claims —
   * a "Read the guide" that lands on an unrelated engineering page is worse than no link.
   */
  readonly docsHref?: string;
  readonly icon: LucideIcon;
}

export const TOUR_CARDS: ReadonlyArray<TourCard> = [
  {
    id: "study",
    label: "Study",
    title: "Your own material, one pane away",
    description:
      "Study is the course's own files: the notes, slides and code you already have. Open, read, edit, search — the agent sits beside it rather than replacing it.",
    highlights: [
      "Your files, untouched by default",
      "Search across the whole course",
      "Edit anything yourself",
    ],
    icon: FolderIcon,
  },
  {
    id: "studio",
    label: "Studio",
    title: "What the agent made for you",
    description:
      "Ask for a lesson, a quiz, a revision sheet or a diagram, and it arrives in Studio as a real file — readable, editable, and kept with the course instead of lost in a transcript.",
    highlights: [
      "Lessons, quizzes, revision sheets",
      "Open and edit before you accept",
      "Grouped by what it is",
    ],
    icon: SparkleIcon,
  },
  {
    id: "agents",
    label: "Any agent",
    title: "Bring the agent you already trust",
    description:
      "Mimir sits around the agent runtimes you have already set up — Claude Code, Codex, Cursor, OpenCode and more. The agent keeps its own account, models and limits.",
    highlights: [
      "Switch models mid-session",
      "Hand a session to another agent",
      "Usage for every agent",
    ],
    docsHref: `${MIMIR_DOCS_URL}/getting-started/providers`,
    icon: BrainIcon,
  },
  {
    id: "session",
    label: "One session",
    title: "The conversation never leaves the frame",
    description:
      "Chat is the rail beside your work, not a screen you leave for. Ask about the page you are reading, pull a selection straight in, and detour into a side chat without losing the main thread.",
    highlights: ["Ask about this page", "Side chats for detours", "The composer never moves"],
    icon: MessageCircleIcon,
  },
  {
    id: "shortcuts",
    label: "Shortcuts",
    title: "Keep your hands on the keyboard",
    description:
      "Everything in the workspace has a shortcut, and the keymap is editable from Settings. A few worth learning on day one:",
    highlights: [],
    docsHref: `${MIMIR_DOCS_URL}/reference/keyboard-shortcuts`,
    icon: KeyboardIcon,
  },
];

/** Keybinding commands surfaced on the shortcuts card and the final step. */
export const TOUR_SHORTCUT_COMMANDS = [
  { command: "chat.new", label: "Start a session" },
  { command: "sidebar.addProject", label: "Add a folder" },
  { command: "sidebar.search", label: "Search your work" },
] as const;
