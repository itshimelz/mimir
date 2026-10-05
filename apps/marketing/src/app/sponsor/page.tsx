// FILE: sponsor/page.tsx
// Purpose: Sponsorship page — the GitHub Sponsors tiers, what the money funds,
//          and the current sponsor roll. Linked from the navbar and footer.
// Layer: App Router page (static, M3E cards + buttons)
// Note: Tier copy lives in data/sponsorTiers.ts and mirrors the live GitHub
//       tiers. Every CTA deep-links into GitHub Sponsors — checkout is entirely
//       GitHub's, this page never handles payment.
//       Layout deliberately tracks /sponsors: same container, left-aligned
//       header, M3E section labels, and a single rule above the closing CTA.

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { SectionEyebrow } from "@/components/SectionEyebrow";
import SiteFooter from "@/components/SiteFooter";
import { SponsorRow } from "@/components/SponsorRow";
import { Button } from "@/components/m3e/button";
import { Card } from "@/components/m3e/card";
import { Icon } from "@/components/m3e/icon";
import { SPONSORS } from "@/data/sponsors";
import {
  ONE_TIME_SPONSORSHIP,
  SPONSOR_FUNDING_USES,
  SPONSOR_TIERS,
  type SponsorTier,
} from "@/data/sponsorTiers";
import { ONE_TIME_CHECKOUT_URL, monthlyTierCheckoutUrl, orderedSponsors } from "@/lib/sponsors";
import {
  GITHUB_SPONSORS_URL,
  breadcrumbJsonLd,
  jsonLdScript,
  pageMetadata,
  sponsorJsonLd,
} from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Sponsor — Mimir",
  description:
    "Sponsor Mimir on GitHub Sponsors. Monthly tiers from $5 to $499, plus custom one-time amounts, fund development, reliable releases, and docs for the free, open-source desktop app.",
  path: "/sponsor",
});

const SPONSOR_JSONLD = [
  sponsorJsonLd(SPONSOR_TIERS),
  breadcrumbJsonLd([
    { name: "Mimir", path: "/" },
    { name: "Sponsor", path: "/sponsor" },
  ]),
];

