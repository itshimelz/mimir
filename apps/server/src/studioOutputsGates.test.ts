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

  it("keeps the artifact listings read-only, so opening a chat never scaffolds a folder", () => {
    // Regression: the listings used to self-heal the workspace, so merely opening a thread
    // created eleven directories and two instruction files in a folder the user had only
    // pointed Mimir at — visible immediately in the Study file tree. A read endpoint must not
    // write to the user's disk, in either surface, for either listing.
    const source = readServerSource("./wsRpc.ts");
    const listingBodies = source.slice(
      source.indexOf("[WS_METHODS.studioListThreadOutputs]"),
      source.indexOf("[WS_METHODS.shellOpenInEditor]"),
    );
    for (const write of [
      "prepareCourseWorkspaceRoot(",
      "courseWorkspaceSubdirectories(",
      "courseWorkspaceInstructionText(",
    ]) {
      expect(listingBodies, `the listings still write via ${write}`).not.toContain(write);
    }
    // The legacy container root is still prepared: that path is Mimir's own directory,
    // created and owned by it, not a folder the user brought.
    expect(listingBodies).toContain("prepareStudioWorkspaceRoot(config.studioWorkspaceRoot)");
  });

  it("scaffolds the course layout from the reactor, on a turn, not from a read", () => {
    const reactor = readServerSource("./orchestration/Layers/StudioOutputReactor.ts");
    expect(reactor).toContain("ensureCourseWorkspaceLayout");
    // Gated on the layout rule, so only a course folder is scaffolded and the legacy
    // containers keep their own create-time layout.
    expect(reactor).toContain('studioWorkspaceLayoutFor(input.projectKind) === "course"');
    // After the diff is computed, so the layout is never attributed to the agent.
    const diffAt = reactor.indexOf("diffStudioWorkspaceScans(input.baseline.files, after)");
    const scaffoldAt = reactor.indexOf("ensureCourseWorkspaceLayout(input.baseline.workspaceRoot");
    expect(diffAt).toBeGreaterThan(-1);
    expect(scaffoldAt).toBeGreaterThan(diffAt);
  });

  it("hides agent-managed directories from the Study file tree", () => {
    const explorer = readServerSource("../../web/src/components/chat/workspaceExplorer.tsx");
    for (const directory of ["context", "inbox", "logs", "outbox", "skills", "tmp"]) {
      expect(explorer, `${directory} is not hidden from Study`).toContain(`"${directory}"`);
    }
    expect(explorer).toContain("AGENT_MANAGED_DIRECTORY_NAMES.has(entry.name.toLowerCase())");
  });

  it("routes generated-image materialization through the shared gate too", () => {
    // A third independent condition lived here. Left on the narrower container check, a
    // course folder would have had lessons attributed to it while a diagram the agent
    // generated stayed in the provider's home directory and never reached Studio.
    const source = readServerSource("./orchestration/Layers/ProviderRuntimeIngestion.ts");
    expect(source, "generated-image materialization bypasses the shared gate").toContain(
      "participatesInStudioOutputs(project.kind)",
    );
    expect(source, "still gates on the container rule directly").not.toContain(
      "isGroupContainerKind",
    );
  });

  it("exposes the space-scoped listing through the same admission list and handler map", () => {
    // A new WS method that is not admitted, or has no handler, fails at runtime rather than
    // at build time. Both are cheap to pin.
    const admission = readServerSource("./wsRequestAdmission.ts");
    expect(admission, "space listing is not admitted").toContain(
      "WS_METHODS.studioListSpaceOutputs",
    );
    const rpc = readServerSource("./wsRpc.ts");
    expect(rpc, "space listing has no handler").toContain("[WS_METHODS.studioListSpaceOutputs]");
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
