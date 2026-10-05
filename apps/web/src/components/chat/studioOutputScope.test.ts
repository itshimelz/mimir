import { SpaceId, ThreadId } from "@synara/contracts";
import { describe, expect, it } from "vitest";

import { resolveStudioOutputEntries, resolveStudioOutputScope } from "./studioOutputScope";

const SPACE = SpaceId.makeUnsafe("course-1");
const THREAD = ThreadId.makeUnsafe("thread-1");
const OTHER_THREAD = ThreadId.makeUnsafe("thread-2");

const entry = (name: string) => ({
  name,
  relativePath: `Outbox/Lessons/${name}`,
  fullPath: `/courses/cell/Outbox/Lessons/${name}`,
  modifiedAt: "2026-07-08T10:00:00.000Z",
});

describe("resolveStudioOutputScope", () => {
  it("prefers the space when the project is filed in one", () => {
    expect(resolveStudioOutputScope({ spaceId: SPACE, threadId: THREAD })).toEqual({
      kind: "space",
      spaceId: SPACE,
    });
  });

  it("falls back to the thread when the project is not in a space", () => {
    // A folder added straight from disk lands in Void until it is filed, and there is
    // nothing to aggregate it with yet.
    for (const spaceId of [null, undefined]) {
      expect(resolveStudioOutputScope({ spaceId, threadId: THREAD })).toEqual({
        kind: "thread",
        threadId: THREAD,
      });
    }
  });

  it("reports no scope when there is neither a space nor a thread", () => {
    expect(resolveStudioOutputScope({ spaceId: null, threadId: null })).toEqual({ kind: "none" });
  });
});

describe("resolveStudioOutputEntries", () => {
  const base = {
    spaceEntries: undefined,
    spaceIsPending: false,
    threadEntries: undefined,
    threadIsPending: false,
  } as const;

  it("reads the space entries when the scope is a space", () => {
    const result = resolveStudioOutputEntries({
      ...base,
      scope: { kind: "space", spaceId: SPACE },
      spaceEntries: [entry("mitosis.md"), entry("meiosis.md")],
      threadEntries: [entry("this-thread-only.md")],
    });

    expect(result.entries.map((item) => item.name)).toEqual(["mitosis.md", "meiosis.md"]);
  });

  it("reads the thread entries when the scope is a thread", () => {
    const result = resolveStudioOutputEntries({
      ...base,
      scope: { kind: "thread", threadId: THREAD },
      spaceEntries: [entry("other-space.md")],
      threadEntries: [entry("this-thread-only.md")],
    });

    expect(result.entries.map((item) => item.name)).toEqual(["this-thread-only.md"]);
  });

  it("keeps resolved entries visible during a refetch", () => {
    // `isPending` rather than `isFetching`: replacing a populated list with a spinner would
    // take away the row the student is reading every time a capture lands elsewhere.
    const result = resolveStudioOutputEntries({
      ...base,
      scope: { kind: "space", spaceId: SPACE },
      spaceEntries: [entry("mitosis.md")],
      spaceIsPending: true,
    });

    expect(result.isPending).toBe(false);
    expect(result.entries).toHaveLength(1);
  });

  it("reports pending only on a first load", () => {
    const result = resolveStudioOutputEntries({
      ...base,
      scope: { kind: "space", spaceId: SPACE },
      spaceIsPending: true,
    });

    expect(result.isPending).toBe(true);
    expect(result.entries).toEqual([]);
  });

  it("is empty rather than pending with no scope at all", () => {
    // Nothing was requested, so claiming to be loading would be a spinner that never resolves.
    const result = resolveStudioOutputEntries({
      ...base,
      scope: { kind: "none" },
      spaceIsPending: true,
      threadIsPending: true,
    });

    expect(result).toEqual({ entries: [], isPending: false });
  });

  it("carries the same artifacts whichever thread the space is read from", () => {
    // The whole point of the space scope: the list does not change with the conversation.
    const spaceEntries = [entry("mitosis.md"), entry("quiz.md")];
    const fromFirstThread = resolveStudioOutputEntries({
      ...base,
      scope: { kind: "space", spaceId: SPACE },
      spaceEntries,
    });
    const fromSecondThread = resolveStudioOutputEntries({
      ...base,
      scope: { kind: "space", spaceId: SPACE },
      spaceEntries,
    });

    expect(fromFirstThread.entries).toEqual(fromSecondThread.entries);
    expect(fromFirstThread.entries).toHaveLength(2);
    expect(OTHER_THREAD).not.toBe(THREAD);
  });
});
