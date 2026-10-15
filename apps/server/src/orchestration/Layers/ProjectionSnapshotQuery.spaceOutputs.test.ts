import { assert, it } from "@effect/vitest";
import { ProjectId, SpaceId, ThreadId } from "@synara/contracts";
import { Effect, Layer, Option } from "effect";
import * as SqlClient from "effect/unstable/sql/SqlClient";

import { runMigrations } from "../../persistence/Migrations.ts";
import { SqlitePersistenceMemory } from "../../persistence/Layers/Sqlite.ts";
import { ServerSettingsService } from "../../serverSettings.ts";
import { ProjectionSnapshotQuery } from "../Services/ProjectionSnapshotQuery.ts";
import { OrchestrationProjectionSnapshotQueryLive } from "./ProjectionSnapshotQuery.ts";

const layer = it.layer(
  OrchestrationProjectionSnapshotQueryLive.pipe(
    Layer.provideMerge(SqlitePersistenceMemory),
    Layer.provide(ServerSettingsService.layerTest()),
  ),
);

const NOW = "2026-07-08T10:00:00.000Z";

/**
 * A space has no `space_id` on its threads (`projection_threads` carries only `project_id`),
 * so a space-scoped read is a two-hop join. These exercise that join against real SQLite
 * rather than a fake, because the query is the part most likely to be subtly wrong.
 */
