import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import * as NodeServices from "@effect/platform-node/NodeServices";
import { ProjectId, ThreadId, type StudioOutputEntry } from "@synara/contracts";
import { Effect, FileSystem, Layer, Path } from "effect";
import { describe, expect, it } from "vitest";

import {
  collectFileChangeActivityPathCandidates,
  collectThreadOutputRelativePaths,
  diffStudioWorkspaceScans,
  listStudioThreadOutputs,
  MAX_SCAN_ENTRIES,
  MAX_SCAN_FILES,
  MAX_THREAD_OUTPUT_FILES,
  mergeStudioThreadOutputEntries,
  scanStudioWorkspaceFiles,
  STAT_CONCURRENCY,
} from "./studioOutputs";

function checkpoint(paths: readonly string[]) {
  return { files: paths.map((path) => ({ path })) };
}

describe("collectThreadOutputRelativePaths", () => {
  it("keeps files anywhere under the root except managed input/infra subtrees", () => {
    const relativePaths = collectThreadOutputRelativePaths([
      checkpoint([
        "Outbox/Content/post.md",
        "output/pdf/report.pdf",
        "notes.md",
        "Inbox/task.md",
        "Context/reference.md",
        "Skills/skill.md",
        "tmp/scratch.py",
        "Logs/run.log",
        "AGENTS.md",
        "CLAUDE.md",
      ]),
    ]);

    expect(relativePaths).toEqual(["Outbox/Content/post.md", "output/pdf/report.pdf", "notes.md"]);
  });

  it("excludes managed subtrees case-insensitively", () => {
    const relativePaths = collectThreadOutputRelativePaths([
      checkpoint(["TMP/scratch.py", "logs/run.log", "Output/kept.pdf"]),
    ]);

    expect(relativePaths).toEqual(["Output/kept.pdf"]);
  });

  it("deduplicates across checkpoints, preferring newest-first order", () => {
    const relativePaths = collectThreadOutputRelativePaths([
      checkpoint(["Outbox/Content/old.md"]),
      checkpoint(["Outbox/Content/new.md", "Outbox/Content/old.md"]),
    ]);

    expect(relativePaths).toEqual(["Outbox/Content/new.md", "Outbox/Content/old.md"]);
  });

  it("rejects unsafe segments so no path can escape the workspace root", () => {
    const relativePaths = collectThreadOutputRelativePaths([
      checkpoint([
        "../secrets.md",
        "Outbox/../secrets.md",
        "Outbox/./file.md",
        "Outbox//double.md",
        "Outbox/Content/kept.md",
      ]),
    ]);

    expect(relativePaths).toEqual(["Outbox/Content/kept.md"]);
  });

  it("skips hidden files and node_modules anywhere under the root", () => {
    const relativePaths = collectThreadOutputRelativePaths([
      checkpoint([
        "Outbox/Content/.DS_Store",
        ".hidden/post.md",
        "site/node_modules/pkg/index.js",
        "Outbox/Content/kept.md",
      ]),
    ]);

    expect(relativePaths).toEqual(["Outbox/Content/kept.md"]);
  });

  it("skips generated and environment directories a course folder accumulates", () => {
    // A course folder is usually a repository, so the scan now runs over one. Build output
    // is regenerated rather than authored, and attributing it would fill Studio with
    // bundles instead of the lesson the student asked for. Dot-directories (.git, .venv)
    // are already covered by the hidden-segment rule above.
    const relativePaths = collectThreadOutputRelativePaths([
      checkpoint([
        "dist/bundle.js",
        "build/app.js",
        "target/debug/app",
        "out/cli.js",
        "coverage/lcov.info",
        "venv/lib/site.py",
        "__pycache__/module.pyc",
        "src/__pycache__/module.pyc",
        "site/.venv/lib/site.py",
        "Outbox/Lessons/cell-division.md",
      ]),
    ]);

    expect(relativePaths).toEqual(["Outbox/Lessons/cell-division.md"]);
  });

  it("caps the collected paths, dropping the oldest turns' files first", () => {
    const oldest = checkpoint(
      Array.from({ length: 5 }, (_unused, index) => `Outbox/Content/old-${index}.md`),
    );
    const newest = checkpoint(
      Array.from(
        { length: MAX_THREAD_OUTPUT_FILES },
        (_u, index) => `Outbox/Daily/new-${index}.md`,
      ),
    );

    const relativePaths = collectThreadOutputRelativePaths([oldest, newest]);

    expect(relativePaths).toHaveLength(MAX_THREAD_OUTPUT_FILES);
    expect(relativePaths[0]).toBe("Outbox/Daily/new-0.md");
    expect(relativePaths).not.toContain("Outbox/Content/old-0.md");
  });
});

