// FILE: page.tsx
// Purpose: Public marketing homepage for Mimir (M3E expressive).
// Layer: App Router page (server component)

import Image from "next/image";
import Navbar from "@/components/Navbar";
import Features from "@/components/Features";
import Workflow from "@/components/Workflow";
import FAQ from "@/components/FAQ";
import AskAISection from "@/components/AskAISection";
import ClosingCTA from "@/components/ClosingCTA";
import SiteFooter from "@/components/SiteFooter";
import PrivacySection from "@/components/PrivacySection";
import HomepageRail from "@/components/HomepageRail";
import { Badge } from "@/components/m3e/badge";
import { Button } from "@/components/m3e/button";
import { Card } from "@/components/m3e/card";
import { Icon } from "@/components/m3e/icon";
import { PRODUCT_HERO_DESCRIPTION, PRODUCT_HERO_TITLE, PRODUCT_PILLARS } from "@/data/product";
import { FAQ_JSONLD, jsonLdScript } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function Home() {
  return (
    <div className="min-h-screen overflow-x-clip bg-surface text-on-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(FAQ_JSONLD) }}
      />
      <Navbar />
      <main>
        {/* =========================================================================
         * HERO SECTION: M3E Expressive Hero for Mimir
         * Desktop-first agentic co-learner for university students.
         * ========================================================================= */}
        <section
          id="overview"
          aria-labelledby="homepage-title"
          className="hero-section scroll-mt-20 pt-8 pb-12 sm:pt-14 sm:pb-20"
        >
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <Card
              variant="elevated"
              size="lg"
              className="relative overflow-hidden rounded-3xl border border-outline-variant/40 bg-surface-container-low p-6 sm:p-10 lg:p-12 shadow-elevation-1"
            >
              {/* Expressive eyebrow chips */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="gap-2 rounded-full px-3.5 py-1 text-label-medium font-medium shadow-xs"
                >
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                  </span>
                  Mimir · Agentic co-learner
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full px-3 py-1 font-mono text-label-small border-outline-variant/70 text-on-surface-variant"
                >
                  Material 3 Expressive
                </Badge>
                <Badge variant="tertiary" className="rounded-full px-3 py-1 text-label-small">
                  Himelz Studio preview
                </Badge>
              </div>

              {/* Main Headline */}
              <h1
                id="homepage-title"
                className="mt-6 max-w-3xl text-display-small font-heading font-semibold tracking-tight text-on-surface sm:text-display-medium lg:text-display-large"
              >
                {PRODUCT_HERO_TITLE}
              </h1>

              {/* Hero Subtitle */}
              <p
                data-live-hero-color="true"
                className="mt-5 max-w-2xl text-body-large text-on-surface-variant leading-relaxed"
              >
                {PRODUCT_HERO_DESCRIPTION}
              </p>

              {/* Action block (download and github hidden as Mimir is in pre-release) */}
              <div className="mt-8 flex flex-wrap items-center gap-3" data-home-actions>
                <Button
                  variant="filled"
                  size="md"
                  render={<a href="#workflow" />}
                  className="rounded-full shadow-elevation-1"
                >
                  Explore Co-Learning Loop
                  <Icon name="arrow_forward" data-icon="inline-end" />
                </Button>
                <Button
                  variant="tonal"
                  size="md"
                  render={<a href="#providers" />}
                  className="rounded-full"
                >
                  Workspace Architecture
                  <Icon name="account_tree" data-icon="inline-end" />
                </Button>
                <div className="flex items-center gap-2 rounded-full bg-surface-container px-3.5 py-1.5 text-label-medium text-on-surface-variant border border-outline-variant/40">
                  <span className="size-2 rounded-full bg-tertiary" />
                  <span>In development · Himelz Studio</span>
                </div>
              </div>

              {/* M3E Architecture Pillars Strip */}
              <div className="mt-10 grid grid-cols-1 gap-3 pt-6 border-t border-outline-variant/30 sm:grid-cols-2 lg:grid-cols-4">
                {PRODUCT_PILLARS.map((pillar, i) => {
                  const icons = ["home", "hub", "help", "history"] as const;
                  const colors = [
                    "text-primary",
                    "text-secondary",
                    "text-tertiary",
                    "text-primary",
                  ] as const;
                  return (
                    <div
                      key={pillar.title}
                      className="flex flex-col gap-1 rounded-2xl bg-surface-container/60 p-3.5 border border-outline-variant/20"
                    >
                      <div
                        className={`flex items-center gap-1.5 text-label-small font-medium ${colors[i % colors.length]}`}
                      >
                        <Icon name={icons[i % icons.length]} size={16} />
                        <span>{pillar.title}</span>
                      </div>
                      <p className="text-body-small text-on-surface-variant line-clamp-2">
                        {pillar.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Prominent Mimir Workspace Concept Preview */}
            <div className="relative mt-8 sm:mt-10" data-hero-preview>
              <Card
                variant="elevated"
                size="lg"
                className="overflow-hidden rounded-2xl sm:rounded-3xl border border-outline-variant/60 bg-surface-container p-0 shadow-elevation-2"
              >
                {/* Simulated M3E Expressive App Bar & Window Chrome */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/40 bg-surface-container-high px-4 py-3 sm:px-6">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-error/70" />
                      <span className="size-2.5 rounded-full bg-secondary-container" />
                      <span className="size-2.5 rounded-full bg-primary/40" />
                    </div>
                    <div className="ml-3 hidden sm:flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-1 text-label-small font-medium text-on-surface-variant border border-outline-variant/40">
                      <Icon name="menu_book" size={14} className="text-primary" />
                      <span>Space: Cell Division · Biology 101</span>
                    </div>
                  </div>

                  {/* Signature Study / Studio Switcher from Mimir Architecture */}
                  <div className="flex items-center rounded-full bg-surface-container-low p-1 border border-outline-variant/40 shadow-xs">
                    <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-label-small text-on-surface-variant">
                      <Icon name="menu_book" size={14} />
                      <span>Study</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-secondary-container px-3.5 py-1 text-label-small font-medium text-on-secondary-container shadow-elevation-1">
                      <Icon name="hub" size={14} />
                      <span>Studio</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="hidden sm:inline-flex rounded-full text-label-small border-outline-variant/60 font-mono"
                    >
                      Mimir v0.9
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="gap-1.5 rounded-full px-2.5 py-0.5 text-label-small"
                    >
                      <span className="size-1.5 rounded-full bg-primary" />
                      Co-learner rail
                    </Badge>
                  </div>
                </div>

                {/* Workspace Screenshot */}
                <div className="relative aspect-[1586/992] w-full bg-surface-container-lowest overflow-hidden">
                  <Image
                    src="/mimir-learning-workspace-concept.png"
                    alt="Mimir Desktop Agentic Learning Workspace showing integrated Study files, Outbox visual Studio artifacts, and persistent AI tutor rail"
                    width={1586}
                    height={992}
                    priority
                    className="w-full h-auto object-cover"
                  />
                </div>

                {/* Three-part Learning Surface Breakdown Bar */}
                <div className="grid grid-cols-1 divide-y divide-outline-variant/30 border-t border-outline-variant/40 bg-surface-container-low sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  <div className="flex items-start gap-3 p-4 sm:p-5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container font-semibold text-label-medium">
                      1
                    </span>
                    <div>
                      <p className="text-title-small font-medium text-on-surface">
                        Integrated Study rail
                      </p>
                      <p className="mt-0.5 text-body-small text-on-surface-variant">
                        Lecture slides, PDFs, notes, and datasets live inside your local course
                        space.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 sm:p-5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container font-semibold text-label-medium">
                      2
                    </span>
                    <div>
                      <p className="text-title-small font-medium text-on-surface">
                        Studio artifact canvas
                      </p>
                      <p className="mt-0.5 text-body-small text-on-surface-variant">
                        Review interactive lessons, active retrieval quizzes, and concept maps in
                        Outbox.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 sm:p-5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-tertiary-container text-on-tertiary-container font-semibold text-label-medium">
                      3
                    </span>
                    <div>
                      <p className="text-title-small font-medium text-on-surface">Agentic tutor</p>
                      <p className="mt-0.5 text-body-small text-on-surface-variant">
                        Asks guiding questions before explaining, prompting deep cognitive
                        retrieval.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <div id="providers" className="scroll-mt-20">
          <Features />
        </div>
        <div id="workflow" className="scroll-mt-20">
          <Workflow />
        </div>
        <div id="privacy" className="scroll-mt-20">
          <PrivacySection />
        </div>
        <AskAISection />
        <FAQ />
        <div id="cta" className="scroll-mt-20">
          <ClosingCTA />
        </div>
      </main>
      <SiteFooter />
      <HomepageRail />
    </div>
  );
}