layer("ProjectionSnapshotQuery space-scoped reads", (it) => {
  it.effect("returns only the projects filed in the requested space", () =>
    Effect.gen(function* () {
      const query = yield* ProjectionSnapshotQuery;
      yield* runMigrations();
      const sql = yield* SqlClient.SqlClient;
      const spaceId = SpaceId.makeUnsafe("space-1");
      const otherSpaceId = SpaceId.makeUnsafe("course-b");

      yield* sql`
        INSERT INTO projection_spaces
          (space_id, name, icon, sort_order, created_at, updated_at, deleted_at)
        VALUES
          (${spaceId}, 'Cell Biology', 'book', 0, ${NOW}, ${NOW}, NULL),
          (${otherSpaceId}, 'Physics', 'lab', 1, ${NOW}, ${NOW}, NULL)
      `;
      const inSpace = ProjectId.makeUnsafe("bio-project-a");
      const elsewhere = ProjectId.makeUnsafe("phys-project-b");
      for (const [projectId, title, ownerSpace] of [
        [inSpace, "Biology notes", spaceId],
        [elsewhere, "Physics notes", otherSpaceId],
      ] as const) {
        yield* sql`
          INSERT INTO projection_projects
            (project_id, kind, title, workspace_root, default_model_selection_json,
             scripts_json, is_pinned, space_id, created_at, updated_at, deleted_at)
          VALUES
            (${projectId}, 'project', ${title}, ${`/courses/${projectId}`}, NULL,
             '[]', 0, ${ownerSpace}, ${NOW}, ${NOW}, NULL)
        `;
      }

      const projects = yield* query.listProjectsBySpaceId(spaceId);
      assert.deepStrictEqual(
        projects.map((project) => project.id),
        [inSpace],
      );
      assert.strictEqual(projects[0]?.title, "Biology notes");
      assert.strictEqual(projects[0]?.kind, "project");

      const other = yield* query.listProjectsBySpaceId(otherSpaceId);
      assert.deepStrictEqual(
        other.map((project) => project.id),
        [elsewhere],
      );
    }),
  );

  it.effect("excludes a deleted project from the space", () =>
    Effect.gen(function* () {
      const query = yield* ProjectionSnapshotQuery;
      yield* runMigrations();
      const sql = yield* SqlClient.SqlClient;
      const spaceId = SpaceId.makeUnsafe("space-2");
      yield* sql`
        INSERT INTO projection_spaces
          (space_id, name, icon, sort_order, created_at, updated_at, deleted_at)
        VALUES (${spaceId}, 'Cell Biology', 'book', 0, ${NOW}, ${NOW}, NULL)
      `;
      const projectId = ProjectId.makeUnsafe("removed-project");
      yield* sql`
        INSERT INTO projection_projects
          (project_id, kind, title, workspace_root, default_model_selection_json,
           scripts_json, is_pinned, space_id, created_at, updated_at, deleted_at)
        VALUES (${projectId}, 'project', 'Old', '/courses/removed-project', NULL, '[]', 0,
                ${spaceId}, ${NOW}, ${NOW}, ${NOW})
      `;

      assert.deepStrictEqual(yield* query.listProjectsBySpaceId(spaceId), []);
    }),
  );

  it.effect("returns recent threads across the space's projects, newest first", () =>
    Effect.gen(function* () {
      const query = yield* ProjectionSnapshotQuery;
      yield* runMigrations();
      const sql = yield* SqlClient.SqlClient;
      const projectA = ProjectId.makeUnsafe("project-a");
      const projectB = ProjectId.makeUnsafe("project-b");
      const threads = [
        {
          id: ThreadId.makeUnsafe("old-thread"),
          projectId: projectA,
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
        {
          id: ThreadId.makeUnsafe("new-thread"),
          projectId: projectB,
          updatedAt: "2026-07-07T00:00:00.000Z",
        },
        {
          id: ThreadId.makeUnsafe("mid-thread"),
          projectId: projectA,
          updatedAt: "2026-07-04T00:00:00.000Z",
        },
      ] as const;
      for (const thread of threads) {
        yield* sql`
          INSERT INTO projection_threads
            (thread_id, project_id, title, model_selection_json, runtime_mode,
             interaction_mode, env_mode, created_at, updated_at, deleted_at)
          VALUES
            (${thread.id}, ${thread.projectId}, 'Session', NULL, 'approval-required',
             'default', 'local', ${thread.updatedAt}, ${thread.updatedAt}, NULL)
        `;
      }
      yield* sql`
        INSERT INTO projection_threads
          (thread_id, project_id, title, model_selection_json, runtime_mode,
           interaction_mode, env_mode, created_at, updated_at, deleted_at)
        VALUES (${ThreadId.makeUnsafe("gone-thread")}, ${projectA}, 'Deleted', NULL,
                'approval-required', 'default', 'local', ${NOW}, ${NOW}, ${NOW})
      `;

      const listed = yield* query.listRecentActiveThreadIdsByProjectIds([projectA, projectB], 10);
      assert.deepStrictEqual(
        listed.map((thread) => thread.threadId),
        ["new-thread", "mid-thread", "old-thread"],
      );
      assert.strictEqual(listed[0]?.projectId, projectB);
    }),
  );

  it.effect("honours the thread limit so one chatty project cannot bound the response", () =>
    Effect.gen(function* () {
      const query = yield* ProjectionSnapshotQuery;
      yield* runMigrations();
      const sql = yield* SqlClient.SqlClient;
      const projectId = ProjectId.makeUnsafe("busy-project");
      for (let index = 0; index < 5; index += 1) {
        const threadId = ThreadId.makeUnsafe(`t${index}`);
        const at = `2026-07-0${index + 1}T00:00:00.000Z`;
        yield* sql`
          INSERT INTO projection_threads
            (thread_id, project_id, title, model_selection_json, runtime_mode,
             interaction_mode, env_mode, created_at, updated_at, deleted_at)
          VALUES (${threadId}, ${projectId}, 'Session', NULL, 'approval-required',
                  'default', 'local', ${at}, ${at}, NULL)
        `;
      }

      const listed = yield* query.listRecentActiveThreadIdsByProjectIds([projectId], 2);
      assert.strictEqual(listed.length, 2);
    }),
  );

  it.effect("returns an empty list rather than an invalid query for no projects", () =>
    Effect.gen(function* () {
      const query = yield* ProjectionSnapshotQuery;
      yield* runMigrations();
      // An empty `IN ()` is a syntax error on some engines; the guard short-circuits first.
      assert.deepStrictEqual(yield* query.listRecentActiveThreadIdsByProjectIds([], 10), []);
    }),
  );

  it.effect("ignores a project that is not filed in any space", () =>
    Effect.gen(function* () {
      const query = yield* ProjectionSnapshotQuery;
      yield* runMigrations();
      const sql = yield* SqlClient.SqlClient;
      const spaceId = SpaceId.makeUnsafe("space-unfiled-check");
      yield* sql`
        INSERT INTO projection_spaces
          (space_id, name, icon, sort_order, created_at, updated_at, deleted_at)
        VALUES (${spaceId}, 'Cell Biology', 'book', 0, ${NOW}, ${NOW}, NULL)
      `;
      // A project added straight from a folder lands in Void (`space_id IS NULL`) until the
      // student files it. Void is not a real space row, so it must never surface here.
      const voidProject = ProjectId.makeUnsafe("void-project");
      yield* sql`
        INSERT INTO projection_projects
          (project_id, kind, title, workspace_root, default_model_selection_json,
           scripts_json, is_pinned, space_id, created_at, updated_at, deleted_at)
        VALUES (${voidProject}, 'project', 'Unfiled', '/courses/void', NULL, '[]', 0,
                NULL, ${NOW}, ${NOW}, NULL)
      `;

      assert.deepStrictEqual(yield* query.listProjectsBySpaceId(spaceId), []);
    }),
  );

  it.effect("returns no projects for an unknown space instead of failing", () =>
    Effect.gen(function* () {
      const query = yield* ProjectionSnapshotQuery;
      yield* runMigrations();
      const projects = yield* query.listProjectsBySpaceId(SpaceId.makeUnsafe("nope"));
      assert.deepStrictEqual(projects, []);
    }),
  );

  it.effect("keeps the existing per-space lookup intact", () =>
    Effect.gen(function* () {
      const query = yield* ProjectionSnapshotQuery;
      yield* runMigrations();
      const sql = yield* SqlClient.SqlClient;
      const spaceId = SpaceId.makeUnsafe("space-3");
      yield* sql`
        INSERT INTO projection_spaces
          (space_id, name, icon, sort_order, created_at, updated_at, deleted_at)
        VALUES (${spaceId}, 'Cell Biology', 'book', 0, ${NOW}, ${NOW}, NULL)
      `;
      const shell = yield* query.getSpaceShellById(spaceId);
      assert.deepStrictEqual(
        Option.map(shell, (space) => space.name),
        Option.some("Cell Biology"),
      );
    }),
  );
});