describe("collectFileChangeActivityPathCandidates", () => {
  it("extracts provider-specific nested path fields newest first", () => {
    const paths = collectFileChangeActivityPathCandidates([
      {
        status: "completed",
        data: { item: { changes: [{ path: "Outbox/Daily/new.md" }] } },
      },
      {
        status: "completed",
        data: { input: { file_path: "Outbox/Content/post.md" } },
      },
    ]);

    expect(paths).toEqual(["Outbox/Daily/new.md", "Outbox/Content/post.md"]);
  });

  it("ignores failed activities and deduplicates repeated path fields", () => {
    const paths = collectFileChangeActivityPathCandidates([
      {
        status: "failed",
        data: { input: { filePath: "Outbox/Content/failed.md" } },
      },
      {
        status: "completed",
        data: {
          input: { path: "Outbox/Content/kept.md" },
          result: { path: "Outbox/Content/kept.md" },
        },
      },
    ]);

    expect(paths).toEqual(["Outbox/Content/kept.md"]);
  });
});

describe("diffStudioWorkspaceScans", () => {
  it("reports new and changed files, ignoring deletions and unchanged files", () => {
    const before = new Map([
      ["Outbox/kept.md", { mtimeMs: 1, size: 10 }],
      ["Outbox/touched.md", { mtimeMs: 1, size: 10 }],
      ["Outbox/resized.md", { mtimeMs: 1, size: 10 }],
      ["Outbox/deleted.md", { mtimeMs: 1, size: 10 }],
    ]);
    const after = new Map([
      ["Outbox/kept.md", { mtimeMs: 1, size: 10 }],
      ["Outbox/touched.md", { mtimeMs: 2, size: 10 }],
      ["Outbox/resized.md", { mtimeMs: 1, size: 11 }],
      ["output/pdf/new.pdf", { mtimeMs: 3, size: 99 }],
    ]);

    expect(diffStudioWorkspaceScans(before, after)).toEqual([
      "Outbox/touched.md",
      "Outbox/resized.md",
      "output/pdf/new.pdf",
    ]);
  });
});

function fakeFileInfo(type: "Directory" | "File"): FileSystem.File.Info {
  return {
    type,
    mtime: undefined,
    atime: undefined,
    birthtime: undefined,
    dev: 0,
    ino: undefined,
    mode: 0,
    nlink: undefined,
    uid: undefined,
    gid: undefined,
    rdev: undefined,
    size: FileSystem.Size(0),
    blksize: undefined,
    blocks: undefined,
  };
}

