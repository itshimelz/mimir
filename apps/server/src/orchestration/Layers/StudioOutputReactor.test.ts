import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import * as NodeServices from "@effect/platform-node/NodeServices";
import {
  EventId,
  ProjectId,
  STUDIO_OUTPUTS_ACTIVITY_KIND,
  ThreadId,
  TurnId,
  type OrchestrationCommand,
  type ProviderRuntimeEvent,
} from "@synara/contracts";
import { Effect, Exit, Layer, ManagedRuntime, Option, PubSub, Scope, Stream } from "effect";
import { afterEach, describe, expect, it } from "vitest";

import {
  ProviderService,
  type ProviderServiceShape,
} from "../../provider/Services/ProviderService.ts";
import {
  OrchestrationEngineService,
  type OrchestrationEngineShape,
} from "../Services/OrchestrationEngine.ts";
import {
  ProjectionSnapshotQuery,
  type ProjectionSnapshotQueryShape,
} from "../Services/ProjectionSnapshotQuery.ts";
import {
  StudioOutputReactor,
  type StudioOutputReactorShape,
} from "../Services/StudioOutputReactor.ts";
import { StudioOutputReactorLive } from "./StudioOutputReactor.ts";

async function waitFor(predicate: () => boolean, timeoutMs = 2_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) {
      throw new Error("Timed out waiting for Studio output reactor expectation.");
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

describe("StudioOutputReactor", () => {
  let runtime: ManagedRuntime.ManagedRuntime<StudioOutputReactor, unknown> | null = null;
  let scope: Scope.Closeable | null = null;
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    if (scope) {
      await Effect.runPromise(Scope.close(scope, Exit.void));
    }
    scope = null;
    if (runtime) {
      await runtime.dispose();
    }
    runtime = null;
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
    );
  });

  it("uses the pre-dispatch baseline and captures files when the provider session exits", async () => {
    const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), "synara-studio-reactor-"));
    temporaryRoots.push(workspaceRoot);
    const threadId = ThreadId.makeUnsafe("studio-thread");
    const projectId = ProjectId.makeUnsafe("studio-project");
    const turnId = TurnId.makeUnsafe("studio-turn");
    const runtimeEvents = Effect.runSync(PubSub.unbounded<ProviderRuntimeEvent>());
    const commands: OrchestrationCommand[] = [];

    const startReactor = async (
      projectKind: "studio" | "project",
    ): Promise<{
      readonly reactor: StudioOutputReactorShape;
      readonly run: <A>(effect: Effect.Effect<A>) => Promise<A>;
    }> => {
      const providerService = {
        streamEvents: Stream.fromPubSub(runtimeEvents),
      } as unknown as ProviderServiceShape;
      const orchestrationEngine = {
        dispatch: (command: OrchestrationCommand) =>
          Effect.sync(() => {
            commands.push(command);
            return { sequence: commands.length };
          }),
        streamDomainEvents: Stream.empty,
      } as unknown as OrchestrationEngineShape;
      const projectionSnapshotQuery = {
        getThreadShellById: () =>
          Effect.succeed(
            Option.some({
              id: threadId,
              projectId,
              envMode: "local",
              worktreePath: null,
            } as never),
          ),
        getProjectShellById: () =>
          Effect.succeed(
            Option.some({
              id: projectId,
              kind: projectKind,
              workspaceRoot,
            } as never),
          ),
        getSpaceShellById: () => Effect.succeed(Option.none()),
      } as unknown as ProjectionSnapshotQueryShape;

      const layer = StudioOutputReactorLive.pipe(
        Layer.provideMerge(Layer.succeed(ProviderService, providerService)),
        Layer.provideMerge(Layer.succeed(OrchestrationEngineService, orchestrationEngine)),
        Layer.provideMerge(Layer.succeed(ProjectionSnapshotQuery, projectionSnapshotQuery)),
        Layer.provideMerge(NodeServices.layer),
      );
      runtime = ManagedRuntime.make(layer);
      const created = ManagedRuntime.make(layer);
      runtime = created;
      const reactor = await created.runPromise(Effect.service(StudioOutputReactor));
      scope = await Effect.runPromise(Scope.make("sequential"));
      await created.runPromise(reactor.start.pipe(Scope.provide(scope)));
      // Returned rather than read from the shared `runtime` field, which the type checker
      // cannot narrow across the closure.
      return { reactor, run: created.runPromise.bind(created) };
    };

    const runTurn = async () => {
      await Effect.runPromise(
        PubSub.publish(runtimeEvents, {
          type: "turn.started",
          eventId: EventId.makeUnsafe("turn-started"),
          provider: "codex",
          threadId,
          turnId,
          createdAt: "2026-07-08T10:00:00.000Z",
          payload: {},
        }).pipe(Effect.asVoid),
      );
      await Effect.runPromise(
        PubSub.publish(runtimeEvents, {
          type: "session.exited",
          eventId: EventId.makeUnsafe("session-exited"),
          provider: "codex",
          threadId,
          createdAt: "2026-07-08T10:00:01.000Z",
          payload: { reason: "provider crashed" },
        }).pipe(Effect.asVoid),
      );
    };

    const { reactor, run } = await startReactor("studio");

    // This file appears after the command reactor's awaited preparation but before
    // the provider acknowledges turn.started. A turn.started-time scan would miss it.
    await run(reactor.captureBaselineBeforeTurn(threadId));
    await writeFile(path.join(workspaceRoot, "report.md"), "finished report");

    await runTurn();

    await waitFor(() => commands.length === 1);
    expect(commands[0]).toMatchObject({
      type: "thread.activity.append",
      threadId,
      activity: {
        kind: STUDIO_OUTPUTS_ACTIVITY_KIND,
        turnId,
        payload: {
          itemType: "studio_outputs",
          data: { files: [{ path: "report.md" }] },
        },
      },
    });
  });

  it("captures a lesson written in an ordinary course folder that is a Git repository", async () => {
    // The case phase 1.2 exists for. A student's course folder is `kind: "project"` and
    // usually a repository. Both facts used to disable capture: the kind gate excluded
    // ordinary projects, and the reactor then skipped Git roots as well.
    const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), "synara-studio-course-"));
    temporaryRoots.push(workspaceRoot);
    // A real .git entry, since the reactor used to test for one.
    await mkdir(path.join(workspaceRoot, ".git"), { recursive: true });
    await writeFile(path.join(workspaceRoot, ".git", "HEAD"), "ref: refs/heads/main\n");
    await writeFile(path.join(workspaceRoot, "README.md"), "course notes");

    const threadId = ThreadId.makeUnsafe("course-thread");
    const projectId = ProjectId.makeUnsafe("course-project");
    const turnId = TurnId.makeUnsafe("course-turn");
    const runtimeEvents = Effect.runSync(PubSub.unbounded<ProviderRuntimeEvent>());
    const commands: OrchestrationCommand[] = [];

    const providerService = {
      streamEvents: Stream.fromPubSub(runtimeEvents),
    } as unknown as ProviderServiceShape;
    const orchestrationEngine = {
      dispatch: (command: OrchestrationCommand) =>
        Effect.sync(() => {
          commands.push(command);
          return { sequence: commands.length };
        }),
      streamDomainEvents: Stream.empty,
    } as unknown as OrchestrationEngineShape;
    const projectionSnapshotQuery = {
      getThreadShellById: () =>
        Effect.succeed(
          Option.some({
            id: threadId,
            projectId,
            envMode: "local",
            worktreePath: null,
          } as never),
        ),
      getProjectShellById: () =>
        Effect.succeed(
          Option.some({
            id: projectId,
            kind: "project",
            workspaceRoot,
          } as never),
        ),
      getSpaceShellById: () => Effect.succeed(Option.none()),
    } as unknown as ProjectionSnapshotQueryShape;

    const layer = StudioOutputReactorLive.pipe(
      Layer.provideMerge(Layer.succeed(ProviderService, providerService)),
      Layer.provideMerge(Layer.succeed(OrchestrationEngineService, orchestrationEngine)),
      Layer.provideMerge(Layer.succeed(ProjectionSnapshotQuery, projectionSnapshotQuery)),
      Layer.provideMerge(NodeServices.layer),
    );
    runtime = ManagedRuntime.make(layer);
    const reactor = await runtime.runPromise(Effect.service(StudioOutputReactor));
    scope = await Effect.runPromise(Scope.make("sequential"));
    await Effect.runPromise(reactor.start.pipe(Scope.provide(scope)));

    await runtime.runPromise(reactor.captureBaselineBeforeTurn(threadId));
    // The agent shells out to write a lesson, as it does in practice: no file-change tool
    // activity mentions it and it is untracked, so checkpoints cannot see it either.
    await mkdir(path.join(workspaceRoot, "Outbox", "Lessons"), { recursive: true });
    await writeFile(
      path.join(workspaceRoot, "Outbox", "Lessons", "cell-division.md"),
      "# Cell division\n",
    );
    // A build step in the same turn must not pollute the artifact list.
    await mkdir(path.join(workspaceRoot, "dist"), { recursive: true });
    await writeFile(path.join(workspaceRoot, "dist", "bundle.js"), "// generated\n");

    await Effect.runPromise(
      PubSub.publish(runtimeEvents, {
        type: "turn.started",
        eventId: EventId.makeUnsafe("course-turn-started"),
        provider: "codex",
        threadId,
        turnId,
        createdAt: "2026-07-08T10:00:00.000Z",
        payload: {},
      }).pipe(Effect.asVoid),
    );
    await Effect.runPromise(
      PubSub.publish(runtimeEvents, {
        type: "session.exited",
        eventId: EventId.makeUnsafe("course-session-exited"),
        provider: "codex",
        threadId,
        createdAt: "2026-07-08T10:00:01.000Z",
        payload: { reason: "provider crashed" },
      }).pipe(Effect.asVoid),
    );

    await waitFor(() => commands.length === 1);
    expect(commands[0]).toMatchObject({
      type: "thread.activity.append",
      threadId,
      activity: {
        kind: STUDIO_OUTPUTS_ACTIVITY_KIND,
        payload: {
          itemType: "studio_outputs",
          data: { files: [{ path: "Outbox/Lessons/cell-division.md" }] },
        },
      },
    });
  });
});
