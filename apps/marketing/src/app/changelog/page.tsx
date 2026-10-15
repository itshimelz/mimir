// FILE: changelog/page.tsx
// Purpose: Public changelog — every Mimir release, newest first. Editorial,
//          single-column layout inspired by the OpenAI Codex changelog, in our
//          palette: muted date, large headline with a light-gray version, airy
//          bullet lists, and inline `code` chips.
// Layer: App Router page (static). Body lives in ChangelogContent so the
//        per-version /changelog/v0.1.1 deep-link route can reuse it verbatim.
// Note: Content mirrors the in-app "What's new" changelog (src/data/changelog.ts).

import { redirect } from "next/navigation";
import ChangelogContent from "@/components/ChangelogContent";
import { breadcrumbJsonLd, changelogCollectionJsonLd, jsonLdScript, pageMetadata } from "@/lib/seo";
import { getSortedReleases } from "@/lib/changelog";

export const metadata = pageMetadata({
  title: "Changelog — Mimir",
  description:
    "Release notes for Mimir. Mimir began at 0.0.1; every release since is logged here as it ships.",
  path: "/changelog",
});

export default function ChangelogPage() {
  redirect("/");
  const releases = getSortedReleases();
  const jsonLd = [
    changelogCollectionJsonLd(releases),
    breadcrumbJsonLd([
      { name: "Mimir", path: "/" },
      { name: "Changelog", path: "/changelog" },
    ]),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />
      <ChangelogContent />
    </>
  );
}