export default function SponsorPage() {
  const sponsors = orderedSponsors(SPONSORS);

  return (
    <div className="flex min-h-screen flex-col bg-surface text-on-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(SPONSOR_JSONLD) }}
      />
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
        <header>
          <SectionEyebrow as="p">Sponsor</SectionEyebrow>
          <h1 className="mt-2.5 text-headline-medium text-on-surface">
            Mimir is free. Sponsorship is what keeps it that way.
          </h1>
          <p className="mt-3 max-w-3xl text-body-medium text-on-surface-variant">
            Mimir Desktop is open source under the MIT license, with no paid tier, no account, and
            nothing held back behind a subscription. It&apos;s maintained by me, with help from some
            kind developers in the open source community. If it saves you time, sponsoring is the
            most direct way to keep it moving — every tier below runs through GitHub Sponsors, so
            billing, receipts, and cancellation stay entirely on GitHub.
          </p>
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <Button
              variant="filled"
              className="w-full sm:w-auto"
              render={
                <a href={GITHUB_SPONSORS_URL} target="_blank" rel="noopener noreferrer" />
              }
            >
              <Icon name="favorite" data-icon="inline-start" />
              Become a sponsor
            </Button>
            <Button
              variant="outlined"
              className="w-full sm:w-auto"
              render={<a href={ONE_TIME_CHECKOUT_URL} target="_blank" rel="noopener noreferrer" />}
            >
              Give once
              <Icon name="arrow_outward" data-icon="inline-end" />
            </Button>
          </div>
        </header>

        <section className="mt-12">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between">
            <SectionEyebrow>Monthly tiers</SectionEyebrow>
            <p className="text-body-small text-on-surface-variant">
              Cancel any time from your GitHub billing settings.
            </p>
          </div>

          {/* Six cells divide evenly into 1/2/3 columns, so no row is ever left
              with a gap. */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SPONSOR_TIERS.map((tier) => (
              <TierCard key={tier.id} tier={tier} />
            ))}
            <OneTimeCard />
          </div>
        </section>

        <section className="mt-12">
          <SectionEyebrow>Where the money goes</SectionEyebrow>
          {/* Plain columns, not cards. The tier grid above is the only thing on
              this page that earns card chrome — three short paragraphs read
              better unboxed, the same way the sponsor rows do. */}
          <div className="mt-4 grid gap-6 sm:grid-cols-3 sm:gap-8">
            {SPONSOR_FUNDING_USES.map((use) => (
              <div key={use.title}>
                <h3 className="text-title-small text-on-surface">{use.title}</h3>
                <p className="mt-1.5 text-body-medium text-on-surface-variant">{use.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between">
            <SectionEyebrow>
              {sponsors.length === 1 ? "Current sponsor" : "Current sponsors"}
            </SectionEyebrow>
            {sponsors.length > 0 ? (
              <Link
                href="/sponsors"
                className="inline-flex items-center gap-1 text-body-small text-primary transition-colors hover:text-primary-dim"
              >
                See the full sponsor wall
                <Icon name="arrow_outward" size={14} aria-hidden="true" />
              </Link>
            ) : null}
          </div>
          <p className="mt-2 max-w-3xl text-body-medium text-on-surface-variant">
            Thank you — genuinely. This list is updated by hand as sponsorships come in.
          </p>

          {sponsors.length > 0 ? (
            <ul className="mt-3 flex max-w-lg flex-col">
              {sponsors.slice(0, 6).map((sponsor) => (
                <li key={sponsor.login}>
                  <SponsorRow sponsor={sponsor} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-body-medium text-on-surface-variant">
              No sponsors yet — the first slot is open.
            </p>
          )}
        </section>

        <section className="mt-12">
          <SectionEyebrow>Questions</SectionEyebrow>
          <div className="mt-4 space-y-5">
            <QA question="Does sponsoring unlock features?">
              No. Mimir is MIT-licensed and every feature is free for everyone, sponsor or not.
              Sponsorship funds the work — it doesn&apos;t buy access.
            </QA>
            <QA question="Can I sponsor as a company?">
              Yes. GitHub Sponsors supports paying from an organization account, and invoices come
              from GitHub. Logo placement and a link come with the $149 and $499 tiers, whoever is
              sponsoring.
            </QA>
            <QA question="Can I give a one-off amount instead?">
              Yes. Switch to the One-time tab on GitHub and enter any amount you like — there are no
              fixed one-time tiers, so a one-off contribution always shows up as a custom amount.
            </QA>
            <QA question="How do I get my name or logo listed?">
              Sponsor at $15 or above and your name goes on the sponsor wall; from $49 up — monthly
              or one-time — it goes under Top donors. For logo placement at $149 and above, send me
              the asset and the link you want it to point at{" "}
              <a
                href="https://x.com/emanueledpt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary transition-colors hover:text-primary-dim"
              >
                on X
              </a>
              .
            </QA>
          </div>
        </section>

        <div className="mt-12 flex flex-col gap-4 border-t border-outline-variant pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-body-small text-on-surface-variant">
            Not able to sponsor? Starring the repo and telling someone about Mimir genuinely helps
            too.
          </p>
          <Button variant="outlined" className="w-fit" render={<Link href="/install" />}>
            Download Mimir
            <Icon name="download" data-icon="inline-end" />
          </Button>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

/**
 * One cell of the tier grid. The whole cell is the link rather than holding a
 * button, so six tiers don't stack six competing pills down the page — the loud
 * CTA stays the one in the header. The card surface carries hover/press state.
 */
function TierCell({
  href,
  label,
  price,
  priceSuffix,
  tagline,
  perks,
  action,
  ariaLabel,
  featured,
}: {
  href: string;
  label: string;
  price: string;
  priceSuffix?: string;
  tagline: string;
  perks: readonly string[];
  action: string;
  ariaLabel: string;
  featured?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className="group rounded-lg focus-ring"
    >
      <Card
        variant={featured ? "elevated" : "outlined"}
        interactive
        className="h-full rounded-lg p-6"
      >
        <h3 className="text-title-small text-on-surface">{label}</h3>

        <p className="mt-2.5 flex items-baseline gap-1">
          <span className="font-mono text-[1.25rem] tabular-nums tracking-[-0.02em] text-on-surface">
            {price}
          </span>
          {priceSuffix ? (
            <span className="text-body-small text-on-surface-variant">{priceSuffix}</span>
          ) : null}
        </p>

        <p className="mt-3 text-body-medium text-on-surface-variant">{tagline}</p>

        <PerkList perks={perks} />

        <span className="mt-5 inline-flex items-center gap-1.5 text-label-large text-on-surface">
          {action}
          <Icon
            name="arrow_outward"
            size={16}
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
      </Card>
    </a>
  );
}

function TierCard({ tier }: { tier: SponsorTier }) {
  return (
    <TierCell
      href={monthlyTierCheckoutUrl(tier.amount)}
      label={tier.label}
      price={`$${tier.amount}`}
      priceSuffix="/mo"
      tagline={tier.tagline}
      perks={tier.perks}
      action="Sponsor on GitHub"
      ariaLabel={`Sponsor the ${tier.label} tier at $${tier.amount} a month on GitHub Sponsors`}
      featured={tier.featured}
    />
  );
}

function OneTimeCard() {
  return (
    <TierCell
      href={ONE_TIME_CHECKOUT_URL}
      label={ONE_TIME_SPONSORSHIP.label}
      price="Any amount"
      tagline={ONE_TIME_SPONSORSHIP.tagline}
      perks={ONE_TIME_SPONSORSHIP.perks}
      action="Give once on GitHub"
      ariaLabel="Give a one-time amount on GitHub Sponsors"
    />
  );
}

function PerkList({ perks }: { perks: readonly string[] }) {
  return (
    <ul className="mt-4 flex-1 space-y-2">
      {perks.map((perk) => (
        <li key={perk} className="flex items-start gap-2 text-body-small leading-[1.5]">
          <Icon
            name="check"
            size={14}
            aria-hidden="true"
            className="mt-[3px] shrink-0 text-on-surface-variant"
          />
          <span className="text-on-surface-variant">{perk}</span>
        </li>
      ))}
    </ul>
  );
}

function QA({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-title-small text-on-surface">{question}</h3>
      <p className="mt-1.5 max-w-3xl text-body-medium text-on-surface-variant">{children}</p>
    </div>
  );
}
