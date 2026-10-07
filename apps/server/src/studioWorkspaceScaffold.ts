// FILE: studioWorkspaceScaffold.ts
// Purpose: Owns the managed workspace layouts — the scaffolded subdirectory sets and the
//          agent-facing instruction files (AGENTS.md/CLAUDE.md) that teach providers where
//          deliverables belong. Instructions are only written when missing so user edits are
//          never clobbered.
// Layer: Server workspace helper
// Exports: STUDIO_WORKSPACE_SUBDIRECTORIES, courseWorkspaceSubdirectories,
//          ensureStudioWorkspaceInstructionsFiles, ensureCourseWorkspaceInstructionsFiles

import { Effect, FileSystem, Path } from "effect";

// Relative subdirectories scaffolded under a freshly created Studio workspace root,
// mirroring the Claude `~/Documents/Claude` Outbox layout so generated content lands in
// predictable folders. `tmp` is scratch space the outputs listing ignores.
export const STUDIO_WORKSPACE_SUBDIRECTORIES = [
  "Inbox",
  "Context",
  "Logs",
  "Skills",
  "tmp",
  "Outbox/Content",
  "Outbox/Daily",
  "Outbox/Images",
  "Outbox/Notion",
  "Outbox/TikTok",
  "Outbox/YouTube",
] as const;

/**
 * Which role is using the space. Presentation and scaffold only — it never branches file
 * access, approval, or provider behavior. Defaults to a student.
 */
export type LearnerRole = "student" | "teacher" | "researcher";

export const DEFAULT_LEARNER_ROLE: LearnerRole = "student";

/** Maps a Space's icon to its corresponding LearnerRole. */
export function learnerRoleForSpaceIcon(icon: string | null | undefined): LearnerRole {
  if (icon === "school") {
    return "teacher";
  }
  if (icon === "lab") {
    return "researcher";
  }
  return "student";
}

/**
 * Outbox categories per role.
 *
 * A course folder is where a student learns, so the categories have to name what they
 * actually ask for. The legacy Studio set (Content, Daily, Notion, TikTok, YouTube) is
 * creator-economy vocabulary and reads as noise here; `Outbox/Lessons/` tells the agent
 * more than `Outbox/Content/` ever would.
 *
 * `Images` is common to every role because a diagram or figure is a deliverable in all
 * three, and an agent that has somewhere obvious to put one will not scatter `.png` files
 * across the workspace root.
 */
const COURSE_OUTBOX_CATEGORIES: Readonly<Record<LearnerRole, ReadonlyArray<string>>> = {
  student: ["Lessons", "Assignments", "Handouts", "Notes", "Quizzes", "References"],
  teacher: ["Lessons", "Assignments", "Handouts", "Notes", "Rubrics", "Gradebook"],
  researcher: ["Papers", "Notes", "Figures", "Data", "Literature"],
};

const COURSE_WORKSPACE_SUPPORT_DIRECTORIES = ["Inbox", "Context", "Logs", "Skills", "tmp"] as const;

/** Relative subdirectories for a course/space workspace under the given role. */
export function courseWorkspaceSubdirectories(role: LearnerRole): ReadonlyArray<string> {
  return [
    ...COURSE_WORKSPACE_SUPPORT_DIRECTORIES,
    ...COURSE_OUTBOX_CATEGORIES[role].map((category) => `Outbox/${category}`),
    "Outbox/Images",
  ];
}

