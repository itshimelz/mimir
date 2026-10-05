/**
 * StudioOutputReactorLive - Per-turn Studio output capture layer.
 *
 * Git checkpoints attribute produced files precisely, but the Studio root is
 * typically not a Git repository, and file-change tool activities miss files
 * created by shell subprocesses (scripts, converters, downloads). This reactor
 * closes that gap: it snapshots the Studio workspace tree before provider turn
 * execution, rescans when the turn settles, and persists the diff as a thread activity
 * (`studio.outputs.captured`) that the Studio outputs listing reads back.
 *
 * Codex-generated images live under the Codex home, outside the Studio root, so
 * this scan never sees them; ProviderRuntimeIngestion owns copying those into
 * the workspace (with their own direct attribution) as image items complete.
 *
 * Concurrent Studio chats share one root, so overlapping turns may both claim
 * a file; attribution is deliberately generous rather than lossy.
 *
 * @module StudioOutputReactorLive
 */
import {
  CommandId,
  EventId,
  STUDIO_OUTPUTS_ACTIVITY_KIND,
  ThreadId,
  type ProjectKind,
  type ProviderRuntimeEvent,
  type TurnId,
} from "@synara/contracts";
import { Cause, Effect, FileSystem, Layer, Option, Path, Stream } from "effect";
import { makeDrainableWorker, startDrainableWorkerProducers } from "@synara/shared/DrainableWorker";
import {
  participatesInStudioOutputs,
  studioWorkspaceLayoutFor,
} from "@synara/shared/studioOutputs";

import { resolveThreadWorkspaceCwd } from "../../checkpointing/Utils.ts";
import {
  scanStudioWorkspaceFiles,
  studioOutputsCapturedActivityPayload,
  type StudioWorkspaceScan,
} from "../../studioOutputs.ts";
import {
  courseWorkspaceInstructionText,
  courseWorkspaceSubdirectories,
  DEFAULT_LEARNER_ROLE,
  type LearnerRole,
} from "../../studioWorkspaceScaffold.ts";
import { diffStudioWorkspaceScans } from "../../studioOutputs.ts";
import { ProviderService } from "../../provider/Services/ProviderService.ts";
import { OrchestrationEngineService } from "../Services/OrchestrationEngine.ts";
import { ProjectionSnapshotQuery } from "../Services/ProjectionSnapshotQuery.ts";
import {
  StudioOutputReactor,
  type StudioOutputReactorShape,
} from "../Services/StudioOutputReactor.ts";

// Baselines whose terminal event never arrives must not accumulate forever; one
// entry per active turn stays far below this.
const MAX_TRACKED_TURN_BASELINES = 128;
const STUDIO_OUTPUT_REACTOR_CAPACITY = 128;

const serverCommandId = (tag: string): CommandId =>
  CommandId.makeUnsafe(`server:${tag}:${crypto.randomUUID()}`);

// Keyed by thread + turn so concurrent turns on one thread (e.g. subagent runs)
// never clobber each other's baseline.
const baselineKey = (threadId: ThreadId, turnId: string) => `${threadId}\0${turnId}`;

interface StudioTurnBaseline {
  readonly threadId: ThreadId;
  readonly workspaceRoot: string;
  /** Chooses which scaffold the workspace gets, once, on the first real turn. */
  readonly projectKind: ProjectKind;
  readonly files: StudioWorkspaceScan;
}

interface ActiveStudioTurnBaseline extends StudioTurnBaseline {
  readonly turnId: TurnId;
}

