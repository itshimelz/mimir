// FILE: page.tsx
// Purpose: Public marketing homepage for Mimir (M3E expressive).
// Layer: App Router page (server component)

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
              {/* Main Headline */}
              <h1
                id="homepage-title"
                className="max-w-3xl text-display-small font-heading font-semibold tracking-tight text-on-surface sm:text-display-medium lg:text-display-large"
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
            </Card>

            {/* Authentic M3E Workspace Architecture & Co-Learning Showcase */}
            <div className="relative mt-6 sm:mt-8" data-hero-preview>
              <Card
                variant="elevated"
                size="lg"
                className="overflow-hidden rounded-3xl border border-outline-variant/50 bg-surface-container-low p-0 shadow-elevation-2"
              >
                {/* Surface Bar / Architectural Banner */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/40 bg-surface-container px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-primary-container text-on-primary-container shadow-xs">
                      <Icon name="hub" size={18} />
                    </span>
                    <div>
                      <h2 className="text-title-small font-heading font-semibold text-on-surface">
                        Mimir Workspace Topology
                      </h2>
                      <p className="text-label-small text-on-surface-variant">
                        Desktop-first cognitive architecture · Local isolation · Agentic runtime
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 text-label-small font-medium text-on-surface-variant border border-outline-variant/30">
                      <Icon name="hard_drive" size={14} className="text-primary" />
                      Local-first storage
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 text-label-small font-medium text-on-surface-variant border border-outline-variant/30">
                      <Icon name="shield" size={14} className="text-secondary" />
                      Zero cloud telemetry
                    </span>
                  </div>
                </div>

                {/* M3E Architecture Pillars Strip */}
                <div className="grid grid-cols-1 gap-3 p-4 sm:p-6 border-b border-outline-variant/30 sm:grid-cols-2 lg:grid-cols-4 bg-surface-container/20">
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
                        className="flex flex-col gap-1 rounded-2xl bg-surface-container/60 p-3.5 border border-outline-variant/20 hover:border-outline-variant/40 hover:bg-surface-container transition-all"
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

                {/* 3-Column Expressive Architecture Surfaces */}
                <div className="grid grid-cols-1 divide-y divide-outline-variant/30 lg:grid-cols-3 lg:divide-x lg:divide-y-0 bg-surface-container-lowest">
                  {/* Surface 1: Dedicated Course Space */}
                  <div className="flex flex-col justify-between p-6 sm:p-7">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-label-small font-mono font-medium text-primary uppercase tracking-wider">
                          Layer 01 · Local Files
                        </span>
                        <Badge
                          variant="secondary"
                          className="rounded-full px-2.5 py-0.5 font-mono text-label-small"
                        >
                          Space
                        </Badge>
                      </div>
                      <h3 className="mt-3 text-title-medium font-heading font-semibold text-on-surface">
                        Dedicated Course Space
                      </h3>
                      <p className="mt-2 text-body-small text-on-surface-variant leading-relaxed">
                        Each university course lives in its own dedicated course folder. Store
                        lecture slides, syllabi, textbook PDFs, and lab assignments together without
                        cross-course context bleed.
                      </p>

                      <div className="mt-5 space-y-2 rounded-2xl bg-surface-container p-3 border border-outline-variant/30">
                        <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-3 py-2 text-body-small">
                          <span className="flex items-center gap-2 text-on-surface font-medium">
                            <Icon name="menu_book" size={16} className="text-primary" />
                            course-syllabus.pdf
                          </span>
                          <span className="text-label-small text-on-surface-variant">Syllabus</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-3 py-2 text-body-small">
                          <span className="flex items-center gap-2 text-on-surface font-medium">
                            <Icon name="menu_book" size={16} className="text-secondary" />
                            lecture-slides-w4.pdf
                          </span>
                          <span className="text-label-small text-on-surface-variant">42 pages</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-3 py-2 text-body-small">
                          <span className="flex items-center gap-2 text-on-surface font-medium">
                            <Icon name="hub" size={16} className="text-tertiary" />
                            outbox/artifacts/
                          </span>
                          <span className="text-label-small font-medium text-primary">
                            Local artifacts
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center gap-2 text-label-small text-on-surface-variant pt-4 border-t border-outline-variant/20">
                      <Icon name="check" size={16} className="text-primary" />
                      <span>Zero sync requirement · Works fully offline</span>
                    </div>
                  </div>

                  {/* Surface 2: Dual Study & Studio Views */}
                  <div className="flex flex-col justify-between p-6 sm:p-7">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-label-small font-mono font-medium text-secondary uppercase tracking-wider">
                          Layer 02 · Dual Engine
                        </span>
                        <Badge
                          variant="outline"
                          className="rounded-full px-2.5 py-0.5 font-mono text-label-small"
                        >
                          Views
                        </Badge>
                      </div>
                      <h3 className="mt-3 text-title-medium font-heading font-semibold text-on-surface">
                        Study &amp; Studio Views
                      </h3>
                      <p className="mt-2 text-body-small text-on-surface-variant leading-relaxed">
                        Seamlessly switch between reading source materials in Study and exploring
                        synthesized lessons, concept graphs, and active practice sets in Studio.
                      </p>

                      <div className="mt-5 space-y-2 rounded-2xl bg-surface-container p-3 border border-outline-variant/30">
                        <div className="flex items-center gap-2 rounded-xl bg-secondary-container/40 px-3 py-2 text-body-small text-on-secondary-container font-medium border border-secondary/20">
                          <Icon name="menu_book" size={16} className="text-secondary" />
                          <span>Study View: Reader &amp; notes</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-tertiary-container/40 px-3 py-2 text-body-small text-on-tertiary-container font-medium border border-tertiary/20">
                          <Icon name="hub" size={16} className="text-tertiary" />
                          <span>Studio View: Active quizzes &amp; maps</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-3 py-2 text-body-small text-on-surface-variant">
                          <span className="flex items-center gap-1.5">
                            <Icon name="history" size={14} />
                            Revision timeline
                          </span>
                          <span className="text-label-small font-mono">Auto-saved</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center gap-2 text-label-small text-on-surface-variant pt-4 border-t border-outline-variant/20">
                      <Icon name="check" size={16} className="text-secondary" />
                      <span>Split-pane or full canvas view</span>
                    </div>
                  </div>

                  {/* Surface 3: Cognitive Scaffolding & Agent Loop */}
                  <div className="flex flex-col justify-between p-6 sm:p-7">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-label-small font-mono font-medium text-tertiary uppercase tracking-wider">
                          Layer 03 · Agent Loop
                        </span>
                        <Badge
                          variant="tertiary"
                          className="rounded-full px-2.5 py-0.5 font-mono text-label-small"
                        >
                          Tutor
                        </Badge>
                      </div>
                      <h3 className="mt-3 text-title-medium font-heading font-semibold text-on-surface">
                        Active Retrieval Tutor
                      </h3>
                      <p className="mt-2 text-body-small text-on-surface-variant leading-relaxed">
                        Rather than summarizing text passively, Mimir prompts diagnostic questions,
                        offers calibrated hints, and verifies your reasoning before explanations.
                      </p>

                      <div className="mt-5 space-y-2 rounded-2xl bg-surface-container p-3 border border-outline-variant/30">
                        <div className="rounded-xl bg-surface-container-low p-2.5 text-body-small">
                          <div className="flex items-center gap-1.5 text-label-small font-medium text-primary">
                            <Icon name="lightbulb" size={14} />
                            Guiding Question
                          </div>
                          <p className="mt-1 text-on-surface text-body-small">
                            &ldquo;What happens to daughter cells if spindle fibers fail in
                            metaphase?&rdquo;
                          </p>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-3 py-2 text-label-small text-on-surface-variant">
                          <span className="flex items-center gap-1.5">
                            <Icon name="help" size={14} className="text-tertiary" />
                            Step-by-step hint scaffolding
                          </span>
                          <span className="text-primary font-medium">3 hints</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center gap-2 text-label-small text-on-surface-variant pt-4 border-t border-outline-variant/20">
                      <Icon name="check" size={16} className="text-tertiary" />
                      <span>Compatible with local Claude, Codex &amp; Antigravity</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Architectural Guarantee Strip */}
                <div className="grid grid-cols-2 divide-y divide-outline-variant/20 border-t border-outline-variant/30 bg-surface-container-low sm:grid-cols-4 sm:divide-x sm:divide-y-0">
                  <div className="p-4 sm:p-5">
                    <p className="text-label-small font-mono uppercase text-on-surface-variant">
                      Engine
                    </p>
                    <p className="mt-1 text-title-small font-semibold text-on-surface">
                      Local Desktop
                    </p>
                    <p className="mt-0.5 text-body-small text-on-surface-variant">
                      Fast, native execution
                    </p>
                  </div>
                  <div className="p-4 sm:p-5">
                    <p className="text-label-small font-mono uppercase text-on-surface-variant">
                      Runtime
                    </p>
                    <p className="mt-1 text-title-small font-semibold text-on-surface">
                      Multi-Provider
                    </p>
                    <p className="mt-0.5 text-body-small text-on-surface-variant">
                      Your configured CLIs
                    </p>
                  </div>
                  <div className="p-4 sm:p-5">
                    <p className="text-label-small font-mono uppercase text-on-surface-variant">
                      Method
                    </p>
                    <p className="mt-1 text-title-small font-semibold text-on-surface">
                      Active Retrieval
                    </p>
                    <p className="mt-0.5 text-body-small text-on-surface-variant">
                      Long-term retention
                    </p>
                  </div>
                  <div className="p-4 sm:p-5">
                    <p className="text-label-small font-mono uppercase text-on-surface-variant">
                      Privacy
                    </p>
                    <p className="mt-1 text-title-small font-semibold text-on-surface">
                      100% Private
                    </p>
                    <p className="mt-0.5 text-body-small text-on-surface-variant">
                      Zero cloud telemetry
                    </p>
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
