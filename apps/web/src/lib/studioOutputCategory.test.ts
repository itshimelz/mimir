// FILE: studioOutputCategory.test.ts
// Purpose: Locks the Outbox-category derivation that groups Studio artifacts.
// Layer: Pure logic
// Depends on: Vitest and studioOutputCategory helpers

import { describe, expect, it } from "vitest";

import {
  DEFAULT_STUDIO_OUTPUT_CATEGORY,
  groupStudioOutputsByCategory,
  studioOutputCategory,
} from "./studioOutputCategory";

describe("studioOutputCategory", () => {
  it("reads the category from the Outbox segment", () => {
    expect(studioOutputCategory("Outbox/Content/2026-06-09_lesson.md")).toBe("Content");
    expect(studioOutputCategory("Outbox/Images/diagram.png")).toBe("Images");
  });

  it("keeps nested paths under the first Outbox segment", () => {
    expect(studioOutputCategory("Outbox/Content/week1/cell-division.md")).toBe("Content");
  });

  it("tolerates a leading segment before Outbox", () => {
    expect(studioOutputCategory("notes/Outbox/Content/lesson.md")).toBe("Content");
  });

  it("falls back when there is no Outbox segment", () => {
    expect(studioOutputCategory("notes.md")).toBe(DEFAULT_STUDIO_OUTPUT_CATEGORY);
  });

  it("falls back when Outbox has no category after it", () => {
    expect(studioOutputCategory("Outbox/")).toBe(DEFAULT_STUDIO_OUTPUT_CATEGORY);
    expect(studioOutputCategory("Outbox")).toBe(DEFAULT_STUDIO_OUTPUT_CATEGORY);
  });

  it("ignores empty segments", () => {
    expect(studioOutputCategory("Outbox//Content/lesson.md")).toBe("Content");
  });
});

describe("groupStudioOutputsByCategory", () => {
  const categoryOf = (entry: { path: string }) => studioOutputCategory(entry.path);

  it("groups by category and preserves order within a group", () => {
    const groups = groupStudioOutputsByCategory(
      [
        { path: "Outbox/Content/b.md" },
        { path: "Outbox/Images/a.png" },
        { path: "Outbox/Content/a.md" },
      ],
      categoryOf,
    );

    expect(groups.map((group) => group.category)).toEqual(["Content", "Images"]);
    // Newest-first within the group: the server already sorts, so grouping must not reorder.
    expect(groups[0]?.entries.map((entry) => entry.path)).toEqual([
      "Outbox/Content/b.md",
      "Outbox/Content/a.md",
    ]);
  });

  it("returns no groups for no entries", () => {
    expect(groupStudioOutputsByCategory([], categoryOf)).toEqual([]);
  });

  it("orders groups by their first appearance", () => {
    const groups = groupStudioOutputsByCategory(
      [{ path: "Outbox/Images/a.png" }, { path: "Outbox/Content/a.md" }],
      categoryOf,
    );
    expect(groups.map((group) => group.category)).toEqual(["Images", "Content"]);
  });
});
