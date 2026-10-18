// FILE: chatRouteRestore.ts
// Purpose: Validates saved chat routes before restoring them from startup or sidebar navigation.
// Layer: Route helper
// Exports: last-thread route resolver plus empty-startup fallback policy helpers.

export type LastThreadRoute = {
  threadId: string;
  splitViewId?: string | undefined;
  /**
   * Which surface the student was last on for this thread: the chat transcript, or the
   * workspace editor (which carries the Study/Studio switch and the chat rail).
   *
   * Without it a restart always dropped the student into chat — `view=editor` lived only in
   * the URL, which is gone by the time the app cold-starts — so a workspace-heavy session was
   * silently returned to the heaviest surface.
   */
  view?: EditorView | undefined;
};

/**
 * `EditorView` mirrors the thread route's `view` search param. Duplicated as a literal union
 * rather than imported from the route module: `chatRouteRestore` is imported by startup paths
 * that must not pull in the router graph, and the validator below is what keeps the two from
 * drifting — an unrecognised persisted value is dropped rather than trusted.
 */
export type EditorView = "editor" | "studio";

export function parseEditorView(value: unknown): EditorView | undefined {
  return value === "editor" || value === "studio" ? value : undefined;
}

export type EmptyRouteRestoreRecoveryState = "idle" | "pending" | "done";

export const EMPTY_ROUTE_RESTORE_FALLBACK_DELAY_MS = 1_800;

export function resolveRestorableThreadRoute(input: {
  lastThreadRoute: LastThreadRoute | null;
  availableThreadIds: ReadonlySet<string>;
  availableSplitViewIds?: ReadonlySet<string>;
}): LastThreadRoute | null {
  const { lastThreadRoute, availableThreadIds, availableSplitViewIds } = input;
  if (!lastThreadRoute) {
    return null;
  }

  if (!availableThreadIds.has(lastThreadRoute.threadId)) {
    return null;
  }

  if (
    lastThreadRoute.splitViewId &&
    availableSplitViewIds &&
    !availableSplitViewIds.has(lastThreadRoute.splitViewId)
  ) {
    // Carries `view` across: dropping a stale split must not also drop the surface the
    // student was on, or a workspace-heavy session lands in chat anyway.
    return {
      threadId: lastThreadRoute.threadId,
      ...(lastThreadRoute.view ? { view: lastThreadRoute.view } : {}),
    };
  }

  return lastThreadRoute;
}

/**
 * The search a remembered route should restore with.
 *
 * Split and editor are independent: a workspace can be open inside a split view. `view` is
 * omitted when unset rather than sent as `undefined`, because TanStack Router validates the
 * search object against the route schema and a present-but-undefined key is not the same as an
 * absent one.
 */
export function lastThreadRouteSearch(route: LastThreadRoute): {
  splitViewId?: string | undefined;
  view?: EditorView | undefined;
} {
  return {
    ...(route.splitViewId ? { splitViewId: route.splitViewId } : {}),
    // Absent means the student was last on chat; forcing `editor` here would send a
    // chat-heavy restart into the workspace.
    ...(route.view ? { view: route.view } : {}),
  };
}

// Route fallback guards separate a stale URL from a temporarily empty startup snapshot.
export function shouldStartRememberedRouteRecovery(input: {
  lastThreadRoute: LastThreadRoute | null;
  availableThreadCount: number;
  recoveryState: EmptyRouteRestoreRecoveryState;
}): boolean {
  return Boolean(
    input.lastThreadRoute && input.availableThreadCount === 0 && input.recoveryState === "idle",
  );
}

export function shouldHoldRememberedRouteFallback(input: {
  lastThreadRoute: LastThreadRoute | null;
  availableThreadCount: number;
  recoveryState: EmptyRouteRestoreRecoveryState;
}): boolean {
  return Boolean(
    input.lastThreadRoute && input.availableThreadCount === 0 && input.recoveryState !== "done",
  );
}

export function shouldStartMissingThreadRouteRecovery(input: {
  hasKnownServerThreads: boolean;
  recoveryState: EmptyRouteRestoreRecoveryState;
  routeThreadExists: boolean;
}): boolean {
  return !input.routeThreadExists && !input.hasKnownServerThreads && input.recoveryState === "idle";
}

export function shouldHoldMissingThreadRouteFallback(input: {
  hasKnownServerThreads: boolean;
  recoveryState: EmptyRouteRestoreRecoveryState;
  routeThreadExists: boolean;
}): boolean {
  return !input.routeThreadExists && !input.hasKnownServerThreads && input.recoveryState !== "done";
}
