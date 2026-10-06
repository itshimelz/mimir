import { describe, expect, it } from "vitest";

import {
  lastThreadRouteSearch,
  parseEditorView,
  resolveRestorableThreadRoute,
  shouldHoldMissingThreadRouteFallback,
  shouldHoldRememberedRouteFallback,
  shouldStartMissingThreadRouteRecovery,
  shouldStartRememberedRouteRecovery,
} from "./chatRouteRestore";

describe("resolveRestorableThreadRoute", () => {
  it("returns the last thread route when the thread still exists", () => {
    expect(
      resolveRestorableThreadRoute({
        lastThreadRoute: {
          threadId: "thread-123",
          splitViewId: "split-456",
        },
        availableThreadIds: new Set(["thread-123", "thread-789"]),
      }),
    ).toEqual({
      threadId: "thread-123",
      splitViewId: "split-456",
    });
  });

  it("returns null when the remembered thread no longer exists", () => {
    expect(
      resolveRestorableThreadRoute({
        lastThreadRoute: {
          threadId: "thread-123",
        },
        availableThreadIds: new Set(["thread-789"]),
      }),
    ).toBeNull();
  });

  it("drops a stale split id while preserving the remembered thread", () => {
    expect(
      resolveRestorableThreadRoute({
        lastThreadRoute: {
          threadId: "thread-123",
          splitViewId: "split-missing",
        },
        availableThreadIds: new Set(["thread-123"]),
        availableSplitViewIds: new Set(["split-live"]),
      }),
    ).toEqual({
      threadId: "thread-123",
    });
  });

  it("recovers a remembered route before falling back when startup has no threads yet", () => {
    expect(
      shouldStartRememberedRouteRecovery({
        lastThreadRoute: { threadId: "thread-123" },
        availableThreadCount: 0,
        recoveryState: "idle",
      }),
    ).toBe(true);
    expect(
      shouldHoldRememberedRouteFallback({
        lastThreadRoute: { threadId: "thread-123" },
        availableThreadCount: 0,
        recoveryState: "pending",
      }),
    ).toBe(true);
  });

  it("allows remembered route fallback after recovery is exhausted", () => {
    expect(
      shouldStartRememberedRouteRecovery({
        lastThreadRoute: { threadId: "thread-123" },
        availableThreadCount: 0,
        recoveryState: "done",
      }),
    ).toBe(false);
    expect(
      shouldHoldRememberedRouteFallback({
        lastThreadRoute: { threadId: "thread-123" },
        availableThreadCount: 0,
        recoveryState: "done",
      }),
    ).toBe(false);
  });

  it("recovers a missing thread route only while no server threads are known", () => {
    expect(
      shouldStartMissingThreadRouteRecovery({
        hasKnownServerThreads: false,
        recoveryState: "idle",
        routeThreadExists: false,
      }),
    ).toBe(true);
    expect(
      shouldHoldMissingThreadRouteFallback({
        hasKnownServerThreads: false,
        recoveryState: "pending",
        routeThreadExists: false,
      }),
    ).toBe(true);
    expect(
      shouldStartMissingThreadRouteRecovery({
        hasKnownServerThreads: true,
        recoveryState: "idle",
        routeThreadExists: false,
      }),
    ).toBe(false);
  });
});

describe("parseEditorView", () => {
  it("accepts the workspace editor and rejects anything else", () => {
    expect(parseEditorView("editor")).toBe("editor");
    // This value comes from localStorage, so anything unrecognised must be dropped rather
    // than navigated to — the thread route's search schema does not accept it.
    for (const value of ["chat", "Editor", "", null, undefined, 1, {}]) {
      expect(parseEditorView(value), `accepted ${JSON.stringify(value)}`).toBeUndefined();
    }
  });
});

describe("lastThreadRouteSearch", () => {
  it("restores the workspace the student was last on", () => {
    expect(lastThreadRouteSearch({ threadId: "t", view: "editor" })).toEqual({
      view: "editor",
    });
  });

  it("restores chat as an absent key rather than an undefined one", () => {
    // TanStack Router validates the search object against the route schema, where a
    // present-but-undefined key is not the same as an absent one.
    const search = lastThreadRouteSearch({ threadId: "t" });
    expect("view" in search).toBe(false);
    expect("splitViewId" in search).toBe(false);
  });

  it("carries the split and the editor view together", () => {
    expect(lastThreadRouteSearch({ threadId: "t", splitViewId: "s", view: "editor" })).toEqual({
      splitViewId: "s",
      view: "editor",
    });
  });

  it("survives a stale split being dropped by the resolver", () => {
    // The resolver strips a split id that no longer exists but must keep the view, or a
    // workspace-heavy session still lands in chat.
    const resolved = resolveRestorableThreadRoute({
      lastThreadRoute: { threadId: "t", splitViewId: "gone", view: "editor" },
      availableThreadIds: new Set(["t"]),
      availableSplitViewIds: new Set(["other"]),
    });
    expect(resolved).toEqual({ threadId: "t", view: "editor" });
    expect(lastThreadRouteSearch(resolved!)).toEqual({ view: "editor" });
  });

  it("keeps the view for a thread that still exists", () => {
    const resolved = resolveRestorableThreadRoute({
      lastThreadRoute: { threadId: "t", view: "editor" },
      availableThreadIds: new Set(["t"]),
    });
    expect(lastThreadRouteSearch(resolved!)).toEqual({ view: "editor" });
  });
});