describe("scanStudioWorkspaceFiles", () => {
  it("still reaches Outbox when the rest of the workspace is enormous", async () => {
    // The walk is breadth-first, so before the frontier was seeded with Outbox a single flat
    // directory of course files exhausted the file cap before the walk ever reached the
    // artifacts. A course folder with a few thousand files is not unusual, and the result was
    // a permanently empty Studio with no error anywhere.
    const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), "synara-studio-scan-"));
    try {
      await mkdir(path.join(workspaceRoot, "slides"), { recursive: true });
      for (let index = 0; index < MAX_SCAN_FILES + 500; index += 1) {
        await writeFile(path.join(workspaceRoot, "slides", `slide-${index}.md`), "x");
      }
      await mkdir(path.join(workspaceRoot, "Outbox", "Lessons"), { recursive: true });
      await writeFile(path.join(workspaceRoot, "Outbox", "Lessons", "cell-division.md"), "# x");

      const result = await Effect.runPromise(
        scanStudioWorkspaceFiles({ workspaceRoot }).pipe(Effect.provide(NodeServices.layer)),
      );

      expect([...result.keys()]).toContain("Outbox/Lessons/cell-division.md");
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("walks a Git-rooted course folder and reports only authored files", async () => {
    // The scan now runs over repositories. This asserts the whole shape in one place: the
    // lesson is seen, and the repository's own machinery is not.
    const workspaceRoot = "/course";
    const layout: Record<
      string,
      ReadonlyArray<{ readonly name: string; readonly type: "File" | "Directory" }>
    > = {
      [workspaceRoot]: [
        { name: ".git", type: "Directory" },
        { name: ".venv", type: "Directory" },
        { name: "node_modules", type: "Directory" },
        { name: "dist", type: "Directory" },
        { name: "__pycache__", type: "Directory" },
        { name: "README.md", type: "File" },
        { name: "Outbox", type: "Directory" },
      ],
      [`${workspaceRoot}/.git`]: [{ name: "objects", type: "Directory" }],
      [`${workspaceRoot}/.git/objects`]: [{ name: "ab12", type: "File" }],
      [`${workspaceRoot}/.venv`]: [{ name: "lib", type: "Directory" }],
      [`${workspaceRoot}/.venv/lib`]: [{ name: "site.py", type: "File" }],
      [`${workspaceRoot}/node_modules`]: [{ name: "pkg", type: "Directory" }],
      [`${workspaceRoot}/node_modules/pkg`]: [{ name: "index.js", type: "File" }],
      [`${workspaceRoot}/dist`]: [{ name: "bundle.js", type: "File" }],
      [`${workspaceRoot}/__pycache__`]: [{ name: "module.pyc", type: "File" }],
      [`${workspaceRoot}/Outbox`]: [{ name: "Lessons", type: "Directory" }],
      [`${workspaceRoot}/Outbox/Lessons`]: [{ name: "cell-division.md", type: "File" }],
    };
    const fileSystemLayer = FileSystem.layerNoop({
      readDirectory: (directoryPath: string) =>
        Effect.succeed(
          (layout[directoryPath] ?? []).map((entry) =>
            entry.type === "Directory" ? entry.name : entry.name,
          ),
        ),
      readLink: () => Effect.fail(new Error("EINVAL") as never),
      stat: (entryPath: string) =>
        Effect.succeed(
          fakeFileInfo(
            Object.values(layout).some((entries) =>
              entries.some(
                (entry) => entryPath.endsWith(`/${entry.name}`) && entry.type === "Directory",
              ),
            ) && !entryPath.includes(".")
              ? "Directory"
              : "File",
          ),
        ),
    });

    const result = await Effect.runPromise(
      scanStudioWorkspaceFiles({ workspaceRoot }).pipe(
        Effect.provide(Layer.merge(fileSystemLayer, Path.layer)),
      ),
    );

    expect([...result.keys()].toSorted()).toEqual(["Outbox/Lessons/cell-division.md", "README.md"]);
  });

  it("bounds traversal by total directory entries, not only discovered files", async () => {
    const workspaceRoot = "/studio";
    const rootEntries = Array.from(
      { length: MAX_SCAN_ENTRIES + 5 },
      (_unused, index) => `directory-${index}`,
    );
    let statCallCount = 0;
    const fileSystemLayer = FileSystem.layerNoop({
      readDirectory: (directoryPath: string) =>
        Effect.succeed(directoryPath === workspaceRoot ? rootEntries : []),
      readLink: () => Effect.fail(new Error("EINVAL") as never),
      stat: () => {
        statCallCount += 1;
        return Effect.succeed(fakeFileInfo("Directory"));
      },
    });

    const result = await Effect.runPromise(
      scanStudioWorkspaceFiles({ workspaceRoot }).pipe(
        Effect.provide(Layer.merge(fileSystemLayer, Path.layer)),
      ),
    );

    expect(result.size).toBe(0);
    expect(statCallCount).toBe(MAX_SCAN_ENTRIES);
  });

  it("stats workspace entries with bounded concurrency", async () => {
    const workspaceRoot = "/studio";
    const outputEntries = Array.from({ length: 32 }, (_unused, index) => `file-${index}.md`);
    const rootEntries = [...outputEntries, "AGENTS.md", "CLAUDE.md"];
    let activeStatCount = 0;
    let maxActiveStatCount = 0;
    const fileSystemLayer = FileSystem.layerNoop({
      readDirectory: (directoryPath: string) =>
        Effect.succeed(directoryPath === workspaceRoot ? rootEntries : []),
      stat: () =>
        Effect.gen(function* () {
          activeStatCount += 1;
          maxActiveStatCount = Math.max(maxActiveStatCount, activeStatCount);
          yield* Effect.sleep("2 millis");
          activeStatCount -= 1;
          return fakeFileInfo("File");
        }),
    });

    const result = await Effect.runPromise(
      scanStudioWorkspaceFiles({ workspaceRoot }).pipe(
        Effect.provide(Layer.merge(fileSystemLayer, Path.layer)),
      ),
    );

    expect(result.size).toBe(outputEntries.length);
    expect(result.has("AGENTS.md")).toBe(false);
    expect(result.has("CLAUDE.md")).toBe(false);
    expect(maxActiveStatCount).toBeGreaterThan(1);
    expect(maxActiveStatCount).toBeLessThanOrEqual(STAT_CONCURRENCY);
  });
});

