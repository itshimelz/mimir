// FILE: data/changelog.ts
// Purpose: Curated Mimir release notes powering the public /changelog page.
// Layer: static data (server-importable). Mirrors the in-app "What's new"
//        changelog from the Mimir desktop app, newest release first.
// Note: To add a release, prepend a new entry. `date` is rendered verbatim,
//       so keep the format consistent (e.g. "Oct 4").
// Note: Mimir started at 0.0.1, so this is the only entry. The pre-Mimir
//       releases are not carried over: they shipped as a different product and
//       version line, and presenting them as Mimir history would misstate what
//       this product has released. The authoritative notes live in the
//       repository CHANGELOG.md; keep the two in sync.

/** A single highlight inside a release. */
export interface ChangelogFeature {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly image?: string;
  readonly imageAlt?: string;
  readonly details?: string;
}

/** One released version, with its date label and feature highlights. */
export interface ChangelogEntry {
  readonly version: string;
  readonly date: string;
  readonly features: readonly ChangelogFeature[];
  readonly heroImage?: string;
  readonly heroImageAlt?: string;
}

export const CHANGELOG_ENTRIES: readonly ChangelogEntry[] = [
  {
    version: "0.0.1",
    date: "Oct 4",
    features: [
      {
        id: "first-release",
        title: "First release of Mimir",
        description:
          "Mimir is a desktop-first agentic co-learner for university students. This release resets the product line to a fresh 0.0.1 and ships the production app only, with the Mimir identity, update feed, and iconography.",
        details:
          "Mimir is built on the provider orchestration, workspace, and packaging that Synara shipped as MIT-licensed open source, and is being reshaped into an agentic co-learner.",
      },
      {
        id: "desktop-app",
        title: "Desktop app for macOS, Windows, and Linux",
        description:
          "Production desktop builds for macOS (Apple Silicon and Intel), Windows, and Linux, signed with the Mimir identity.",
        details: "The macOS bundle is signed and notarized as `com.itshimelz.mimir`.",
      },
      {
        id: "study-workspaces",
        title: "Chat-driven study workspaces",
        description:
          "Projects and threads keep your coursework, notes, and agent sessions together in a local-first workspace.",
        details:
          "Workspace state stays on your machine. Each thread keeps its own provider session, working directory, terminal, and review state.",
      },
      {
        id: "providers",
        title: "Provider orchestration",
        description:
          "Run Claude Code, Codex, Cursor, Grok, OpenCode, Droid, Devin, Antigravity, and Pi from one workspace, using the accounts you already have.",
        details: "Each provider keeps its own authentication, models, limits, and permissions.",
      },
      {
        id: "computer-use",
        title: "Computer Use and an in-app browser",
        description:
          "Let an agent work across your desktop and the web, with reviewable evidence for what it did.",
      },
      {
        id: "no-beta",
        title: "No Beta channel in this release",
        description:
          "Mimir ships production only for now. There is no Beta channel to opt into from this release.",
      },
    ],
  },
];
