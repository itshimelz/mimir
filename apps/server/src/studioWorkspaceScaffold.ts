// FILE: studioWorkspaceScaffold.ts
// Purpose: Owns the managed Course / Studio workspace layout — the scaffolded subdirectory set and
//          the agent-facing instruction files (AGENTS.md/CLAUDE.md) that teach providers
//          where deliverables belong. Also migrates legacy root-level agent directories
//          (Context, Logs, Skills, tmp) into the hidden .mimir/ directory.
// Layer: Server workspace helper
// Exports: STUDIO_WORKSPACE_SUBDIRECTORIES, LearnerRole, DEFAULT_LEARNER_ROLE,
//          courseWorkspaceSubdirectories, ensureStudioWorkspaceInstructionsFiles,
//          migrateLegacyWorkspaceLayout

import { Effect, FileSystem, Path } from "effect";

/**
 * Which role is using the space. Presentation and scaffold only — it never branches file
 * access, approval, or provider behavior. Defaults to a student.
 */
export type LearnerRole = "student" | "teacher" | "researcher";

export const DEFAULT_LEARNER_ROLE: LearnerRole = "student";

/**
 * Outbox categories per role.
 *
 * A course folder is where a student learns, so the categories name what they
 * actually work on (Lessons, Assignments, Notes, Quizzes, Handouts, References).
 * Images is common to every role for diagrams, figures, and plots.
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
export const COURSE_WORKSPACE_SUPPORT_DIRECTORIES = [
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

// Relative subdirectories scaffolded under a freshly created Studio/Course workspace root.
// Internal agent directories are hidden under `.mimir/`, keeping only user deliverables
// (`Outbox/`) and input drop-box (`Inbox`) visible.
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

const COURSE_ROLE_PURPOSE: Readonly<Record<LearnerRole, string>> = {
  student: "studying a course",
  teacher: "preparing material for a class",
  researcher: "working on a research topic",
};

/**
 * Generates instruction text for the given role.
 */
export function courseWorkspaceInstructionText(role: LearnerRole = DEFAULT_LEARNER_ROLE): string {
  const categories = [...COURSE_OUTBOX_CATEGORIES[role], "Images"].join(", ");
  return `# Course Workspace

You are working in this folder together with someone ${COURSE_ROLE_PURPOSE[role]}. It holds
their own material as well as anything you produce, so keep the two apart.

## Where files go

- \`Outbox/<Category>/\` — everything you create for them: a lesson, an assignment, a quiz,
  a revision sheet, a handout, or a diagram. Use an existing category (${categories}) or add
  an academic category that fits. The app groups what you produce by this folder, so the
  name is what they will see.
- \`.mimir/tmp/\` — scratch space: helper scripts, LaTeX compilations, temporary conversions.
  Never leave a finished file here; anything here may be cleaned up at any time.
- \`Inbox/\` — files they drop in for you to inspect. Read from here; do not write deliverables here.
- \`.mimir/context/\` — reference material and internal background docs. Read-only unless asked.
- \`.mimir/logs/\` and \`.mimir/skills/\` — managed by Mimir; leave them alone.

## Rules

- Never leave a finished file loose in this root or in \`.mimir/tmp/\`. Move it into
  \`Outbox/<Category>/\` as the last step of your turn.
- Leave the student's existing files alone unless explicitly instructed.
- Prefer descriptive, dated file names, e.g. \`2026-10-07_mitosis_quiz.md\`, \`cell_division_notes.pdf\`.
`;
}

// Default instruction text for general studio workspaces.
const STUDIO_WORKSPACE_INSTRUCTIONS = courseWorkspaceInstructionText("student");

const INSTRUCTION_FILE_NAMES = ["AGENTS.md", "CLAUDE.md"] as const;

/**
 * Writes the Studio instruction files into the workspace root.
 * If instructions already exist, updates them if they contain legacy/creator patterns
 * (referencing root Context/, Logs/, tmp/, or TikTok) or if `overwrite` is true.
 * Callers treat failures as non-fatal.
 */
export const ensureStudioWorkspaceInstructionsFiles = Effect.fnUntraced(function* (
  workspaceRoot: string,
  options?: { readonly overwrite?: boolean },
) {
  const fileSystem = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;

  for (const fileName of INSTRUCTION_FILE_NAMES) {
    const filePath = path.join(workspaceRoot, fileName);
    const exists = yield* fileSystem.exists(filePath).pipe(Effect.orElseSucceed(() => false));
    if (exists && !options?.overwrite) {
      // Check if file contains legacy instructions needing upgrade
      const content = yield* fileSystem
        .readFileString(filePath)
        .pipe(Effect.orElseSucceed(() => ""));
      const isLegacy =
        content.includes("Outbox/TikTok") ||
        content.includes("Synara Studio chats") ||
        (content.includes("`Context/`") && !content.includes(".mimir"));
      if (!isLegacy) {
        continue;
      }
    }
    yield* fileSystem.writeFileString(filePath, STUDIO_WORKSPACE_INSTRUCTIONS);
  }
});

/**
 * Migrates legacy root-level agent directories (`Context`, `Logs`, `Skills`, `tmp`)
 * into the hidden `.mimir/` directory. Safe to run multiple times.
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
