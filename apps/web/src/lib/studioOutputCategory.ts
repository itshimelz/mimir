// FILE: studioOutputCategory.ts
// Purpose: Derive the display category and grouping for agent-produced Studio artifacts.
// Layer: Pure logic
// Exports: DEFAULT_STUDIO_OUTPUT_CATEGORY, studioOutputCategory, groupStudioOutputsByCategory
// Why: The server returns a flat `StudioOutputEntry` list whose only category signal is the
//      `Outbox/<Category>/` prefix on `relativePath`. Grouping is a pure derivation over that
//      field, so it belongs here rather than in the sidebar component.

/** Used when a path carries no `Outbox/<Category>/` segment. */
export const DEFAULT_STUDIO_OUTPUT_CATEGORY = "Other";

/**
 * Extracts the `Outbox/<Category>/` segment from an output path.
 *
 * The scaffold teaches agents to finish in `Outbox/<Category>/`
 * (`apps/server/src/studioWorkspaceScaffold.ts:48-49`), and the server excludes `tmp`, `logs`,
 * `inbox`, `context`, and `skills` from outputs (`apps/server/src/studioOutputs.ts:14-21`), so a
 * path outside `Outbox/` is a real case rather than a theoretical one.
 */
export function studioOutputCategory(relativePath: string): string {
  const segments = relativePath.split("/").filter((segment) => segment.length > 0);
  const outboxIndex = segments.indexOf("Outbox");
  if (outboxIndex === -1) {
    return DEFAULT_STUDIO_OUTPUT_CATEGORY;
  }
  const category = segments[outboxIndex + 1];
  return category !== undefined && category.length > 0 ? category : DEFAULT_STUDIO_OUTPUT_CATEGORY;
}

export interface StudioOutputCategoryGroup<T> {
  readonly category: string;
  readonly entries: readonly T[];
}

/**
 * Groups outputs by category, preserving the server's newest-first order within each group and
 * ordering the groups by their first (newest) entry.
 */
export function groupStudioOutputsByCategory<T>(
  entries: ReadonlyArray<T>,
  categoryOf: (entry: T) => string,
): ReadonlyArray<StudioOutputCategoryGroup<T>> {
  const groups = new Map<string, T[]>();
  for (const entry of entries) {
    const category = categoryOf(entry);
    const bucket = groups.get(category);
    if (bucket === undefined) {
      groups.set(category, [entry]);
    } else {
      bucket.push(entry);
    }
  }
  return [...groups].map(([category, groupedEntries]) => ({
    category,
    entries: groupedEntries,
  }));
}