/**
 * Fake `FileSystem` (+ real `Path`) layer whose `stat` looks up mtimes from
 * `mtimesByRelativePath` (relative to the workspace root); unknown paths fail like a
 * missing file would.
 */
function makeFakeStudioRootLayer(input: {
  readonly mtimesByRelativePath: ReadonlyMap<string, number>;
  readonly workspaceRoot: string;
  readonly directoryPaths?: ReadonlySet<string>;
}) {
  const fileSystemLayer = FileSystem.layerNoop({
    stat: (fullPath: string) => {
      const relativePath = fullPath.slice(input.workspaceRoot.length + 1);
      const isDirectory = input.directoryPaths?.has(relativePath) === true;
      const modifiedAtMs = input.mtimesByRelativePath.get(relativePath);
      if (modifiedAtMs === undefined && !isDirectory) {
        return Effect.fail(new Error("ENOENT") as never);
      }
      return Effect.succeed({
        type: isDirectory ? ("Directory" as const) : ("File" as const),
        mtime: new Date(modifiedAtMs ?? 0),
        atime: undefined,
        birthtime: undefined,
        dev: 0,
        ino: undefined,
        mode: 0,
        nlink: undefined,
        uid: undefined,
        gid: undefined,
        rdev: undefined,
        size: FileSystem.Size(0),
        blksize: undefined,
        blocks: undefined,
      } satisfies FileSystem.File.Info);
    },
  });
  return Layer.merge(fileSystemLayer, Path.layer);
}

describe("listStudioThreadOutputs", () => {
  it("returns existing files most recently modified first, with name and full path", async () => {
    const workspaceRoot = "/studio";
    const layer = makeFakeStudioRootLayer({
      workspaceRoot,
      mtimesByRelativePath: new Map([
        ["Outbox/Content/old.md", 1_000],
        ["output/pdf/new.pdf", 3_000],
      ]),
    });

    const result = await Effect.runPromise(
      listStudioThreadOutputs({
        workspaceRoot,
        checkpoints: [checkpoint(["Outbox/Content/old.md", "output/pdf/new.pdf"])],
      }).pipe(Effect.provide(layer)),
    );

    expect(result.entries).toEqual([
      {
        name: "new.pdf",
        relativePath: "output/pdf/new.pdf",
        fullPath: "/studio/output/pdf/new.pdf",
        modifiedAt: new Date(3_000).toISOString(),
      },
      {
        name: "old.md",
        relativePath: "Outbox/Content/old.md",
        fullPath: "/studio/Outbox/Content/old.md",
        modifiedAt: new Date(1_000).toISOString(),
      },
    ]);
  });

  it("omits files that no longer exist and non-file entries instead of failing", async () => {
    const workspaceRoot = "/studio";
    const layer = makeFakeStudioRootLayer({
      workspaceRoot,
      mtimesByRelativePath: new Map([["Outbox/Content/kept.md", 5]]),
      directoryPaths: new Set(["Outbox/Content/folder"]),
    });

    const result = await Effect.runPromise(
      listStudioThreadOutputs({
        workspaceRoot,
        checkpoints: [
          checkpoint([
            "Outbox/Content/deleted.md",
            "Outbox/Content/folder",
            "Outbox/Content/kept.md",
          ]),
        ],
      }).pipe(Effect.provide(layer)),
    );

    expect(result.entries.map((entry) => entry.relativePath)).toEqual(["Outbox/Content/kept.md"]);
  });

  it("attributes outputs from file-change activities when no Git checkpoints exist", async () => {
    const workspaceRoot = "/studio";
    const layer = makeFakeStudioRootLayer({
      workspaceRoot,
      mtimesByRelativePath: new Map([
        ["Outbox/Content/relative.md", 10],
        ["output/pdf/absolute.pdf", 20],
      ]),
    });

    const result = await Effect.runPromise(
      listStudioThreadOutputs({
        workspaceRoot,
        checkpoints: [],
        fileChangeActivityPayloads: [
          {
            status: "completed",
            data: {
              changes: [
                { path: "/studio/output/pdf/absolute.pdf" },
                { file_path: "Outbox/Content/relative.md" },
                { path: "/studio/Inbox/not-an-output.md" },
                { path: "/outside/escape.md" },
              ],
            },
          },
        ],
      }).pipe(Effect.provide(layer)),
    );

    expect(result.entries.map((entry) => entry.relativePath)).toEqual([
      "output/pdf/absolute.pdf",
      "Outbox/Content/relative.md",
    ]);
  });
});

