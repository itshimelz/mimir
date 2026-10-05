import { Effect, FileSystem, Layer, Path } from "effect";
import { describe, expect, it } from "vitest";

import {
  courseWorkspaceSubdirectories,
  ensureCourseWorkspaceInstructionsFiles,
  ensureStudioWorkspaceInstructionsFiles,
} from "./studioWorkspaceScaffold";

function makeFakeFileSystemLayer(existingPaths: ReadonlySet<string>) {
  const written: Array<{ path: string; content: string }> = [];
  const fileSystemLayer = FileSystem.layerNoop({
    exists: (path: string) => Effect.succeed(existingPaths.has(path)),
    writeFileString: (path: string, content: string) =>
      Effect.sync(() => {
        written.push({ path, content });
      }),
  });
  return { layer: Layer.merge(fileSystemLayer, Path.layer), written };
}

describe("ensureStudioWorkspaceInstructionsFiles", () => {
  it("writes AGENTS.md and CLAUDE.md with the same instructions when missing", async () => {
    const { layer, written } = makeFakeFileSystemLayer(new Set());

    await Effect.runPromise(
      ensureStudioWorkspaceInstructionsFiles("/studio").pipe(Effect.provide(layer)),
    );

    expect(written.map((file) => file.path)).toEqual(["/studio/AGENTS.md", "/studio/CLAUDE.md"]);
    expect(written[0]?.content).toContain("Outbox/<Category>/");
    expect(written[0]?.content).toBe(written[1]?.content);
  });

  it("never overwrites an instruction file the user already has", async () => {
    const { layer, written } = makeFakeFileSystemLayer(new Set(["/studio/AGENTS.md"]));

    await Effect.runPromise(
      ensureStudioWorkspaceInstructionsFiles("/studio").pipe(Effect.provide(layer)),
    );

    expect(written.map((file) => file.path)).toEqual(["/studio/CLAUDE.md"]);
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
      for (const support of ["Inbox", "Context", "Logs", "Skills", "tmp", "Outbox/Images"]) {
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