const make = Effect.gen(function* () {
  const orchestrationEngine = yield* OrchestrationEngineService;
  const providerService = yield* ProviderService;
  const projectionSnapshotQuery = yield* ProjectionSnapshotQuery;
  const fileSystem = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const scanWorkspaceFiles = (workspaceRoot: string) =>
    scanStudioWorkspaceFiles({ workspaceRoot }).pipe(
      Effect.provideService(FileSystem.FileSystem, fileSystem),
      Effect.provideService(Path.Path, path),
    );
  const makeDirectory = (dirPath: string) =>
    fileSystem.makeDirectory(dirPath, { recursive: true }).pipe(
      Effect.asVoid,
      Effect.catch(() => Effect.void),
    );
  const exists = (entryPath: string) =>
    fileSystem.exists(entryPath).pipe(Effect.catch(() => Effect.succeed(false)));

  /**
   * Writes the course layout into a user's workspace, once, on the thread's first real turn.
   *
   * This used to happen in the listing RPC, which is wrong twice over: a read ran on every
   * prefetch and in both surfaces, so simply opening a chat created eleven directories and two
   * instruction files in a folder the user had only pointed Mimir at. An untouched folder now
   * stays untouched, and the agent is still taught the layout before it can do useful work.
   *
   * Runs *after* the baseline scan on purpose: a file this writes is not something the agent
   * produced, so it must not be attributed to the turn.
   */
  const ensureCourseWorkspaceLayout = Effect.fnUntraced(function* (
    workspaceRoot: string,
    role: LearnerRole,
  ) {
    for (const relative of courseWorkspaceSubdirectories(role)) {
      yield* makeDirectory(path.join(workspaceRoot, ...relative.split("/")));
    }
    for (const fileName of ["AGENTS.md", "CLAUDE.md"]) {
      const filePath = path.join(workspaceRoot, fileName);
      if (yield* exists(filePath)) {
        continue;
      }
      yield* fileSystem
        .writeFileString(filePath, courseWorkspaceInstructionText(role))
        .pipe(Effect.catch(() => Effect.void));
    }
  });
  // ProviderCommandReactor writes this map before invoking sendTurn/startReview.
  // The subsequent runtime turn.started event promotes the prepared entry into
  // baselineByTurn without rescanning after provider execution has begun.
  const pendingBaselineByThread = new Map<ThreadId, StudioTurnBaseline>();
  const baselineByTurn = new Map<string, ActiveStudioTurnBaseline>();

  // Resolves the Studio workspace root to scan for a thread, or null when this
  // reactor should stay out of the way: projects that do not take part in Studio
  // attribution, and unresolvable cwds. Shares the gate with the listing RPC so the
  // two cannot disagree — see `participatesInStudioOutputs`.
  //
  // Git roots are included on purpose. This reactor exists to catch files written by
  // shell subprocesses (scripts, converters, downloads) that no file-change tool
  // activity reports; checkpoints only see committed work, so they miss exactly the
  // untracked lesson file an agent just wrote. The walk is safe on a repository because
  // `.git` and other dot-directories are skipped as hidden entries, and generated
  // directories (`dist`, `build`, `target`, `venv`, `__pycache__`) are excluded by name.
  //
  // Shell reads keep this cheap: it runs on every turn boundary of every thread.
  const resolveStudioScanTarget = Effect.fnUntraced(function* (threadId: ThreadId) {
    const threadOption = yield* projectionSnapshotQuery
      .getThreadShellById(threadId)
      .pipe(Effect.catch(() => Effect.succeed(Option.none())));
    const thread = Option.getOrUndefined(threadOption);
    if (!thread) {
      return null;
    }
    const projectOption = yield* projectionSnapshotQuery
      .getProjectShellById(thread.projectId)
      .pipe(Effect.catch(() => Effect.succeed(Option.none())));
    const project = Option.getOrUndefined(projectOption);
    if (!project || !participatesInStudioOutputs(project.kind)) {
      return null;
    }
    const cwd = resolveThreadWorkspaceCwd({ thread, projects: [project] });
    if (!cwd) {
      return null;
    }
    return { workspaceRoot: cwd, projectKind: project.kind ?? "project" };
  });

  const evictOldestBaseline = () => {
    const oldestActiveKey = baselineByTurn.keys().next().value;
    if (oldestActiveKey !== undefined) {
      baselineByTurn.delete(oldestActiveKey);
      return;
    }
    const oldestPendingThreadId = pendingBaselineByThread.keys().next().value;
    if (oldestPendingThreadId !== undefined) {
      pendingBaselineByThread.delete(oldestPendingThreadId);
    }
  };

  const makeRoomForBaseline = () => {
    if (baselineByTurn.size + pendingBaselineByThread.size >= MAX_TRACKED_TURN_BASELINES) {
      evictOldestBaseline();
    }
  };

  const captureBaselineBeforeTurnUnsafe = Effect.fnUntraced(function* (threadId: ThreadId) {
    // A retry replaces an earlier preparation for this thread. Remove it before
    // scanning so a failed fresh capture cannot leave a stale baseline behind.
    pendingBaselineByThread.delete(threadId);
    const target = yield* resolveStudioScanTarget(threadId);
    if (!target) {
      return;
    }
    const files = yield* scanWorkspaceFiles(target.workspaceRoot);
    makeRoomForBaseline();
    pendingBaselineByThread.set(threadId, {
      threadId,
      workspaceRoot: target.workspaceRoot,
      projectKind: target.projectKind,
      files,
    });
  });

  const captureBaselineBeforeTurn: StudioOutputReactorShape["captureBaselineBeforeTurn"] = (
    threadId,
  ) =>
    captureBaselineBeforeTurnUnsafe(threadId).pipe(
      Effect.catchCause((cause) => {
        if (Cause.hasInterruptsOnly(cause)) {
          return Effect.failCause(cause);
        }
        return Effect.logWarning("studio output reactor failed to capture pre-turn baseline", {
          threadId,
          cause: Cause.pretty(cause),
        });
      }),
    );

  const cancelPendingTurnBaseline: StudioOutputReactorShape["cancelPendingTurnBaseline"] = (
    threadId,
  ) => Effect.sync(() => pendingBaselineByThread.delete(threadId)).pipe(Effect.asVoid);

  const associateTurnStartBaseline = Effect.fnUntraced(function* (
    event: Extract<ProviderRuntimeEvent, { type: "turn.started" }>,
  ) {
    if (event.turnId === undefined) {
      return;
    }
    const key = baselineKey(event.threadId, event.turnId);
    if (baselineByTurn.has(key)) {
      return;
    }
    const prepared = pendingBaselineByThread.get(event.threadId);
    pendingBaselineByThread.delete(event.threadId);
    if (prepared) {
      baselineByTurn.set(key, { ...prepared, turnId: event.turnId });
      return;
    }

    // Provider-native/subagent turns can bypass ProviderCommandReactor. Preserve
    // best-effort capture for those paths, while ordinary user turns always use
    // the awaited pre-dispatch baseline above.
    const target = yield* resolveStudioScanTarget(event.threadId);
    if (!target) {
      return;
    }
    const files = yield* scanWorkspaceFiles(target.workspaceRoot);
    makeRoomForBaseline();
    baselineByTurn.set(key, {
      threadId: event.threadId,
      turnId: event.turnId,
      workspaceRoot: target.workspaceRoot,
      projectKind: target.projectKind,
      files,
    });
  });

  const persistBaselineOutputs = Effect.fnUntraced(function* (input: {
    readonly baseline: StudioTurnBaseline;
    readonly turnId: TurnId | null;
    readonly createdAt: string;
    readonly projectKind: ProjectKind;
  }) {
    const after = yield* scanWorkspaceFiles(input.baseline.workspaceRoot);
    const changedRelativePaths = diffStudioWorkspaceScans(input.baseline.files, after);
    // Scaffold after the diff is computed, so the layout this writes is never reported as
    // something the agent produced. Only a course folder is scaffolded here: the legacy
    // Studio and Hub containers keep being prepared by their own create paths.
    if (studioWorkspaceLayoutFor(input.projectKind) === "course") {
      yield* ensureCourseWorkspaceLayout(input.baseline.workspaceRoot, DEFAULT_LEARNER_ROLE);
    }
    if (changedRelativePaths.length === 0) {
      return;
    }

    // The payload mirrors the provider file-change activity shape (itemType + data
    // holding `path` entries) so the Studio outputs listing extracts paths through
    // the same collector that already handles provider payloads.
    yield* orchestrationEngine.dispatch({
      type: "thread.activity.append",
      commandId: serverCommandId("studio-outputs-captured"),
      threadId: input.baseline.threadId,
      activity: {
        id: EventId.makeUnsafe(crypto.randomUUID()),
        tone: "info",
        kind: STUDIO_OUTPUTS_ACTIVITY_KIND,
        summary: "Studio outputs captured",
        payload: studioOutputsCapturedActivityPayload(changedRelativePaths),
        turnId: input.turnId,
        createdAt: input.createdAt,
      },
      createdAt: input.createdAt,
    });
  });

  // Runs on turn.completed AND turn.aborted: files produced before an interruption
  // are still real outputs the panel should list. A pending entry covers providers
  // that terminate without first emitting turn.started.
  const captureTurnOutputs = Effect.fnUntraced(function* (
    event: Extract<ProviderRuntimeEvent, { type: "turn.completed" | "turn.aborted" }>,
  ) {
    let baseline: StudioTurnBaseline | undefined;
    if (event.turnId !== undefined) {
      const key = baselineKey(event.threadId, event.turnId);
      baseline = baselineByTurn.get(key);
      baselineByTurn.delete(key);
    }
    baseline ??= pendingBaselineByThread.get(event.threadId);
    pendingBaselineByThread.delete(event.threadId);
    if (!baseline) {
      return;
    }
    yield* persistBaselineOutputs({
      baseline,
      turnId: event.turnId ?? null,
      createdAt: event.createdAt,
      projectKind: baseline.projectKind,
    });
  });

  // A provider process can exit or error without a matching turn.aborted. Drain
  // every baseline for that thread so real files produced before the failure are
  // still attributed and stale in-memory entries do not accumulate.
  const captureTerminatedSessionOutputs = Effect.fnUntraced(function* (
    event: Extract<ProviderRuntimeEvent, { type: "session.exited" | "runtime.error" }>,
  ) {
    const baselines: Array<{ baseline: StudioTurnBaseline; turnId: TurnId | null }> = [];
    const pending = pendingBaselineByThread.get(event.threadId);
    pendingBaselineByThread.delete(event.threadId);
    if (pending) {
      baselines.push({ baseline: pending, turnId: event.turnId ?? null });
    }
    for (const [key, baseline] of baselineByTurn) {
      if (baseline.threadId !== event.threadId) {
        continue;
      }
      baselineByTurn.delete(key);
      baselines.push({ baseline, turnId: baseline.turnId });
    }
    yield* Effect.forEach(
      baselines,
      ({ baseline, turnId }) =>
        persistBaselineOutputs({
          baseline,
          turnId,
          createdAt: event.createdAt,
          projectKind: baseline.projectKind,
        }),
      { concurrency: 1, discard: true },
    );
  });

  const processEvent = (event: ProviderRuntimeEvent) => {
    if (event.type === "turn.started") {
      return associateTurnStartBaseline(event);
    }
    if (event.type === "turn.completed" || event.type === "turn.aborted") {
      return captureTurnOutputs(event);
    }
    if (event.type === "session.exited" || event.type === "runtime.error") {
      return captureTerminatedSessionOutputs(event);
    }
    return Effect.void;
  };

  const processEventSafely = (event: ProviderRuntimeEvent) =>
    processEvent(event).pipe(
      Effect.catchCause((cause) => {
        if (Cause.hasInterruptsOnly(cause)) {
          return Effect.failCause(cause);
        }
        return Effect.logWarning("studio output reactor failed to process event", {
          eventType: event.type,
          threadId: event.threadId,
          cause: Cause.pretty(cause),
        });
      }),
    );

  const worker = yield* makeDrainableWorker(processEventSafely, {
    capacity: STUDIO_OUTPUT_REACTOR_CAPACITY,
  });

  const start: StudioOutputReactorShape["start"] = startDrainableWorkerProducers(
    worker,
    Effect.gen(function* () {
      yield* Effect.forkScoped(
        Stream.runForEach(providerService.streamEvents, (event) =>
          event.type === "turn.started" ||
          event.type === "turn.completed" ||
          event.type === "turn.aborted" ||
          event.type === "session.exited" ||
          event.type === "runtime.error"
            ? worker.enqueue(event)
            : Effect.void,
        ),
      );
    }),
  );

  return {
    captureBaselineBeforeTurn,
    cancelPendingTurnBaseline,
    start,
    drain: worker.drain,
  } satisfies StudioOutputReactorShape;
});

export const StudioOutputReactorLive = Layer.effect(StudioOutputReactor, make);
