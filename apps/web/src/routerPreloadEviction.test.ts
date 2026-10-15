// FILE: routerPreloadEviction.test.ts
// Purpose: Guards the Mimir patch to @tanstack/router-core
//          (patches/@tanstack%2Frouter-core@1.167.3.patch). A navigation that
//          commits while a speculative preload is still loading drops the
//          preloaded match, and `loadRouteMatch` used to dereference it and log
//          "Cannot read properties of undefined (reading '_nonReactive')" on
//          every warm-up. Delete this test with the patch.
// Layer: Web routing tests
// Depends on: TanStack Router memory history, and the patched router-core

import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
}

describe("preload eviction", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps a preload quiet when a navigation evicts its match mid-load", async () => {
    const loaderGate = deferred();
    let loaderRuns = 0;

    const rootRoute = createRootRoute();
    const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/" });
    const slowRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/slow",
      loader: async () => {
        loaderRuns += 1;
        await loaderGate.promise;
        return "slow";
      },
      // A preloaded match is normally retained for minutes, so expire it at the
      // next commit to make the eviction below deterministic, not a race.
      preloadGcTime: 0,
    });
    const otherRoute = createRoute({ getParentRoute: () => rootRoute, path: "/other" });

    const history = createMemoryHistory({ initialEntries: ["/"] });
    const router = createRouter({
      routeTree: rootRoute.addChildren([indexRoute, slowRoute, otherRoute]),
      history,
      // Node has no document; only the client store matters to this code path.
      isServer: false,
      origin: "http://localhost",
    });
    await router.load();

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    // Park the preload inside its loader so the navigation commits underneath it.
    const preload = router.preloadRoute({ to: "/slow" });
    await vi.waitFor(() => expect(loaderRuns).toBe(1));

    // Commit a navigation underneath the parked preload the same way the app does.
    history.push("/other");
    await router.load();
    // The premise: the commit evicted the match the preload is still holding.
    expect(router.state.cachedMatches.some((match) => match.id === "/slow")).toBe(false);

    loaderGate.resolve();
    await preload;

    const logged = consoleError.mock.calls.map((call) => call.map(String).join(" "));
    expect(logged.filter((message) => message.includes("_nonReactive"))).toEqual([]);
  });
});
