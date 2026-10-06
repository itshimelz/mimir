// FILE: sponsors/page.tsx
// Purpose: The sponsor wall — a public thank-you listing everyone funding
//          Mimir, grouped by tier. The pitch and the tiers live at /sponsor.
// Layer: App Router page (static, M3E buttons + labels)
// Note: Only public GitHub sponsors belong in data/sponsors.ts — see the note
//       there before adding anyone.

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { SectionEyebrow } from "@/components/SectionEyebrow";
import SiteFooter from "@/components/SiteFooter";
import { SponsorRow } from "@/components/SponsorRow";
import { Button } from "@/components/m3e/button";
import { Icon } from "@/components/m3e/icon";
import { SPONSORS } from "@/data/sponsors";
import { groupSponsors, orderedSponsors, sponsorLink } from "@/lib/sponsors";
import {
  GITHUB_SPONSORS_URL,
  breadcrumbJsonLd,
  jsonLdScript,
  pageMetadata,
  sponsorsPageJsonLd,
} from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Sponsors — Mimir",
  description:
    "The people and companies funding Mimir, the free and open-source command center for agentic development. Thank you to every sponsor and one-time donor.",
  path: "/sponsors",
});

const ORDERED_SPONSORS = orderedSponsors(SPONSORS);

const SPONSORS_JSONLD = [
  sponsorsPageJsonLd(
    ORDERED_SPONSORS.map((sponsor) => ({
      name: sponsor.name,
      url: sponsorLink(sponsor),
    })),
  ),
  breadcrumbJsonLd([
    { name: "Mimir", path: "/" },
    { name: "Sponsors", path: "/sponsors" },
  ]),
];

export default function SponsorsPage() {
  const groups = groupSponsors(ORDERED_SPONSORS);
  const count = ORDERED_SPONSORS.length;

  return (
    <div className="flex min-h-screen flex-col bg-surface text-on-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(SPONSORS_JSONLD) }}
      />
      <Navbar />

      {/* Same container as the landing page, Navbar, and SiteFooter, so the
          heading starts flush under the logo. The sponsor list itself stays
          narrow inside it — a short list of names shouldn't stretch to 6xl. */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
        <header>
          <SectionEyebrow as="p">Sponsors</SectionEyebrow>
          <h1 className="mt-2.5 text-headline-medium text-on-surface">
            The people keeping Mimir free
          </h1>
          <p className="mt-3 max-w-3xl text-body-medium text-on-surface-variant">
            {count === 0
              ? "Mimir is funded entirely by sponsorship. This page is where sponsors get listed — it's empty right now, so the first name on it is available."
              : "Mimir is funded entirely by sponsorship — there's no paid tier and no company behind it. Everyone below chose to fund work they could otherwise use for free. Thank you."}
          </p>
        </header>

        {groups.length > 0 ? (
          <div className="mt-10 space-y-9">
            {groups.map((group) => (
              <section key={group.id}>
                <SectionEyebrow>{group.title}</SectionEyebrow>
                <ul className="mt-3 flex max-w-lg flex-col">
                  {group.sponsors.map((sponsor) => (
                    <li key={sponsor.login}>
                      <SponsorRow sponsor={sponsor} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <p className="mt-10 text-body-medium text-on-surface-variant">
            No sponsors yet — the first slot is open.
          </p>
        )}

        <section className="mt-12 border-t border-outline-variant pt-8">
          <h2 className="text-title-medium text-on-surface">Your name could be on this page</h2>
          <p className="mt-2 max-w-3xl text-body-medium text-on-surface-variant">
            Sponsoring Mimir gets you listed here. Every tier runs through GitHub Sponsors — the
            full breakdown is on the sponsor page.
          </p>
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <Button variant="filled" className="w-full sm:w-auto" render={<Link href="/sponsor" />}>
              <Icon name="favorite" data-icon="inline-start" />
              See the tiers
            </Button>
            <Button
              variant="outlined"
              className="w-full sm:w-auto"
              render={<a href={GITHUB_SPONSORS_URL} target="_blank" rel="noopener noreferrer" />}
            >
              Sponsor on GitHub
              <Icon name="arrow_outward" data-icon="inline-end" />
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
