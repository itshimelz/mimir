// FILE: whatsNew/entries.ts
// Purpose: Curated "What's new" changelog rendered in the post-update dialog
// and the settings Release history view.
// Layer: static data consumed by `useWhatsNew`, `WhatsNewDialog`, and
// `ChangelogAccordion`.
//
// Mimir starts its release history at 0.0.1. The upstream release notes this
// product line was built on stay in the repository CHANGELOG.md for provenance
// and are deliberately not shown in the app.
//
// Authoring guide
// ---------------
//   - Prepend new releases so the file reads newest-first (the UI sorts too,
//     but keeping the source tidy makes PRs easier to review).
//   - `version` must match `apps/web/package.json#version` exactly. The
//     logic compares versions as semver and only opens the dialog when the
//     installed build has a curated entry here.
//   - `date` is rendered verbatim — pick whatever format you want (e.g.
//     `"Apr 18"`, `"2026-04-18"`), just be consistent release-to-release.
//   - Each feature takes an `id` (stable, unique per release), a short
//     `title`, a marketing `description`, and optionally an `image`
//     (absolute path from `apps/web/public`, e.g. `/whats-new/0.0.29/foo.png`)
//     plus `details` for the longer technical note shown under the image.

import type { WhatsNewEntry } from "./logic";

export const WHATS_NEW_ENTRIES: readonly WhatsNewEntry[] = [
  {
    version: "0.0.1",
    date: "2026-10-04",
    features: [
      {
        id: "mimir-launch",
        title: "Meet Mimir",
        description:
          "First release of Mimir, a desktop-first agentic co-learner for university students.",
        details:
          "Chat-driven study workspaces backed by local-first projects and threads, with provider orchestration across Claude Code, Codex, Cursor, Grok, OpenCode, Droid, Devin, Antigravity, and Pi. Computer Use and an in-app browser for agent-driven desktop and web work. Ships for macOS (Apple Silicon and Intel), Windows, and Linux, signed with the Mimir identity.",
      },
      {
        id: "mimir-fresh-start",
        title: "A fresh start",
        description:
          "Release history begins here. Notes from the upstream releases this product line was built on are kept in the repository changelog for provenance, not shown in the app.",
      },
    ],
  },
];