// One source of truth for the instruction text; AGENTS.md is the cross-provider standard
// (Codex, Cursor, ...), CLAUDE.md is what Claude Code actually loads.
const STUDIO_WORKSPACE_INSTRUCTIONS = `# Studio Workspace

This folder is the shared workspace for Mimir Studio chats. Keep it organized so the
app can attribute and surface what you produce.

## Where files go

- \`Outbox/<Category>/\` — every final deliverable: documents, PDFs, images, exports,
  anything the user asked you to produce. Use an existing category (Content, Daily,
  Images, Notion, TikTok, YouTube) or create a new one that fits.
- \`tmp/\` — scratch space: helper scripts, intermediate artifacts, downloads you only
  need while working. Anything here may be cleaned up at any time.
- \`Inbox/\` — files the user drops in for you to process. Read from here; do not write.
- \`Context/\` — reference material and background docs. Read-only unless asked.
- \`Logs/\` and \`Skills/\` — managed by Mimir; leave them alone.

## Rules

- Never leave a deliverable in \`tmp/\` or loose in this root: move the finished file
  into \`Outbox/<Category>/\` as the last step of your work.
- Prefer descriptive, dated file names, e.g. \`2026-07-08_customer_report.pdf\`.
`;

const COURSE_ROLE_PURPOSE: Readonly<Record<LearnerRole, string>> = {
  student: "studying a course",
  teacher: "preparing material for a class",
  researcher: "working on a research topic",
};

/**
 * The course instruction text. Exported so the per-turn reactor can write the same layout the
 * scaffold module defines — the agent must be taught the categories the sidebar groups by, and
 * two copies of that text would drift.
 */
export function courseWorkspaceInstructionText(role: LearnerRole): string {
  return courseWorkspaceInstructions(role);
}

function courseWorkspaceInstructions(role: LearnerRole): string {
  const categories = [...COURSE_OUTBOX_CATEGORIES[role], "Images"].join(", ");
  return `# Course Workspace

You are working in this folder together with someone ${COURSE_ROLE_PURPOSE[role]}. It holds
their own material as well as anything you produce, so keep the two apart.

## Where files go

- \`Outbox/<Category>/\` — everything you create for them: a lesson, an assignment, a quiz,
  a revision sheet, a diagram. Use an existing category (${categories}) or add one that
  fits. The app groups what you produce by this folder, so the name is what they will see.
- \`tmp/\` — scratch space: scripts, conversions, anything you only need while working.
  It may be cleared at any time, so never leave a finished file here.
- \`Inbox/\` — files they drop in for you. Read from here; do not write.
- \`Context/\` — their reference material. Read-only unless asked.
- \`Logs/\` and \`Skills/\` — managed by the app; leave them alone.

## Rules

- Never leave a finished file loose in this root or in \`tmp/\`. Moving it into
  \`Outbox/<Category>/\` is the last step of your work, not an afterthought.
- Leave their existing files alone unless they asked you to change something. Their notes
  and coursework are theirs, not yours to tidy.
- Name files descriptively, e.g. \`2026-07-08_cell-division-lesson.md\`.
`;
}

const INSTRUCTION_FILE_NAMES = ["AGENTS.md", "CLAUDE.md"] as const;

/**
 * Writes instruction files into a workspace root, skipping any that already exist, so a
 * hand-edited file is never clobbered. Callers treat failures as non-fatal: instructions
 * improve agent behavior but must never block using the workspace.
 */
const ensureInstructionFiles = Effect.fnUntraced(function* (
  workspaceRoot: string,
  instructions: string,
) {
  const fileSystem = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;

  for (const fileName of INSTRUCTION_FILE_NAMES) {
    const filePath = path.join(workspaceRoot, fileName);
    const exists = yield* fileSystem.exists(filePath);
    if (exists) {
      continue;
    }
    yield* fileSystem.writeFileString(filePath, instructions);
  }
});

/** Studio container instructions. */
export const ensureStudioWorkspaceInstructionsFiles = Effect.fnUntraced(function* (
  workspaceRoot: string,
) {
  yield* ensureInstructionFiles(workspaceRoot, STUDIO_WORKSPACE_INSTRUCTIONS);
});

/** Course/space instructions for the given role. */
export const ensureCourseWorkspaceInstructionsFiles = Effect.fnUntraced(function* (
  workspaceRoot: string,
  role: LearnerRole,
) {
  yield* ensureInstructionFiles(workspaceRoot, courseWorkspaceInstructions(role));
});
