// FILE: check-brand-identity.ts
// Purpose: Prevents retired first-party identities from returning to tracked files.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const characters = (...codes: number[]): string => String.fromCharCode(...codes);
const retiredShortName = characters(116, 51);
const retiredFirstName = `${retiredShortName}${characters(99, 111, 100, 101)}`;
const retiredCompanyName = `${retiredShortName}${characters(116, 111, 111, 108, 115)}`;
const retiredSecondName = characters(100, 112, 99, 111, 100, 101);
const retiredPredecessorName = characters(99, 111, 100, 101, 116, 104, 105, 110, 103);
const incorrectBundleDomain = characters(99, 111, 109, 46, 115, 121, 110, 97, 114, 97);
const retiredFirstDisplayName = characters(84, 51, 67, 111, 100, 101);
const retiredFirstSpacedDisplayName = `${characters(84, 51)} Code`;
const retiredCompanyDisplayName = `${characters(84, 51)} ${characters(84, 111, 111, 108, 115)}`;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const joinedWithOptionalSeparator = (left: string, right: string): string =>
  `${escapeRegExp(left)}[\\s._/@:-]*${escapeRegExp(right)}`;

const forbiddenPatterns = [
  new RegExp(
    joinedWithOptionalSeparator(retiredShortName, retiredFirstName.slice(retiredShortName.length)),
    "i",
  ),
  new RegExp(
    joinedWithOptionalSeparator(
      retiredShortName,
      retiredCompanyName.slice(retiredShortName.length),
    ),
    "i",
  ),
  new RegExp(
    joinedWithOptionalSeparator(retiredSecondName.slice(0, 2), retiredSecondName.slice(2)),
    "i",
  ),
  new RegExp(escapeRegExp(retiredPredecessorName), "i"),
  new RegExp(`@${escapeRegExp(retiredCompanyName)}`, "i"),
  new RegExp(
    `(?:^|[\\s"'\\x60./:@_-])${escapeRegExp(retiredShortName)}(?:$|[\\s"'\\x60./:@_-])`,
    "i",
  ),
  new RegExp(escapeRegExp(incorrectBundleDomain), "i"),
] as const;

const retiredProductName = characters(83, 121, 110, 97, 114, 97);
// Matches any bundle identifier whose last label is the retired product name,
// so both the vendor-prefixed and bare forms are caught. Not passed through
// escapeRegExp: the grouping and dot escapes are intentional regex.
const retiredProductBundleDomainPattern = `com\\.(?:[a-z0-9-]+\\.)*${retiredProductName.toLowerCase()}\\b`;

// Mimir retired the Synara brand. These patterns forbid it from returning.
//
// Deliberately case-sensitive: the `@synara/*` package scope, the `SYNARA_*`
// environment variables and the `synara_*` MCP tool namespace are still the
// live internal identifiers (rebrand phase B), so a case-insensitive pattern
// would flag the whole codebase instead of a brand regression.
const retiredBrandPatterns = [
  // Former macOS bundle identifier.
  new RegExp(retiredProductBundleDomainPattern),
  // Former marketing and documentation host.
  new RegExp(escapeRegExp("trysynara.com"), "i"),
  // Former display name used as a standalone value.
  new RegExp(`["']${escapeRegExp(retiredProductName)}["']`),
  // Former installed file names.
  new RegExp(`${escapeRegExp(retiredProductName)}\\.(?:app|exe)`),
  new RegExp(escapeRegExp(`${retiredProductName} Beta`)),
  // Former release artifact prefix, e.g. Synara-0.9.2-x64.exe.
  new RegExp(`${escapeRegExp(retiredProductName)}-\\d`),
] as const;

