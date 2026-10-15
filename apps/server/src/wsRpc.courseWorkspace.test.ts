// FILE: wsRpc.courseWorkspace.test.ts
// Purpose: Tests for course workspace directory preparation and instruction management.
// Layer: Server unit test

import { Effect, FileSystem, Layer, Path } from "effect";
import { describe, expect, it } from "vitest";

import {
  courseWorkspaceSubdirectories,
  prepareCourseWorkspaceRoot,
} from "./studioWorkspaceScaffold";

function makeFakeFileSystemLayer(
  initialExistingPaths: ReadonlySet<string> = new Set(),
  initialFileContents: ReadonlyMap<string, string> = new Map(),
) {
  const existing = new Set<string>(initialExistingPaths);
  const contents = new Map<string, string>(initialFileContents);
  const createdDirs: string[] = [];
  const writtenFiles: Array<{ path: string; content: string }> = [];

  const fileSystemLayer = FileSystem.layerNoop({
    exists: (path: string) => Effect.succeed(existing.has(path)),
    readFileString: (path: string) => Effect.succeed(contents.get(path) ?? ""),
    writeFileString: (path: string, content: string) =>
      Effect.sync(() => {
        existing.add(path);
        contents.set(path, content);
        writtenFiles.push({ path, content });
      }),
    makeDirectory: (path: string) =>
      Effect.sync(() => {
        existing.add(path);
        createdDirs.push(path);
      }),
  });

  return {
    layer: Layer.merge(fileSystemLayer, Path.layer),
    createdDirs,
    writtenFiles,
    existing,
    contents,
  };
}

describe("course workspace preparation", () => {
  it("scaffolds all student directories and writes instruction files into a new workspace", async () => {
    const root = "/courses/cs101";
    const { layer, createdDirs, writtenFiles, existing, contents } = makeFakeFileSystemLayer();

    const result = await Effect.runPromise(
      prepareCourseWorkspaceRoot(root, "student").pipe(Effect.provide(layer)),
    );

    // Verify scaffolded directories result
    expect(result.scaffoldedDirectories).toEqual(courseWorkspaceSubdirectories("student"));
    expect(result.scaffoldedDirectories).toContain("Inbox");
    expect(result.scaffoldedDirectories).toContain(".mimir/context");
    expect(result.scaffoldedDirectories).toContain(".mimir/tmp");
    expect(result.scaffoldedDirectories).toContain("Outbox/Lessons");
    expect(result.scaffoldedDirectories).toContain("Outbox/Quizzes");
    expect(result.scaffoldedDirectories).toContain("Outbox/Notes");
    expect(result.scaffoldedDirectories).toContain("Outbox/Images");

    // Verify directories were created in the filesystem
    for (const sub of result.scaffoldedDirectories) {
      expect(existing.has(`${root}/${sub}`)).toBe(true);
    }

    // Verify instruction files were created
    expect(existing.has(`${root}/AGENTS.md`)).toBe(true);
    expect(existing.has(`${root}/CLAUDE.md`)).toBe(true);
    expect(contents.get(`${root}/AGENTS.md`)).toContain("# Course Workspace");
    expect(contents.get(`${root}/AGENTS.md`)).toContain("Inbox/");
    expect(contents.get(`${root}/AGENTS.md`)).toContain("Outbox/<Category>/");
    expect(contents.get(`${root}/CLAUDE.md`)).toBe(contents.get(`${root}/AGENTS.md`));
  });

  it("is idempotent and succeeds when run repeatedly on an existing course folder", async () => {
    const root = "/courses/math201";
    const { layer, writtenFiles } = makeFakeFileSystemLayer();

    // First run
    const result1 = await Effect.runPromise(
      prepareCourseWorkspaceRoot(root, "student").pipe(Effect.provide(layer)),
    );
    expect(result1.scaffoldedDirectories.length).toBeGreaterThan(0);
    const writesAfterFirstRun = writtenFiles.length;

    // Second run
    const result2 = await Effect.runPromise(
      prepareCourseWorkspaceRoot(root, "student").pipe(Effect.provide(layer)),
    );
    expect(result2.scaffoldedDirectories).toEqual(result1.scaffoldedDirectories);

    // Instructions should not be rewritten since they already match the latest template
    expect(writtenFiles.length).toBe(writesAfterFirstRun);
  });

  it("does not clobber user-customized AGENTS.md or CLAUDE.md", async () => {
    const root = "/courses/bio101";
    const customContent = "# Biology 101 Rules\nAlways reference Chapter 4 syllabus notes.\n";
    const initialPaths = new Set([`${root}/AGENTS.md`]);
    const initialContents = new Map([[`${root}/AGENTS.md`, customContent]]);

    const { layer, contents } = makeFakeFileSystemLayer(initialPaths, initialContents);

    await Effect.runPromise(
      prepareCourseWorkspaceRoot(root, "student").pipe(Effect.provide(layer)),
    );

    // AGENTS.md must retain user content untouched
    expect(contents.get(`${root}/AGENTS.md`)).toBe(customContent);
    // Missing CLAUDE.md should still be created
    expect(contents.has(`${root}/CLAUDE.md`)).toBe(true);
    expect(contents.get(`${root}/CLAUDE.md`)).toContain("# Course Workspace");
  });

  it("scaffolds role-specific directories when role is teacher or researcher", async () => {
    const root = "/courses/teacher-room";
    const { layer, existing } = makeFakeFileSystemLayer();

    const result = await Effect.runPromise(
      prepareCourseWorkspaceRoot(root, "teacher").pipe(Effect.provide(layer)),
    );

    expect(result.scaffoldedDirectories).toContain("Outbox/Rubrics");
    expect(result.scaffoldedDirectories).toContain("Outbox/Gradebook");
    expect(existing.has(`${root}/Outbox/Rubrics`)).toBe(true);
    expect(existing.has(`${root}/Outbox/Gradebook`)).toBe(true);
  });

  it("registers coursePrepareWorkspace with standard request classification", async () => {
    const { classifyWsRequest } = await import("./wsRequestAdmission");
    const { WS_METHODS } = await import("@synara/contracts");
    expect(WS_METHODS.coursePrepareWorkspace).toBe("course.prepareWorkspace");
    expect(classifyWsRequest(WS_METHODS.coursePrepareWorkspace)).toBe("standard");
  });
});
