// FILE: course.ts
// Purpose: Schemas and contracts for course workspace operations.
// Layer: Contracts (cross-process schemas)

import { Schema } from "effect";
import { ProjectId, TrimmedNonEmptyString } from "./baseSchemas";

export const CoursePrepareWorkspaceInput = Schema.Struct({
  projectId: ProjectId,
  role: Schema.optional(Schema.Literals(["student", "teacher", "researcher"])),
});
export type CoursePrepareWorkspaceInput = typeof CoursePrepareWorkspaceInput.Type;

export const CoursePrepareWorkspaceResult = Schema.Struct({
  scaffoldedDirectories: Schema.Array(TrimmedNonEmptyString),
});
export type CoursePrepareWorkspaceResult = typeof CoursePrepareWorkspaceResult.Type;