// The retired-brand scan is scoped to shipped source. The original
// forbiddenPatterns pass still covers every tracked file, but extending that to
// the Synara name would flag ~130 files of upstream history, test fixtures and
// product docs, so each upstream merge would break the build. This scope is the
// surface where a brand regression actually reaches users.
const retiredBrandScope = {
  include: [/^apps\/[^/]+\/src\//, /^apps\/desktop\/scripts\//, /^packages\/[^/]+\/src\//],
  exclude: [/\.(?:test|browser|spec)\.[^/]+$/, /_fixtures?\//],
} as const;

function isWithinRetiredBrandScope(path: string): boolean {
  if (!retiredBrandScope.include.some((pattern) => pattern.test(path))) return false;
  return !retiredBrandScope.exclude.some((pattern) => pattern.test(path));
}

// Whole files that legitimately still describe the retired Synara product.
// Each entry states why, because "we forgot" is not a durable exemption.
const approvedRetiredBrandFiles: readonly { readonly path: string; readonly reason: string }[] = [
  {
    path: "BETA.md",
    reason: "Documents the Synara Beta channel, which Mimir does not ship.",
  },
  {
    path: "docs/providers.md",
    reason: "Provider setup docs still link Synara's published provider guides.",
  },
  {
    path: "docs/core-concepts.md",
    reason: "Prose written against the Synara product; A6 rewrites product docs.",
  },
  {
    path: "docs/quickstart.md",
    reason: "Prose written against the Synara product; A6 rewrites product docs.",
  },
  {
    path: "docs/README.md",
    reason: "Prose written against the Synara product; A6 rewrites product docs.",
  },
  {
    path: "docs/canary.md",
    reason: "Documents the Synara canary lane, which Mimir does not ship.",
  },
  {
    path: "docs/release.md",
    reason: "Release runbook still names the Synara updater manifests; A6 updates it.",
  },
  {
    path: "docs/hubs.md",
    reason: "Prose written against the Synara product; A6 rewrites product docs.",
  },
  {
    path: "docs/diagnostics.md",
    reason: "Prose written against the Synara product; A6 rewrites product docs.",
  },
  {
    path: "README.md",
    reason: "Fork provenance and upstream links; A6 rewrites the product sections.",
  },
  {
    path: "apps/marketing/src/data/changelog.ts",
    reason: "Published Synara changelog, retained for provenance.",
  },
  {
    path: "apps/marketing/src/data/latest-release-downloads.json",
    reason: "Recorded Synara release checksums; factual provenance.",
  },
  {
    path: "apps/desktop/src/betaChannel.ts",
    reason: "Synara Beta handoff code. Mimir ships production only, so it never runs.",
  },
  {
    path: "apps/desktop/src/betaInstaller.ts",
    reason: "Synara Beta installer code. Mimir ships production only, so it never runs.",
  },
  {
    path: "apps/desktop/src/betaDiagnostics.ts",
    reason: "Synara Beta diagnostics. Mimir ships production only, so it never runs.",
  },
  {
    path: "apps/server/src/betaUsageSnapshot.ts",
    reason: "Synara Beta usage snapshot. Mimir ships production only, so it never runs.",
  },
  {
    path: "apps/web/src/components/BetaWelcomeDialog.tsx",
    reason: "Synara Beta welcome dialog. Mimir ships production only, so it never renders.",
  },
  {
    path: "packages/shared/src/betaChannel.ts",
    reason: "Beta handoff constants and the Synara prerelease feed URL.",
  },
  {
    path: "apps/marketing/src/data/testimonials.ts",
    reason: "A real user's words quoted verbatim, naming Synara.",
  },
  {
    path: "scripts/check-brand-identity.ts",
    reason: "This guard names the retired patterns it forbids.",
  },
  {
    path: "packages/shared/src/providerMetadata.ts",
    reason:
      "setupDocsHref points at Synara's published per-provider guides. Accurate third-party setup docs; Mimir has no docs site yet.",
  },
  {
    path: "apps/web/src/onboarding/tourContent.ts",
    reason: "Onboarding links to Synara's published docs. Mimir has no docs site yet.",
  },
  {
    path: "apps/web/src/components/Sidebar.tsx",
    reason: "SYNARA_DOCS_URL links to Synara's published docs, plus one stale comment.",
  },
  {
    path: "apps/web/src/feedback.ts",
    reason:
      "Posts feedback to Synara's public endpoint. Needs a Mimir endpoint decision; flagged deliberately rather than silently repointed.",
  },
  {
    path: "apps/web/src/components/profile/shareCardExport.ts",
    reason: "Share card URL still points at Synara's site. Needs a Mimir domain decision.",
  },
  {
    path: "apps/desktop/scripts/dev-electron.mjs",
    reason: "Dev launcher naming for the Synara Beta flavor. Mimir ships production only.",
  },
];

// Whole directories that are still the retired product. The marketing site is
// Synara's, points at Synara's domain, and is not part of the Mimir app; it is
// a separate rewrite decision rather than a rebrand oversight.
const approvedRetiredBrandPrefixes: readonly string[] = ["apps/marketing/"];

interface ApprovedIdentityLine {
  readonly path: string;
  readonly line: string;
  readonly markdownSection?: string;
}

const approvedIdentityLines: readonly ApprovedIdentityLine[] = [
  {
    path: "LICENSE",
    line: `Copyright (c) 2026 ${retiredCompanyDisplayName} Inc.`,
  },
  {
    path: "README.md",
    markdownSection: "## Origins",
    line: `Synara began as a clone of [${retiredFirstDisplayName}](https://github.com/pingdotgg/${retiredFirstName}), but it has since become a substantially different product with its own branding, packaging, release system, provider orchestration, desktop app behavior, and product direction.`,
  },
  {
    path: "CHANGELOG.md",
    markdownSection: "## 0.7.0 - 2026-08-05",
    line: `**A review of the Synara codebase found an analytics configuration that came from the original ${retiredFirstSpacedDisplayName} codebase when Synara was created as a clone in March. We did not add it, and we have no access to the PostHog project receiving the events.**`,
  },
  {
    // The website's copy of the same published disclosure as CHANGELOG.md.
    path: "apps/marketing/src/data/changelog.ts",
    line: `"A review of the Synara codebase found an analytics configuration that came from the original ${retiredFirstDisplayName.slice(0, 2)} Code codebase when Synara was created as a clone in March.",`,
  },
  {
    // A real user's words, quoted verbatim on the homepage. The retired name
    // here refers to someone else's product, not to Synara's own identity.
    path: "apps/marketing/src/data/testimonials.ts",
    line: `"I've been using @trySynara for a few hours now. I'm really impressed. I'd already tried ${retiredFirstDisplayName.slice(0, 2)} Chat, Orca, and Terax, but none of them managed to grab my attention quite like Synara did.",`,
  },
  // Preserve the recorded license provenance; these are exact attribution
  // lines, not permission to reintroduce retired product names in these docs.
  {
    path: "docs/computer-use-cua/extraction-plan.md",
    markdownSection: "## Upstream license and PR-back feasibility",
    line: `also MIT (LICENSE, ${retiredCompanyDisplayName} Inc and Emanuele Di Pietro). There is no license`,
  },
  {
    path: "docs/computer-use-cua/handoffs/synara-cu-v2-mega-handoff-2026-09-16.md",
    line: `- Decide what ships open: likely the driver patch + host protocol + tools + docs (MIT/Apache), either as its own project or upstreamed into trycua/cua; Synara product code can stay whatever it is. Keep \`CUA-LICENSE.txt\` attribution; Synara repo is MIT (${retiredCompanyDisplayName} Inc + Emanuele Di Pietro).`,
  },
  {
    path: "docs/computer-use-cua/open-decisions-sheet.md",
    markdownSection: "## 3. Which license",
    line: `- Verification: Synara repo is MIT, held by ${retiredCompanyDisplayName} Inc and Emanuele Di Pietro`,
  },
  {
    path: "docs/computer-use-cua/workstream-f-opensource-spec.md",
    markdownSection: "## Current state",
    line: `The tree already carries two licenses. The Synara repo is MIT, held by ${retiredCompanyDisplayName} Inc and Emanuele Di Pietro (\`LICENSE:1\`, \`LICENSE:3\`). The Cua driver redistribution license is MIT, held by Cua AI Inc (\`docs/computer-use-cua/CUA-LICENSE.txt:1\`, \`docs/computer-use-cua/CUA-LICENSE.txt:3\`). The redistribution license is referenced from the computer use README (\`docs/computer-use-cua/README.md:15\`). A full read of \`package.json:1\` through the end of the file shows no license field, so the root manifest states no license of its own. This is unverified as a problem, but an auditor will flag it.`,
  },
  // These two terms are the cubic time coefficient in the reviewed native
  // patch. Keep the patch and its recorded checksum unchanged.
  ...[0, 1].map((axis) => ({
    path: "apps/desktop/patches/cua-driver/0001-synara-native.patch",
    line: `+                            + ${retiredShortName} * self.to.${axis}`,
  })),
];

// These are existing macOS TCC fixture identities, including identities in
// recorded evidence. Renaming them would change permission ownership or falsify
// the evidence. Only the complete reviewed ID is allowed at each exact path;
// the rest of every line still goes through the ordinary branding checks.
const approvedFixtureBundleIdentityPatterns = new Map<string, RegExp>(
  [
    {
      suffix: "cua-fixture",
      paths: [
        "apps/desktop/src/cuaFixtures/electron.ts",
        "apps/desktop/src/cuaFixtures/live.ts",
        "scripts/computer-use-fixtures/build-electron.mjs",
        "docs/computer-use-cua/evidence/efficiency-implementation-2026-09-08/native/signed-fixture-permission-check.json",
        "docs/computer-use-cua/evidence/fixture-g5-set-value-2026-09-17.report.json",
        "docs/computer-use-cua/evidence/gateway-native-report.json",
        "docs/computer-use-cua/evidence/live-provider-report.json",
        "docs/computer-use-cua/evidence/native-fixture-report.json",
        "docs/computer-use-cua/evidence/native-fixture-run6-report.json",
        "docs/computer-use-cua/evidence/native-revision1-final-report.json",
        "docs/computer-use-cua/evidence/native-revision1-foreground-initial-report.json",
        "docs/computer-use-cua/evidence/native-revision1-renewed-build-permission-refusal.json",
        "docs/computer-use-cua/evidence/native-revision1-report.json",
        "docs/computer-use-cua/evidence/overlay-disabled-report.json",
        "docs/computer-use-cua/evidence/overlay-enabled-report.json",
        "docs/computer-use-cua/evidence/rev15-electron-2026-09-17-report.json",
        "docs/computer-use-cua/evidence/short-cursor-report.json",
      ],
    },
    {
      suffix: "cua-fixture-external",
      paths: [
        "docs/computer-use-cua/evidence/rev17-cancellation-2026-09-17-notes.md",
        "docs/computer-use-cua/evidence/rev17-cancellation-2026-09-17-report.json",
        "docs/computer-use-cua/evidence/rev17-gateway-2026-09-17-notes.md",
        "docs/computer-use-cua/evidence/rev17-gateway-2026-09-17-report.json",
        "docs/computer-use-cua/evidence/rev17-live-2026-09-17-live-report.json",
        "docs/computer-use-cua/evidence/rev17-live-2026-09-17-notes.md",
        "docs/computer-use-cua/evidence/rev17-live-2026-09-17-report.json",
        "docs/computer-use-cua/evidence/rev17-native-2026-09-17-notes.md",
        "docs/computer-use-cua/evidence/rev17-native-2026-09-17-report.json",
      ],
    },
    {
      suffix: "cua-canary",
      paths: [
        "scripts/computer-use-fixtures/build-canary.mjs",
        "scripts/computer-use-fixtures/canary-main.ts",
        "scripts/computer-use-fixtures/live-cert.ts",
        "docs/computer-use-cua/belief-canary-runbook.md",
        "docs/computer-use-cua/handoffs/synara-cu-v2-session-handoff-2026-09-17.md",
        "docs/computer-use-cua/evidence/rev20-realapp-calculator-2026-09-17-report.json",
        "docs/computer-use-cua/evidence/rev20-realapp-notes-2026-09-17-report.json",
      ],
    },
    {
      suffix: "test",
      paths: [
        "apps/server/src/computer/CuaComputerBackend.test.ts",
        "apps/server/src/computer/computerSignatureChange.test.ts",
      ],
    },
    {
      suffix: "latency-probe",
      paths: [
        "docs/computer-use-cua/evidence/latency-rev17-probe.ts",
        "docs/computer-use-cua/evidence/latency-rev17-supplement-probe.ts",
      ],
    },
    {
      suffix: "cua-display-cert",
      paths: ["scripts/computer-use-fixtures/multi-display-cert.ts"],
    },
  ].flatMap(({ suffix, paths }) =>
    paths.map(
      (path) =>
        [
          path,
          new RegExp(
            `(?<![a-zA-Z0-9_.-])${escapeRegExp(`${incorrectBundleDomain}.${suffix}`)}(?![a-zA-Z0-9_.-])`,
            "g",
          ),
        ] as const,
    ),
  ),
);

// Raster images cannot be searched for embedded text. Keep the user-facing
// screenshots behind reviewed digests so changing either one requires another
// explicit visual identity audit instead of silently bypassing this guard.
const approvedVisualAssetDigests = new Map<string, string>([
  [
    "apps/marketing/public/screenshot.jpeg",
    "0b4be139f13dd08885a1aac26fc1f7c623697db157777d16360e985c93d47bcf",
  ],
  [
    "assets/prod/synara-hero.jpeg",
    "07fbd00bde259b5ed2c69f404c00c1347de2fa46fa4a5e2aa70f016912dc2490",
  ],
]);

export interface BrandIdentityFile {
  readonly path: string;
  readonly contents: string;
}

export interface BrandIdentityViolation {
  readonly path: string;
  readonly line: number | null;
  readonly text: string;
}

export interface BrandIdentityBinaryFile {
  readonly path: string;
  readonly contents: Uint8Array;
}

function containsForbiddenIdentity(value: string): boolean {
  return forbiddenPatterns.some((pattern) => pattern.test(value));
}

function containsRetiredBrand(value: string): boolean {
  return retiredBrandPatterns.some((pattern) => pattern.test(value));
}

function findApprovedIdentityLine(
  path: string,
  line: string,
  markdownSection: string | null,
  consumedLines: ReadonlySet<number>,
): number | null {
  const index = approvedIdentityLines.findIndex(
    (approved, candidateIndex) =>
      !consumedLines.has(candidateIndex) &&
      approved.path === path &&
      approved.line === line.trim() &&
      (approved.markdownSection === undefined || approved.markdownSection === markdownSection),
  );
  return index === -1 ? null : index;
}

export function findBrandIdentityViolations(
  files: readonly BrandIdentityFile[],
): BrandIdentityViolation[] {
  const violations: BrandIdentityViolation[] = [];
  for (const file of files) {
    if (containsForbiddenIdentity(file.path)) {
      violations.push({ path: file.path, line: null, text: file.path });
    }
    // Exemptions suppress only the retired-brand check. The original
    // forbiddenPatterns pass still runs on every line of every file, so an
    // exemption cannot be used to smuggle the older retired identities back in.
    const exemptFromRetiredBrand =
      approvedRetiredBrandFiles.some((approved) => approved.path === file.path) ||
      approvedRetiredBrandPrefixes.some((prefix) => file.path.startsWith(prefix));
    const scanRetiredBrand = !exemptFromRetiredBrand && isWithinRetiredBrandScope(file.path);
    const consumedLines = new Set<number>();
    const approvedFixtureIdentity = approvedFixtureBundleIdentityPatterns.get(file.path);
    let markdownSection: string | null = null;
    for (const [index, line] of file.contents.split(/\r?\n/).entries()) {
      if (/^#{1,2}\s+/.test(line)) markdownSection = line.trim();
      const textToCheck = approvedFixtureIdentity
        ? line.replace(approvedFixtureIdentity, "")
        : line;
      const isViolation =
        containsForbiddenIdentity(textToCheck) ||
        (scanRetiredBrand && containsRetiredBrand(textToCheck));
      if (!isViolation) continue;
      const approvedLine = findApprovedIdentityLine(
        file.path,
        line,
        markdownSection,
        consumedLines,
      );
      if (approvedLine !== null) {
        consumedLines.add(approvedLine);
        continue;
      }
      violations.push({ path: file.path, line: index + 1, text: line.trim() });
    }
  }
  return violations;
}

export function findVisualBrandAssetViolations(
  files: readonly BrandIdentityBinaryFile[],
  approvedDigests: ReadonlyMap<string, string> = approvedVisualAssetDigests,
): BrandIdentityViolation[] {
  const filesByPath = new Map(files.map((file) => [file.path, file]));
  const violations: BrandIdentityViolation[] = [];
  for (const [path, approvedDigest] of approvedDigests) {
    const file = filesByPath.get(path);
    if (!file) {
      violations.push({
        path,
        line: null,
        text: "Required visual brand asset is missing.",
      });
      continue;
    }
    const digest = createHash("sha256").update(file.contents).digest("hex");
    if (digest !== approvedDigest) {
      violations.push({
        path,
        line: null,
        text: "Visual brand asset changed; perform a visual identity review before approving it.",
      });
    }
  }
  return violations;
}

export function readTrackedFiles(cwd = process.cwd()): BrandIdentityBinaryFile[] {
  const entries = execFileSync("git", ["ls-files", "--stage", "-z"], { cwd, encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
  // Gitlinks name another repository, not a file owned by this checkout. They may
  // exist as directories or be absent when submodules have not been initialized.
  const paths = entries
    .filter((entry) => !entry.startsWith("160000 "))
    .map((entry) => entry.slice(entry.indexOf("\t") + 1));
  return paths.map((path) => ({ path, contents: readFileSync(resolve(cwd, path)) }));
}

function main(): void {
  const trackedFiles = readTrackedFiles();
  const searchableFiles = trackedFiles.map((file) => ({
    path: file.path,
    contents: file.contents.includes(0) ? "" : Buffer.from(file.contents).toString("utf8"),
  }));
  const violations = [
    ...findBrandIdentityViolations(searchableFiles),
    ...findVisualBrandAssetViolations(trackedFiles),
  ];
  if (violations.length === 0) {
    console.log("Synara identity check passed.");
    return;
  }

  console.error("Retired first-party identity found:");
  for (const violation of violations) {
    const location =
      violation.line === null ? violation.path : `${violation.path}:${violation.line}`;
    console.error(`- ${location}: ${violation.text}`);
  }
  process.exitCode = 1;
}

if (import.meta.main) main();
