// FILE: studioWorkspaceScaffold.ts
// Purpose: Owns the managed workspace layouts — the scaffolded subdirectory sets and the
//          agent-facing instruction files (AGENTS.md/CLAUDE.md) that teach providers where
//          deliverables belong. Instructions are only written when missing (or when they are
//          an outdated copy of our own template) so user edits are never clobbered. Also
//          migrates legacy root-level agent directories into the hidden .mimir/ directory.
// Layer: Server workspace helper
// Exports: STUDIO_WORKSPACE_SUBDIRECTORIES, LearnerRole, DEFAULT_LEARNER_ROLE,
//          learnerRoleForSpaceIcon, courseWorkspaceSubdirectories,
//          courseWorkspaceInstructionText, ensureStudioWorkspaceInstructionsFiles,
//          ensureCourseWorkspaceInstructionsFiles, migrateLegacyWorkspaceLayout,
//          prepareCourseWorkspaceRoot

import { Effect, FileSystem, Path } from "effect";

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

/**
 * Support directories for a workspace. Agent-internal operational folders live under
 * the hidden `.mimir/` prefix, while `Inbox` remains visible as the user's intake point.
 */
const COURSE_WORKSPACE_SUPPORT_DIRECTORIES = [
  "Inbox",
  ".mimir/context",
  ".mimir/logs",
  ".mimir/skills",
  ".mimir/tmp",
] as const;

/** Relative subdirectories for a course/space workspace under the given role. */
export function courseWorkspaceSubdirectories(
  role: LearnerRole = DEFAULT_LEARNER_ROLE,
): ReadonlyArray<string> {
  return [
    ...COURSE_WORKSPACE_SUPPORT_DIRECTORIES,
    ...COURSE_OUTBOX_CATEGORIES[role].map((category) => `Outbox/${category}`),
    "Outbox/Images",
  ];
}

// Relative subdirectories scaffolded under a freshly created Studio workspace root.
// Internal agent directories are hidden under `.mimir/`, keeping only user deliverables
// (`Outbox/`) and the input drop-box (`Inbox`) visible.
export const STUDIO_WORKSPACE_SUBDIRECTORIES = [
  ...COURSE_WORKSPACE_SUPPORT_DIRECTORIES,
  "Outbox/Lessons",
  "Outbox/Assignments",
  "Outbox/Handouts",
  "Outbox/Notes",
  "Outbox/Quizzes",
  "Outbox/References",
  "Outbox/Images",
] as const;

// One source of truth for the instruction text; AGENTS.md is the cross-provider standard
// (Codex, Cursor, ...), CLAUDE.md is what Claude Code actually loads.
const STUDIO_WORKSPACE_INSTRUCTIONS = `# Studio Workspace

This folder is the shared workspace for Mimir Studio chats. Keep it organized so the
app can attribute and surface what you produce.

## Where files go

- \`Outbox/<Category>/\` — every final deliverable: documents, PDFs, images, exports,
  anything the user asked you to produce. Use an existing category (Lessons, Assignments,
  Handouts, Notes, Quizzes, References, Images) or create an academic category that fits.
- \`.mimir/tmp/\` — scratch space: helper scripts, intermediate artifacts, downloads you
  only need while working. Anything here may be cleaned up at any time.
- \`Inbox/\` — files the user drops in for you to process. Read from here; do not write.
- \`.mimir/context/\` — reference material and background docs. Read-only unless asked.
- \`.mimir/logs/\` and \`.mimir/skills/\` — managed by Mimir; leave them alone.

## Rules

- Never leave a deliverable in \`.mimir/tmp/\` or loose in this root: move the finished
  file into \`Outbox/<Category>/\` as the last step of your work.
- Prefer descriptive, dated file names, e.g. \`2026-10-07_mitosis_quiz.md\`.
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
export function courseWorkspaceInstructionText(role: LearnerRole = DEFAULT_LEARNER_ROLE): string {
  const categories = [...COURSE_OUTBOX_CATEGORIES[role], "Images"].join(", ");
  return `# Course Workspace

You are working in this folder together with someone ${COURSE_ROLE_PURPOSE[role]}. It holds
their own material as well as anything you produce, so keep the two apart.

## Where files go

- \`Outbox/<Category>/\` — everything you create for them: a lesson, an assignment, a quiz,
  a revision sheet, a diagram. Use an existing category (${categories}) or add one that
  fits. The app groups what you produce by this folder, so the name is what they will see.
- \`.mimir/tmp/\` — scratch space: scripts, conversions, anything you only need while
  working. It may be cleared at any time, so never leave a finished file here.
- \`Inbox/\` — files they drop in for you. Read from here; do not write.
- \`.mimir/context/\` — their reference material. Read-only unless asked.
- \`.mimir/logs/\` and \`.mimir/skills/\` — managed by the app; leave them alone.

## Rules

- Never leave a finished file loose in this root or in \`.mimir/tmp/\`. Moving it into
  \`Outbox/<Category>/\` is the last step of your work, not an afterthought.
- Leave their existing files alone unless they asked you to change something. Their notes
  and coursework are theirs, not yours to tidy.
- Name files descriptively, e.g. \`2026-10-07_cell-division-lesson.md\`.
`;
}

