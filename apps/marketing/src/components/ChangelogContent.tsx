// FILE: ChangelogContent.tsx
// Purpose: Changelog page body — editorial layout for the full archive and
//          per-release pages. Keeps release rendering shared while letting
//          /changelog/v0.1.1 expose only that release for cleaner indexing.
// Layer: Server component (M3E type scale + buttons).
//        Content mirrors the in-app "What's new" dialog (src/data/changelog.ts).

import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import ChangelogNav from "@/components/ChangelogNav";
import ChangelogPicker from "@/components/ChangelogPicker";
import { Button } from "@/components/m3e/button";
import { Icon } from "@/components/m3e/icon";
import { type ChangelogEntry } from "@/data/changelog";
import { GITHUB_RELEASES_URL } from "@/lib/seo";
import { getSortedReleases, toAnchor, toVersionSlug } from "@/lib/changelog";

// Render `backtick` spans as inline code chips; everything else is plain text.
// The changelog data only uses backticks (no links/bold), so this stays tiny.
function renderInline(text: string): ReactNode {
  return text.split(/(`[^`]+`)/g).map((part, i) => {
    if (part.length > 1 && part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded-xs border border-outline-variant bg-surface-container-high px-1.5 py-0.5 font-mono text-[0.82em] text-on-surface"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export default function ChangelogContent({
  releases = getSortedReleases(),
  title = "What's new in Mimir.",
  description = "Mimir began at 0.0.1. Every release since is logged here as it ships — the same notes you see in the app's \"What's new\" dialog.",
}: {
  releases?: ChangelogEntry[];
  title?: string;
  description?: string;
} = {}) {
  const highlightedRelease = releases[0];
  const releaseLabel = releases.length === 1 ? "Release" : "Latest release";
  const navItems = releases.map((entry) => ({
    version: entry.version,
    date: entry.date,
    anchor: toAnchor(entry.version),
  }));

  return (
    <div className="flex min-h-screen flex-col bg-surface text-on-surface">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-10 pb-24 sm:px-6 sm:pt-16 md:max-w-6xl">
        <div className="md:grid md:grid-cols-[11rem_minmax(0,1fr)] md:gap-16 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-24">
          <aside className="hidden md:block">
            <ChangelogNav items={navItems} />
          </aside>

          <div className="min-w-0">
            <header className="max-w-2xl">
              <p className="hidden text-label-large text-primary md:block">Changelog</p>
              <ChangelogPicker items={navItems} />
              <h1 className="mt-3 text-headline-medium text-on-surface sm:text-headline-large">
                {title}
              </h1>
              <p className="mt-5 text-body-medium text-on-surface-variant sm:text-body-large">
                {description}
              </p>
              {highlightedRelease ? (
                <p className="mt-7 flex items-center gap-2.5 text-body-small text-on-surface-variant">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:hidden" />
                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                  </span>
                  {releaseLabel}{" "}
                  <span className="font-medium text-on-surface">{highlightedRelease.version}</span>
                  <span className="text-on-surface-variant">· {highlightedRelease.date}</span>
                </p>
              ) : null}
            </header>

            <div className="mt-14 space-y-16 sm:mt-20 sm:space-y-24">
              {releases.map((entry) => (
                <Release key={entry.version} entry={entry} />
              ))}
            </div>

            <div className="mt-20 flex flex-col gap-4 border-t border-outline-variant pt-8 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-body-small text-on-surface-variant">
                Updated with every release.{" "}
                <a
                  href={GITHUB_RELEASES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 transition-colors hover:text-primary-dim"
                >
                  See releases on GitHub
                </a>
                .
              </p>
              <Button variant="filled" className="w-fit" render={<Link href="/install" />}>
                Download Mimir
                <Icon name="download" data-icon="inline-end" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function Release({ entry }: { entry: ChangelogEntry }) {
  const anchor = toAnchor(entry.version);
  const single = entry.features.length === 1;

  return (
    <section id={anchor} className="scroll-mt-24">
      {/* Date links to the shareable per-version URL (/changelog/v0.1.1). */}
      <Link
        href={`/changelog/${toVersionSlug(entry.version)}`}
        className="group inline-flex items-center gap-1.5 text-body-medium text-on-surface-variant transition-colors hover:text-on-surface"
      >
        {entry.date}
        <Icon
          name="link"
          size={14}
          aria-hidden="true"
          className="opacity-0 transition-opacity group-hover:opacity-100"
        />
        <span className="sr-only">— link to Mimir {entry.version}</span>
      </Link>
      <h2 className="mt-1.5 text-title-large text-on-surface">
        Mimir <span className="font-normal text-on-surface-variant">{entry.version}</span>
      </h2>

      {single ? (
        <div className="mt-6">
          <Feature feature={entry.features[0]} />
        </div>
      ) : (
        <ul className="mt-7 space-y-5">
          {entry.features.map((feature) => (
            <li key={feature.id} className="flex gap-3.5">
              <span
                aria-hidden="true"
                className="mt-[0.66em] size-[5px] shrink-0 rounded-full bg-on-surface-variant"
              />
              <Feature feature={feature} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Feature({ feature }: { feature: ChangelogEntry["features"][number] }) {
  return (
    <div className="min-w-0">
      <p className="text-body-large text-on-surface-variant">
        <span className="font-medium text-on-surface">{renderInline(feature.title)}</span>
        <span className="text-on-surface-variant"> — </span>
        {renderInline(feature.description)}
      </p>
      {feature.details ? (
        <p className="mt-2 text-body-medium text-on-surface-variant">
          {renderInline(feature.details)}
        </p>
      ) : null}
    </div>
  );
}
