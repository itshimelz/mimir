import { Effect, FileSystem, Layer, Path } from "effect";
import { describe, expect, it } from "vitest";

import {
  courseWorkspaceSubdirectories,
  ensureCourseWorkspaceInstructionsFiles,
  ensureStudioWorkspaceInstructionsFiles,
  learnerRoleForSpaceIcon,
  migrateLegacyWorkspaceLayout,
  STUDIO_WORKSPACE_SUBDIRECTORIES,
} from "./studioWorkspaceScaffold";

function makeFakeFileSystemLayer(
  existingPaths: ReadonlySet<string>,
  fileContents: ReadonlyMap<string, string> = new Map(),
) {
  const written: Array<{ path: string; content: string }> = [];
  const renames: Array<{ from: string; to: string }> = [];
  const directories: Array<string> = [];

  const fileSystemLayer = FileSystem.layerNoop({
    exists: (path: string) => Effect.succeed(existingPaths.has(path)),
    readFileString: (path: string) => Effect.succeed(fileContents.get(path) ?? ""),
    writeFileString: (path: string, content: string) =>
      Effect.sync(() => {
        written.push({ path, content });
      }),
    rename: (from: string, to: string) =>
      Effect.sync(() => {
        renames.push({ from, to });
      }),
    makeDirectory: (path: string) =>
      Effect.sync(() => {
        directories.push(path);
      }),
  });

  return { layer: Layer.merge(fileSystemLayer, Path.layer), written, renames, directories };
}

