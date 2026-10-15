import { Schema } from "effect";
import { ProjectId, SpaceId, ThreadId, TrimmedNonEmptyString } from "./baseSchemas";

/**
 * Thread-activity kind persisted by the server's per-turn Studio output capture
 * (filesystem scan diff). The web filters this kind out of the transcript work log
 * and uses it to invalidate the Studio outputs query.
 */
export const STUDIO_OUTPUTS_ACTIVITY_KIND = "studio.outputs.captured";

export const StudioListThreadOutputsInput = Schema.Struct({
  /** Thread whose produced Studio files should be listed. */
  threadId: ThreadId,
  /**
   * Restrict the result to what this conversation produced, dropping the workspace-wide
   * `Outbox/` scan that normally makes the list course-cumulative.
   *
   * The chat Environment panel asks for this: it answers "what did we just make together",
   * which is a different question from the course's whole body of work. Without it the panel
   * would restate the Studio sidebar verbatim, because the disk scan returns every artifact
   * in the course folder regardless of which chat wrote it.
   */
  includeWorkspaceScan: Schema.optional(Schema.Boolean),
});
export type StudioListThreadOutputsInput = typeof StudioListThreadOutputsInput.Type;

export const StudioOutputEntry = Schema.Struct({
  /** File name, e.g. "2026-06-09_synara_local_dev_server_x_posts.md". */
  name: TrimmedNonEmptyString,
  /** Path relative to the Studio workspace root, e.g. "Outbox/Content/2026-06-09_....md". */
  relativePath: TrimmedNonEmptyString,
  /** Absolute path, used for reveal-in-Finder. */
  fullPath: TrimmedNonEmptyString,
  /** ISO timestamp of the last modification. */
  modifiedAt: TrimmedNonEmptyString,
});
export type StudioOutputEntry = typeof StudioOutputEntry.Type;

export const StudioListThreadOutputsResult = Schema.Struct({
  entries: Schema.Array(StudioOutputEntry),
});
export type StudioListThreadOutputsResult = typeof StudioListThreadOutputsResult.Type;

/**
 * An artifact aggregated across a whole space, attributed to the conversation that produced
 * it. Attribution is reported rather than implied because a space can hold several projects
 * and each may have produced files into a shared root, so "where did this come from" is a
 * real question the student may ask.
 */
export const StudioSpaceOutputEntry = Schema.Struct({
  /** File name, e.g. "2026-07-08_cell-division-lesson.md". */
  name: TrimmedNonEmptyString,
  /** Path relative to the producing project's workspace root. */
  relativePath: TrimmedNonEmptyString,
  /** Absolute path, used for reveal-in-Finder and for opening the artifact. */
  fullPath: TrimmedNonEmptyString,
  /** ISO timestamp of the last modification. */
  modifiedAt: TrimmedNonEmptyString,
  /** The conversation this was attributed to. */
  threadId: ThreadId,
  /** The project (i.e. folder) inside the space that was worked in. */
  projectId: Schema.String,
  /** Human-readable project name, so the UI need not resolve ids. */
  projectName: TrimmedNonEmptyString,
});
export type StudioSpaceOutputEntry = typeof StudioSpaceOutputEntry.Type;

export const StudioListSpaceOutputsInput = Schema.Struct({
  /** Space whose projects, threads and produced files should be aggregated. */
  spaceId: SpaceId,
});
export type StudioListSpaceOutputsInput = typeof StudioListSpaceOutputsInput.Type;

export const StudioListSpaceOutputsResult = Schema.Struct({
  /** Newest first, deduplicated by absolute path across the whole space. */
  entries: Schema.Array(StudioSpaceOutputEntry),
});
export type StudioListSpaceOutputsResult = typeof StudioListSpaceOutputsResult.Type;

/**
 * A course's artifacts, aggregated across every conversation in one project.
 *
 * A student works one course at a time, so the project — not the space, and never the open
 * chat — is the unit their work accumulates in. The same `StudioOutputEntry` shape as the
 * per-thread listing is returned deliberately: the sidebar only needs name, path, and
 * timestamp, and keeping the two identical means switching scope is not a UI branch.
 */
export const StudioListProjectOutputsInput = Schema.Struct({
  /** Course project whose conversations and produced files should be aggregated. */
  projectId: ProjectId,
});
export type StudioListProjectOutputsInput = typeof StudioListProjectOutputsInput.Type;

export const StudioListProjectOutputsResult = Schema.Struct({
  /** Newest first, deduplicated by absolute path across every conversation in the project. */
  entries: Schema.Array(StudioOutputEntry),
});
export type StudioListProjectOutputsResult = typeof StudioListProjectOutputsResult.Type;