const INSTRUCTION_FILE_NAMES = ["AGENTS.md", "CLAUDE.md"] as const;

/**
 * True only for an outdated copy of one of our own templates (written before agent
 * internals moved under `.mimir/`). Anything else is the user's file and must survive.
 */
function isLegacyManagedInstructions(content: string): boolean {
  const isOurTemplate =
    content.startsWith("# Studio Workspace") || content.startsWith("# Course Workspace");
  return isOurTemplate && !content.includes(".mimir");
}

/**
 * Writes instruction files into a workspace root. Existing files are kept unless they are
 * an outdated copy of our own template or `overwrite` is set, so a hand-edited file is never
 * clobbered. Callers treat failures as non-fatal: instructions improve agent behavior but
 * must never block using the workspace.
 */
const ensureInstructionFiles = Effect.fnUntraced(function* (
  workspaceRoot: string,
  instructions: string,
  options?: { readonly overwrite?: boolean },
) {
  const fileSystem = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;

  for (const fileName of INSTRUCTION_FILE_NAMES) {
    const filePath = path.join(workspaceRoot, fileName);
    const exists = yield* fileSystem.exists(filePath).pipe(Effect.orElseSucceed(() => false));
    if (exists && !options?.overwrite) {
      const content = yield* fileSystem
        .readFileString(filePath)
        .pipe(Effect.orElseSucceed(() => ""));
      if (!isLegacyManagedInstructions(content)) {
        continue;
      }
    }
    yield* fileSystem.writeFileString(filePath, instructions);
  }
});

/** Studio container instructions. */
export const ensureStudioWorkspaceInstructionsFiles = Effect.fnUntraced(function* (
  workspaceRoot: string,
  options?: { readonly overwrite?: boolean },
) {
  yield* ensureInstructionFiles(workspaceRoot, STUDIO_WORKSPACE_INSTRUCTIONS, options);
});

/** Course/space instructions for the given role. */
export const ensureCourseWorkspaceInstructionsFiles = Effect.fnUntraced(function* (
  workspaceRoot: string,
  role: LearnerRole,
  options?: { readonly overwrite?: boolean },
) {
  yield* ensureInstructionFiles(workspaceRoot, courseWorkspaceInstructionText(role), options);
});

/**
 * Migrates legacy root-level agent directories (`Context`, `Logs`, `Skills`, `tmp`)
 * into the hidden `.mimir/` directory. Safe to run multiple times. Only for managed
 * Studio roots: in a course folder those names may be the user's own directories.
 */
export const migrateLegacyWorkspaceLayout = Effect.fnUntraced(function* (workspaceRoot: string) {
  const fileSystem = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;

  const legacyToInternalDirs = [
    { from: "Context", to: ".mimir/context" },
    { from: "Logs", to: ".mimir/logs" },
    { from: "Skills", to: ".mimir/skills" },
    { from: "tmp", to: ".mimir/tmp" },
  ] as const;

  let migratedAny = false;
  for (const mapping of legacyToInternalDirs) {
    const legacyPath = path.join(workspaceRoot, mapping.from);
    const legacyExists = yield* fileSystem
      .exists(legacyPath)
      .pipe(Effect.orElseSucceed(() => false));
    if (legacyExists) {
      const targetPath = path.join(workspaceRoot, mapping.to);
      const targetExists = yield* fileSystem
        .exists(targetPath)
        .pipe(Effect.orElseSucceed(() => false));
      if (!targetExists) {
        yield* fileSystem
          .makeDirectory(path.dirname(targetPath), { recursive: true })
          .pipe(Effect.ignore);
        yield* fileSystem.rename(legacyPath, targetPath).pipe(Effect.catch(() => Effect.void));
        migratedAny = true;
      }
    }
  }

  return migratedAny;
});

/**
 * Scaffolds the subdirectories for a course workspace and writes the initial instruction files.
 * Idempotent: existing subdirectories are preserved, and user-edited instruction files are not overwritten.
 */
export const prepareCourseWorkspaceRoot = Effect.fnUntraced(function* (
  workspaceRoot: string,
  role: LearnerRole = DEFAULT_LEARNER_ROLE,
) {
  const fileSystem = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const subdirs = courseWorkspaceSubdirectories(role);
  for (const dirname of subdirs) {
    const childPath = path.join(workspaceRoot, dirname);
    yield* fileSystem.makeDirectory(childPath, { recursive: true });
  }
  yield* ensureCourseWorkspaceInstructionsFiles(workspaceRoot, role).pipe(
    Effect.catch((cause) =>
      Effect.logWarning("failed to write course workspace instructions", {
        workspaceRoot,
        cause,
      }),
    ),
  );
  return { scaffoldedDirectories: [...subdirs] };
});
