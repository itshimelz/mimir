import { Effect, FileSystem, Layer, Path } from "effect";
import { describe, expect, it } from "vitest";

import {
  ensureStudioWorkspaceInstructionsFiles,
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