describe("studioWorkspaceScaffold", () => {
  describe("STUDIO_WORKSPACE_SUBDIRECTORIES", () => {
    it("contains .mimir internal directories and academic Outbox categories", () => {
      expect(STUDIO_WORKSPACE_SUBDIRECTORIES).toContain("Inbox");
      expect(STUDIO_WORKSPACE_SUBDIRECTORIES).toContain(".mimir/context");
      expect(STUDIO_WORKSPACE_SUBDIRECTORIES).toContain(".mimir/logs");
      expect(STUDIO_WORKSPACE_SUBDIRECTORIES).toContain(".mimir/skills");
      expect(STUDIO_WORKSPACE_SUBDIRECTORIES).toContain(".mimir/tmp");
      expect(STUDIO_WORKSPACE_SUBDIRECTORIES).toContain("Outbox/Lessons");
      expect(STUDIO_WORKSPACE_SUBDIRECTORIES).toContain("Outbox/Assignments");
      expect(STUDIO_WORKSPACE_SUBDIRECTORIES).toContain("Outbox/Handouts");
      expect(STUDIO_WORKSPACE_SUBDIRECTORIES).toContain("Outbox/Notes");
      expect(STUDIO_WORKSPACE_SUBDIRECTORIES).toContain("Outbox/Quizzes");
      expect(STUDIO_WORKSPACE_SUBDIRECTORIES).toContain("Outbox/References");
      expect(STUDIO_WORKSPACE_SUBDIRECTORIES).toContain("Outbox/Images");
      // Must not contain legacy creator categories or root Context/tmp
      expect(STUDIO_WORKSPACE_SUBDIRECTORIES).not.toContain("Context");
      expect(STUDIO_WORKSPACE_SUBDIRECTORIES).not.toContain("tmp");
      expect(STUDIO_WORKSPACE_SUBDIRECTORIES).not.toContain("Outbox/TikTok");
    });
  });

  describe("ensureStudioWorkspaceInstructionsFiles", () => {
    it("writes AGENTS.md and CLAUDE.md with the same instructions when missing", async () => {
      const { layer, written } = makeFakeFileSystemLayer(new Set());

      await Effect.runPromise(
        ensureStudioWorkspaceInstructionsFiles("/studio").pipe(Effect.provide(layer)),
      );

      expect(written.map((file) => file.path)).toEqual(["/studio/AGENTS.md", "/studio/CLAUDE.md"]);
      expect(written[0]?.content).toContain("Outbox/<Category>/");
      expect(written[0]?.content).toContain(".mimir/tmp/");
      expect(written[0]?.content).toContain(".mimir/context/");
      expect(written[0]?.content).toBe(written[1]?.content);
    });

    it("upgrades legacy instruction files that reference outdated paths", async () => {
      const legacyContent = `# Studio Workspace\n- Outbox/TikTok/\n- Context/\n- tmp/\n`;
      const { layer, written } = makeFakeFileSystemLayer(
        new Set(["/studio/AGENTS.md", "/studio/CLAUDE.md"]),
        new Map([
          ["/studio/AGENTS.md", legacyContent],
          ["/studio/CLAUDE.md", legacyContent],
        ]),
      );

      await Effect.runPromise(
        ensureStudioWorkspaceInstructionsFiles("/studio").pipe(Effect.provide(layer)),
      );

      expect(written.map((file) => file.path)).toEqual(["/studio/AGENTS.md", "/studio/CLAUDE.md"]);
      expect(written[0]?.content).toContain(".mimir/tmp/");
    });

    it("preserves custom user instruction files that do not match the legacy template", async () => {
      const customContent = `# My Custom Course\nDo my custom homework rules here.\n`;
      const { layer, written } = makeFakeFileSystemLayer(
        new Set(["/studio/AGENTS.md"]),
        new Map([["/studio/AGENTS.md", customContent]]),
      );

      await Effect.runPromise(
        ensureStudioWorkspaceInstructionsFiles("/studio").pipe(Effect.provide(layer)),
      );

      expect(written.map((file) => file.path)).toEqual(["/studio/CLAUDE.md"]);
    });

    it("overwrites instructions when overwrite is explicitly requested", async () => {
      const customContent = `# Custom Content`;
      const { layer, written } = makeFakeFileSystemLayer(
        new Set(["/studio/AGENTS.md"]),
        new Map([["/studio/AGENTS.md", customContent]]),
      );

      await Effect.runPromise(
        ensureStudioWorkspaceInstructionsFiles("/studio", { overwrite: true }).pipe(
          Effect.provide(layer),
        ),
      );

      expect(written.map((file) => file.path)).toEqual(["/studio/AGENTS.md", "/studio/CLAUDE.md"]);
    });
  });

  describe("migrateLegacyWorkspaceLayout", () => {
    it("migrates legacy Context, Logs, Skills, and tmp into .mimir/", async () => {
      const { layer, renames } = makeFakeFileSystemLayer(
        new Set(["/course/Context", "/course/Logs", "/course/Skills", "/course/tmp"]),
      );

      const migrated = await Effect.runPromise(
        migrateLegacyWorkspaceLayout("/course").pipe(Effect.provide(layer)),
      );

      expect(migrated).toBe(true);
      expect(renames).toEqual([
        { from: "/course/Context", to: "/course/.mimir/context" },
        { from: "/course/Logs", to: "/course/.mimir/logs" },
        { from: "/course/Skills", to: "/course/.mimir/skills" },
        { from: "/course/tmp", to: "/course/.mimir/tmp" },
      ]);
    });

    it("does nothing when no legacy directories exist", async () => {
      const { layer, renames } = makeFakeFileSystemLayer(new Set());

      const migrated = await Effect.runPromise(
        migrateLegacyWorkspaceLayout("/course").pipe(Effect.provide(layer)),
      );

      expect(migrated).toBe(false);
      expect(renames).toEqual([]);
    });

    it("does not overwrite if .mimir target directory already exists", async () => {
      const { layer, renames } = makeFakeFileSystemLayer(
        new Set(["/course/Context", "/course/.mimir/context"]),
      );

      const migrated = await Effect.runPromise(
        migrateLegacyWorkspaceLayout("/course").pipe(Effect.provide(layer)),
      );

      expect(migrated).toBe(false);
      expect(renames).toEqual([]);
    });
  });
});

