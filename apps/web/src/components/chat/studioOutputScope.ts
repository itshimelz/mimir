// FILE: studioOutputScope.ts
// Purpose: Decide which Studio output scope the workspace's artifact column should read.
// Layer: Web domain helper (no React, no I/O)
// Exports: resolveStudioOutputScope

import type { ProjectId, StudioOutputEntry, ThreadId } from "@synara/contracts";

/**
 * Studio lists artifacts at one of two scopes.
 *
 * A course has to accumulate: a student asks for a lesson in one conversation, starts a new
 * chat the next day, and their work must still be there. So when the project's folder is
 * filed in a space, the column reads the space-scoped list, which aggregates every project and
 * thread in it. A project not in a space — still Void — falls back to this thread's list,
 * because there is nothing to aggregate it with yet.
 *
 * Kept pure so the choice is testable without standing up the editor view and both queries.
 */
export type StudioOutputScope =
  | { readonly kind: "project"; readonly projectId: ProjectId }
  | { readonly kind: "thread"; readonly threadId: ThreadId }
  | { readonly kind: "none" };

export function resolveStudioOutputScope(input: {
  readonly projectId: ProjectId | null | undefined;
  readonly threadId: ThreadId | null | undefined;
}): StudioOutputScope {
  if (input.projectId) {
    return { kind: "project", projectId: input.projectId };
  }
  if (input.threadId) {
    return { kind: "thread", threadId: input.threadId };
  }
  return { kind: "none" };
}

/**
 * The entries and pending state for whichever scope resolved.
 *
 * `isPending` rather than `isFetching`: a space list that has already resolved must keep its
 * artifacts on screen during a refetch, or the student loses the row they are reading.
 */
export function resolveStudioOutputEntries(input: {
  readonly scope: StudioOutputScope;
  readonly projectEntries: ReadonlyArray<StudioOutputEntry> | undefined;
  readonly projectIsPending: boolean;
  readonly threadEntries: ReadonlyArray<StudioOutputEntry> | undefined;
  readonly threadIsPending: boolean;
}): { readonly entries: ReadonlyArray<StudioOutputEntry>; readonly isPending: boolean } {
  if (input.scope.kind === "project") {
    return {
      entries: input.projectEntries ?? [],
      isPending: input.projectIsPending && input.projectEntries === undefined,
    };
  }
  if (input.scope.kind === "thread") {
    return {
      entries: input.threadEntries ?? [],
      isPending: input.threadIsPending && input.threadEntries === undefined,
    };
  }
  // No scope at all: nothing was requested, so this is empty rather than pending.
  return { entries: [], isPending: false };
}
