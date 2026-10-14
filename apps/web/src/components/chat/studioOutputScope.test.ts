import { ProjectId, ThreadId } from "@synara/contracts";
import { describe, expect, it } from "vitest";

import { resolveStudioOutputEntries, resolveStudioOutputScope } from "./studioOutputScope";

const PROJECT = ProjectId.makeUnsafe("course-1");
const THREAD = ThreadId.makeUnsafe("thread-1");
const OTHER_THREAD = ThreadId.makeUnsafe("thread-2");

const entry = (name: string) => ({
  name,
  relativePath: `Outbox/Lessons/${name}`,
  fullPath: `/courses/cell/Outbox/Lessons/${name}`,
  modifiedAt: "2026-07-08T10:00:00.000Z",
});

describe("resolveStudioOutputScope", () => {
  it("reads the project when the course is filed by a single project", () => {
    expect(resolveStudioOutputScope({ projectId: PROJECT, threadId: THREAD })).toEqual({
      kind: "project",
      projectId: PROJECT,
    });
  });

  it("falls back to the thread when the course is not in a project", () => {
    // A folder added straight from disk still lands in Void until it is filed, and there is
    // nothing to aggregate it with yet.
    for (const projectId of [null, undefined]) {
      expect(resolveStudioOutputScope({ projectId, threadId: THREAD })).toEqual({
        kind: "thread",
        threadId: THREAD,
      });
    }
  });

  it("reports no scope when there is neither a project nor a thread", () => {
    expect(resolveStudioOutputScope({ projectId: null, threadId: null })).toEqual({ kind: "none" });
  });
});

describe("resolveStudioOutputEntries", () => {
  const base = {
    projectEntries: undefined,
    projectIsPending: false,
    threadEntries: undefined,
    threadIsPending: false,
  } as const;

  it("reads the project entries when the scope is a project", () => {
    const result = resolveStudioOutputEntries({
      ...base,
      scope: { kind: "project", projectId: PROJECT },
      projectEntries: [entry("mitosis.md"), entry("meiosis.md")],
      threadEntries: [entry("this-thread-only.md")],
    });

    expect(result.entries.map((item) => item.name)).toEqual(["mitosis.md", "meiosis.md"]);
  });

  it("reads the thread entries when the scope is a thread", () => {
    const result = resolveStudioOutputEntries({
      ...base,
      scope: { kind: "thread", threadId: THREAD },
      projectEntries: [entry("other-project.md")],
      threadEntries: [entry("this-thread-only.md")],
    });

    expect(result.entries.map((item) => item.name)).toEqual(["this-thread-only.md"]);
  });

  it("keeps resolved entries visible during a refetch", () => {
    // `isPending` rather than `isFetching`: replacing a populated list with a spinner would
    // take away the row the student is reading every time a capture lands elsewhere.
    const result = resolveStudioOutputEntries({
      ...base,
      scope: { kind: "project", projectId: PROJECT },
      projectEntries: [entry("mitosis.md")],
      projectIsPending: true,
    });

    expect(result.isPending).toBe(false);
    expect(result.entries).toHaveLength(1);
  });

  it("reports pending only on a first load", () => {
    const result = resolveStudioOutputEntries({
      ...base,
      scope: { kind: "project", projectId: PROJECT },
      projectIsPending: true,
    });

    expect(result.isPending).toBe(true);
    expect(result.entries).toEqual([]);
  });

  it("is empty rather than pending with no scope at all", () => {
    // Nothing was requested, so claiming to be loading would be a spinner that never resolves.
    const result = resolveStudioOutputEntries({
      ...base,
      scope: { kind: "none" },
      projectIsPending: true,
      threadIsPending: true,
    });

    expect(result).toEqual({ entries: [], isPending: false });
  });

  it("carries the same artifacts whichever thread the project is read from", () => {
    // The whole point of the project scope: the list does not change with the conversation.
    const projectEntries = [entry("mitosis.md"), entry("quiz.md")];
    const fromFirstThread = resolveStudioOutputEntries({
      ...base,
      scope: { kind: "project", projectId: PROJECT },
      projectEntries,
    });
    const fromSecondThread = resolveStudioOutputEntries({
      ...base,
      scope: { kind: "project", projectId: PROJECT },
      projectEntries,
    });

    expect(fromFirstThread.entries).toEqual(fromSecondThread.entries);
    expect(fromFirstThread.entries).toHaveLength(2);
    expect(OTHER_THREAD).not.toBe(THREAD);
  });
});
