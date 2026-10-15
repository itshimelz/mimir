// FILE: studioOutputs.ts
// Purpose: One rule for which project kinds take part in Studio output attribution, shared
//          by the capture reactor and the listing RPC so the two can never disagree.
// Layer: Shared domain helper
// Exports: participatesInStudioOutputs, studioWorkspaceLayoutFor

import type { ProjectKind } from "@synara/contracts";

import { isGroupContainerKind } from "./projectContainers";

/**
 * Whether files produced under this project's workspace should be attributed as Studio
 * outputs.
 *
 * Both sides of the feature must answer this identically. They used to each call
 * `isGroupContainerKind` independently, which meant a future change applied to one gate
 * and not the other would capture artifacts the listing refused to show — or worse, show
 * outputs nothing had captured. Both failures are silent: the user sees an empty Studio
 * with no error anywhere. One predicate, one answer.
 *
 * Ordinary projects are included: a course folder is an ordinary project, and a student
 * asking for a lesson in one should get the same Studio as any other workspace.
 *
 * `undefined` is treated as the default `"project"` kind, matching `isOrdinaryProjectRow`,
 * so a missing kind from a partially-hydrated shell does not silently disable capture.
 */
export function participatesInStudioOutputs(kind: ProjectKind | undefined): boolean {
  return studioWorkspaceLayoutFor(kind) !== null;
}

/**
 * Which scaffolded layout a project kind uses, or `null` when it takes no part in Studio
 * output attribution at all.
 *
 * The legacy Studio and Hub containers share the creator-economy Outbox set; an ordinary
 * project gets the course set. Derived from the one gate above rather than a second
 * condition, so a kind can never be attributed but scaffolded with the wrong instructions.
 */
export function studioWorkspaceLayoutFor(
  kind: ProjectKind | undefined,
): "studio" | "course" | null {
  if (isGroupContainerKind(kind)) return "studio";
  return (kind ?? "project") === "project" ? "course" : null;
}
