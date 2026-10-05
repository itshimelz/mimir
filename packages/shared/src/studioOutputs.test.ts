import { describe, expect, it } from "vitest";

import { isGroupContainerKind } from "./projectContainers";
import { participatesInStudioOutputs } from "./studioOutputs";

/**
 * The capture gate and the listing gate must agree for every kind. They used to each call
 * `isGroupContainerKind` independently, and a change applied to one and not the other fails
 * silently: artifacts get captured but never listed, or listed having never been captured.
 * The user just sees an empty Studio and no error. One predicate, one answer.
 *
 * The call sites are pinned by `apps/server/src/studioOutputsGates.test.ts`, which lives with
 * the two services it guards. What matters here is that the shared rule itself is total and
 * deterministic across every kind, and that it only ever widens the old container rule.
 */
describe("participatesInStudioOutputs", () => {
  it("includes ordinary projects so a course folder produces artifacts", () => {
    expect(participatesInStudioOutputs("project")).toBe(true);
  });

  it("keeps the legacy Studio and group containers", () => {
    expect(participatesInStudioOutputs("studio")).toBe(true);
    expect(participatesInStudioOutputs("group")).toBe(true);
  });

  it("excludes the managed Home chat container", () => {
    expect(participatesInStudioOutputs("chat")).toBe(false);
  });

  it("treats a missing kind as the default project kind", () => {
    // A partially-hydrated project shell must not silently disable capture.
    expect(participatesInStudioOutputs(undefined)).toBe(true);
  });

  it("only ever widens the container rule it generalizes", () => {
    // Every kind the old gate admitted is still admitted, so this is a widening and never
    // a regression of existing Studio or Hub behavior.
    for (const kind of ["project", "chat", "studio", "group", undefined] as const) {
      if (isGroupContainerKind(kind)) {
        expect(participatesInStudioOutputs(kind), `${String(kind)} was admitted before`).toBe(true);
      }
    }
  });

  it("answers deterministically for every kind", () => {
    for (const kind of ["project", "chat", "studio", "group", undefined] as const) {
      expect(participatesInStudioOutputs(kind)).toBe(participatesInStudioOutputs(kind));
    }
  });
});