describe("courseWorkspaceSubdirectories", () => {
  it("scaffolds curricular Outbox categories for a student, not the legacy creator set", () => {
    const directories = courseWorkspaceSubdirectories("student");

    expect(directories).toContain("Outbox/Lessons");
    expect(directories).toContain("Outbox/Assignments");
    expect(directories).toContain("Outbox/Quizzes");
    // The creator-economy categories mean nothing to a student.
    for (const legacy of ["Outbox/TikTok", "Outbox/YouTube", "Outbox/Notion"]) {
      expect(directories).not.toContain(legacy);
    }
  });

  it("gives a teacher the categories they actually produce", () => {
    const directories = courseWorkspaceSubdirectories("teacher");
    expect(directories).toContain("Outbox/Rubrics");
    expect(directories).toContain("Outbox/Gradebook");
  });

  it("gives a researcher paper-shaped categories", () => {
    const directories = courseWorkspaceSubdirectories("researcher");
    expect(directories).toContain("Outbox/Papers");
    expect(directories).toContain("Outbox/Figures");
  });

  it("keeps the support directories and Images in every role", () => {
    for (const role of ["student", "teacher", "researcher"] as const) {
      const directories = courseWorkspaceSubdirectories(role);
      for (const support of [
        "Inbox",
        ".mimir/context",
        ".mimir/logs",
        ".mimir/skills",
        ".mimir/tmp",
        "Outbox/Images",
      ]) {
        expect(directories, `${role} is missing ${support}`).toContain(support);
      }
    }
  });

  it("gives each role a distinct set of course categories", () => {
    const student = courseWorkspaceSubdirectories("student").filter((d) => d.startsWith("Outbox/"));
    const teacher = courseWorkspaceSubdirectories("teacher").filter((d) => d.startsWith("Outbox/"));
    expect(teacher).not.toEqual(student);
    expect(teacher).toContain("Outbox/Lessons");
  });
});

describe("ensureCourseWorkspaceInstructionsFiles", () => {
  it("teaches the agent the course layout and names the role's categories", async () => {
    const { layer, written } = makeFakeFileSystemLayer(new Set());

    await Effect.runPromise(
      ensureCourseWorkspaceInstructionsFiles("/course", "student").pipe(Effect.provide(layer)),
    );

    expect(written.map((file) => file.path)).toEqual(["/course/AGENTS.md", "/course/CLAUDE.md"]);
    const content = written[0]?.content ?? "";
    expect(content).toContain("Outbox/<Category>/");
    expect(content).toContain("Lessons");
    expect(content).toContain("Assignments");
    // The lesson an agent is most likely to get wrong: tidying the student's own files.
    expect(content).toContain("Leave their existing files alone");
    expect(content).toBe(written[1]?.content);
  });

  it("names the other roles' categories for those roles", async () => {
    const teacher = makeFakeFileSystemLayer(new Set());
    await Effect.runPromise(
      ensureCourseWorkspaceInstructionsFiles("/class", "teacher").pipe(
        Effect.provide(teacher.layer),
      ),
    );
    expect(teacher.written[0]?.content).toContain("Rubrics");

    const researcher = makeFakeFileSystemLayer(new Set());
    await Effect.runPromise(
      ensureCourseWorkspaceInstructionsFiles("/topic", "researcher").pipe(
        Effect.provide(researcher.layer),
      ),
    );
    expect(researcher.written[0]?.content).toContain("Papers");
  });

  it("never overwrites an instruction file the student already wrote", async () => {
    const { layer, written } = makeFakeFileSystemLayer(new Set(["/course/AGENTS.md"]));

    await Effect.runPromise(
      ensureCourseWorkspaceInstructionsFiles("/course", "student").pipe(Effect.provide(layer)),
    );

    expect(written.map((file) => file.path)).toEqual(["/course/CLAUDE.md"]);
  });

  it("does not give a Hub the course layout", async () => {
    // Hubs deliver through their own git-versioned Library, and groupWorkspaceScaffold
    // explicitly forbids the Studio/Outbox directories. The two instruction sets must not
    // be able to collide in the same folder.
    const { layer, written } = makeFakeFileSystemLayer(new Set());
    await Effect.runPromise(
      ensureStudioWorkspaceInstructionsFiles("/hub").pipe(Effect.provide(layer)),
    );
    expect(written[0]?.content).not.toContain("Leave their existing files alone");
  });
});

describe("learnerRoleForSpaceIcon", () => {
  it("maps space icon to the matching learner role", () => {
    expect(learnerRoleForSpaceIcon("school")).toBe("teacher");
    expect(learnerRoleForSpaceIcon("lab")).toBe("researcher");
    expect(learnerRoleForSpaceIcon("backpack")).toBe("student");
    expect(learnerRoleForSpaceIcon(null)).toBe("student");
    expect(learnerRoleForSpaceIcon(undefined)).toBe("student");
  });
});