describe("mergeStudioThreadOutputEntries", () => {
  const entry = (overrides: Partial<StudioOutputEntry> & { readonly fullPath: string }) => ({
    name: overrides.fullPath.split("/").at(-1)!,
    relativePath: overrides.fullPath,
    modifiedAt: "2026-07-08T00:00:00.000Z",
    ...overrides,
  });

  it("merges every thread's outputs into one list, newest first", () => {
    const merged = mergeStudioThreadOutputEntries([
      {
        threadId: ThreadId.makeUnsafe("t1"),
        projectId: ProjectId.makeUnsafe("p1"),
        projectName: "Cell Biology",
        entries: [
          entry({
            fullPath: "/course/Outbox/Lessons/a.md",
            modifiedAt: "2026-07-08T01:00:00.000Z",
          }),
        ],
      },
      {
        threadId: ThreadId.makeUnsafe("t2"),
        projectId: ProjectId.makeUnsafe("p1"),
        projectName: "Cell Biology",
        entries: [
          entry({
            fullPath: "/course/Outbox/Quizzes/b.md",
            modifiedAt: "2026-07-08T03:00:00.000Z",
          }),
        ],
      },
    ]);

    expect(merged.map((item) => item.fullPath)).toEqual([
      "/course/Outbox/Quizzes/b.md",
      "/course/Outbox/Lessons/a.md",
    ]);
  });

  it("attributes each artifact to the project and thread that produced it", () => {
    const merged = mergeStudioThreadOutputEntries([
      {
        threadId: ThreadId.makeUnsafe("bio"),
        projectId: ProjectId.makeUnsafe("cell"),
        projectName: "Cell Biology",
        entries: [entry({ fullPath: "/bio/Outbox/Lessons/mitosis.md" })],
      },
      {
        threadId: ThreadId.makeUnsafe("stats"),
        projectId: ProjectId.makeUnsafe("stats"),
        projectName: "Statistics",
        entries: [entry({ fullPath: "/stats/Outbox/Lessons/mean.md" })],
      },
    ]);

    const bio = merged.find((item) => item.fullPath.startsWith("/bio"));
    expect(bio).toMatchObject({
      threadId: "bio",
      projectId: "cell",
      projectName: "Cell Biology",
    });
    const stats = merged.find((item) => item.fullPath.startsWith("/stats"));
    expect(stats).toMatchObject({
      threadId: "stats",
      projectId: "stats",
      projectName: "Statistics",
    });
  });

  it("keeps identically named files from two projects separate", () => {
    // The whole reason a space aggregates: two courses can each have Outbox/Lessons/week1.md.
    const merged = mergeStudioThreadOutputEntries([
      {
        threadId: ThreadId.makeUnsafe("t1"),
        projectId: ProjectId.makeUnsafe("p1"),
        projectName: "Biology",
        entries: [entry({ fullPath: "/bio/Outbox/Lessons/week1.md" })],
      },
      {
        threadId: ThreadId.makeUnsafe("t2"),
        projectId: ProjectId.makeUnsafe("p2"),
        projectName: "Physics",
        entries: [entry({ fullPath: "/phys/Outbox/Lessons/week1.md" })],
      },
    ]);

    expect(merged).toHaveLength(2);
  });

  it("deduplicates one file claimed by several threads, keeping the first seen", () => {
    // Concurrent turns over a shared root can both claim a file. Attribution is generous
    // rather than lossy (the reactor's own tradeoff), so the newest wins and the rest are
    // dropped rather than shown twice.
    const shared = { fullPath: "/course/Outbox/Lessons/shared.md" };
    const merged = mergeStudioThreadOutputEntries([
      {
        threadId: ThreadId.makeUnsafe("newest"),
        projectId: ProjectId.makeUnsafe("p1"),
        projectName: "Course",
        entries: [entry(shared)],
      },
      {
        threadId: ThreadId.makeUnsafe("older"),
        projectId: ProjectId.makeUnsafe("p1"),
        projectName: "Course",
        entries: [entry(shared)],
      },
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.threadId).toBe("newest");
  });

  it("caps the merged list so one chatty project cannot make the response unbounded", () => {
    const merged = mergeStudioThreadOutputEntries(
      [
        {
          threadId: ThreadId.makeUnsafe("t1"),
          projectId: ProjectId.makeUnsafe("p1"),
          projectName: "Course",
          entries: Array.from({ length: 30 }, (_unused, index) =>
            entry({ fullPath: `/course/Outbox/Lessons/f${index}.md` }),
          ),
        },
      ],
      10,
    );

    expect(merged).toHaveLength(10);
  });

  it("returns nothing for a space that has produced nothing", () => {
    expect(mergeStudioThreadOutputEntries([])).toEqual([]);
  });
});
