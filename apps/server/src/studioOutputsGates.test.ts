// FILE: studioOutputsGates.test.ts
// Purpose: Pin the two Studio output gates to the one shared predicate. Capture and listing
//          live in different services and used to gate independently, which fails silently.
// Layer: Server guard test

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * `StudioOutputReactor` decides whether a turn's files are captured; `wsRpc` decides
 * whether captured outputs are listed. When they disagree the failure has no surface: the
 * Studio sidebar renders its honest empty state while files sit on disk. Exercising this at
 * runtime needs a live thread, a real workspace and a provider turn, so the invariant is held
 * here by reading the two call sites — the same approach as `sessionLeaseCallSites.test.ts`.
 */
const GATE_SITES = [
  { file: "orchestration/Layers/StudioOutputReactor.ts", name: "capture" },
  { file: "wsRpc.ts", name: "listing" },
] as const;

function readServerSource(relative: string): string {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
}

describe("Studio output gates", () => {
  it("routes both the capture and the listing gate through the shared predicate", () => {
    for (const site of GATE_SITES) {
      const source = readServerSource(`./${site.file}`);
      expect(source, `${site.name} gate no longer calls participatesInStudioOutputs`).toContain(
        "participatesInStudioOutputs(",
      );
      expect(
        source,
        `${site.name} gate still decides for itself via isGroupContainerKind`,
      ).not.toContain("isGroupContainerKind");
    }
  });

  it("keeps the capture gate's Git-root exclusion separate from the kind gate", () => {
    // The reactor skips Git roots because checkpoints already attribute those precisely.
    // Lifting that is phase 1.2 of the course/space plan and needs its own review, so it is
    // asserted to still be present rather than silently removed.
    const source = readServerSource("./orchestration/Layers/StudioOutputReactor.ts");
    expect(source).toContain("isGitRepository(cwd)");
  });
});
