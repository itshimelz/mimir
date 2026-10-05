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

  it("scans Git roots too, so an untracked lesson file is captured", () => {
    // The reactor exists for files shell subprocesses write, which no file-change tool
    // activity reports and which checkpoints only see once committed. Skipping Git roots
    // therefore left every course folder capturing nothing. The tree walk is safe there
    // because dot-directories (`.git`, `.venv`) are skipped as hidden entries and
    // generated directories are excluded by name; asserted below.
    const source = readServerSource("./orchestration/Layers/StudioOutputReactor.ts");
    expect(source, "capture still skips Git roots").not.toContain("isGitRepository");
  });

  it("excludes the generated directories a repository accumulates", () => {
    const source = readServerSource("./studioOutputs.ts");
    for (const directory of ["dist", "build", "target", "out", "coverage", "venv", "__pycache__"]) {
      expect(source, `${directory} is not excluded from the scan`).toContain(`"${directory}"`);
    }
  });

  it("still skips dot-directories, which is what keeps the Git walk safe", () => {
    const source = readServerSource("./studioOutputs.ts");
    expect(source).toContain('!segment.startsWith(".")');
  });
});
