// FILE: Workflow.tsx — M3E expressive workflow section for Mimir.
// Layer: Marketing UI section (M3E cards, badges, chips, type scale — zero images)

import { Badge } from "@/components/m3e/badge";
import { Card } from "@/components/m3e/card";
import { Icon } from "@/components/m3e/icon";

export default function Workflow() {
  return (
    <section id="workflow" className="relative overflow-hidden py-16 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        {/* Section Eyebrow & Headline */}
        <div className="max-w-3xl">
          <Badge
            variant="secondary"
            className="rounded-full px-3.5 py-1 text-label-medium font-medium shadow-xs"
          >
            Co-learning cycle
          </Badge>
          <h2 className="mt-4 text-headline-medium font-heading font-semibold tracking-tight text-on-surface sm:text-headline-large text-balance">
            How students and researchers learn with Mimir
          </h2>
          <p className="mt-4 text-body-large text-on-surface-variant leading-relaxed text-pretty">
            A structured cognitive cycle that turns passive reading into active retrieval, durable
            comprehension, and permanent learning artifacts—all inside your local Course Space.
          </p>
        </div>

        {/* 4-Stage Co-Learning Cycle Grid (Zero Images) */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Stage 1: Course Space Organization */}
          <Card
            variant="elevated"
            size="lg"
            className="flex flex-col justify-between rounded-3xl border border-outline-variant/40 bg-surface-container-low p-6 sm:p-8 shadow-elevation-1"
          >
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex size-8 items-center justify-center rounded-xl bg-primary-container text-on-primary-container font-mono font-semibold text-label-large tabular-nums">
                  01
                </span>
                <Badge variant="outline" className="rounded-full font-mono text-label-small">
                  Course space
                </Badge>
              </div>
              <h3 className="mt-5 text-title-large font-heading font-semibold text-on-surface text-balance">
                Organize materials in a dedicated Course Space
              </h3>
              <p className="mt-2.5 text-body-medium text-on-surface-variant leading-relaxed text-pretty">
                Organize each class into its own isolated Space. Drop in syllabi, lecture slide
                decks, textbook PDFs, and research notes. Everything stays local on your machine
                with zero cloud tracking.
              </p>
            </div>

            {/* M3E Interactive Card Representation (No Images) */}
            <div className="mt-6 rounded-2xl border border-outline-variant/30 bg-surface-container p-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2">
                  <Icon name="home" size={18} className="text-primary" />
                  <span className="text-label-medium font-medium text-on-surface">
                    Space: Biology 101 · Cell Division
                  </span>
                </div>
                <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-label-small text-on-surface-variant font-mono">
                  Local folder
                </span>
              </div>
              <div className="mt-3 space-y-2 text-body-small">
                <div className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2 border border-outline-variant/20">
                  <div className="flex items-center gap-2 text-on-surface">
                    <Icon name="menu_book" size={16} className="text-primary" />
                    <span>lecture-04-mitosis.pdf</span>
                  </div>
                  <span className="text-on-surface-variant text-label-small">
                    Slides · 48 pages
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2 border border-outline-variant/20">
                  <div className="flex items-center gap-2 text-on-surface">
                    <Icon name="menu_book" size={16} className="text-secondary" />
                    <span>syllabus-fall-2026.pdf</span>
                  </div>
                  <span className="text-on-surface-variant text-label-small">
                    Syllabus · 4 units
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2 border border-outline-variant/20">
                  <div className="flex items-center gap-2 text-on-surface">
                    <Icon name="hub" size={16} className="text-tertiary" />
                    <span>outbox/ (Learning Artifacts)</span>
                  </div>
                  <span className="text-primary text-label-small font-medium">
                    8 artifacts generated
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Stage 2: Deep Reading in Study View */}
          <Card
            variant="elevated"
            size="lg"
            className="flex flex-col justify-between rounded-3xl border border-outline-variant/40 bg-surface-container-low p-6 sm:p-8 shadow-elevation-1"
          >
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex size-8 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container font-semibold text-label-large font-mono tabular-nums">
                  02
                </span>
                <Badge variant="outline" className="rounded-full font-mono text-label-small">
                  Study view
                </Badge>
              </div>
              <h3 className="mt-5 text-title-large font-heading font-semibold text-on-surface text-balance">
                Inspect slides & PDFs with in-context notes
              </h3>
              <p className="mt-2.5 text-body-medium text-on-surface-variant leading-relaxed text-pretty">
                Read multi-page lecture decks, textbooks, and papers in Mimir&apos;s integrated
                viewer. Highlight key mechanisms, draft margin reflections, and bookmark tough
                formulas without leaving your reading flow.
              </p>
            </div>

            {/* M3E Interactive Card Representation (No Images) */}
            <div className="mt-6 rounded-2xl border border-outline-variant/30 bg-surface-container p-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2 text-label-medium font-medium text-on-surface">
                  <Icon name="menu_book" size={18} className="text-secondary" />
                  <span>
                    Document reader · <span className="tabular-nums">Page 14 of 48</span>
                  </span>
                </div>
                <span className="rounded-full bg-secondary-container/40 px-2.5 py-0.5 text-label-small text-on-secondary-container">
                  Reading active
                </span>
              </div>
              <div className="mt-3 rounded-xl bg-surface-container-low p-3.5 border border-outline-variant/20 text-body-small">
                <p className="text-on-surface italic leading-relaxed border-l-2 border-primary pl-3 text-pretty">
                  &ldquo;During anaphase, sister chromatids separate at the centromere and are
                  pulled toward opposite spindle poles by kinetochore microtubules.&rdquo;
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant/20">
                  <span className="rounded-full bg-primary-container px-2.5 py-1 text-label-small font-medium text-on-primary-container">
                    💡 Margin note: Cohesin cleavage triggers pull
                  </span>
                  <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-label-small text-on-surface-variant">
                    Added to study deck
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Stage 3: The Agentic Tutor Loop */}
          <Card
            variant="elevated"
            size="lg"
            className="flex flex-col justify-between rounded-3xl border border-outline-variant/40 bg-surface-container-low p-6 sm:p-8 shadow-elevation-1"
          >
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex size-8 items-center justify-center rounded-xl bg-tertiary-container text-on-tertiary-container font-semibold text-label-large font-mono tabular-nums">
                  03
                </span>
                <Badge variant="outline" className="rounded-full font-mono text-label-small">
                  Active retrieval
                </Badge>
              </div>
              <h3 className="mt-5 text-title-large font-heading font-semibold text-on-surface text-balance">
                The tutor prompts retrieval before explaining
              </h3>
              <p className="mt-2.5 text-body-medium text-on-surface-variant leading-relaxed text-pretty">
                Passive rereading creates the illusion of competence. Mimir&apos;s agentic tutor
                asks you to diagnose patterns, explain mechanisms, and test predictions before
                revealing answers. Step-by-step hints arrive only when needed.
              </p>
            </div>

            {/* M3E Interactive Card Representation (No Images) */}
            <div className="mt-6 rounded-2xl border border-outline-variant/30 bg-surface-container p-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2 text-label-medium font-medium text-on-surface">
                  <Icon name="help" size={18} className="text-tertiary" />
                  <span>Mimir tutor rail</span>
                </div>
                <span className="rounded-full bg-tertiary-container/50 px-2.5 py-0.5 text-label-small font-medium text-on-tertiary-container">
                  Guided prompt
                </span>
              </div>
              <div className="mt-3 space-y-2.5 text-body-small">
                <div className="rounded-xl bg-surface-container-low p-3 border border-outline-variant/20">
                  <p className="font-medium text-on-surface text-pretty">
                    &ldquo;What molecular event must occur before sister chromatids can separate
                    during anaphase?&rdquo;
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-label-small text-on-surface-variant">
                      Hint 1: Protein degradation
                    </span>
                    <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-label-small text-on-surface-variant">
                      Hint 2: Cohesin ring
                    </span>
                  </div>
                </div>
                <div className="rounded-xl bg-primary-container/30 p-2.5 border border-primary/20 text-on-surface">
                  <p className="text-label-small text-primary font-medium">Your retrieval:</p>
                  <p className="mt-0.5 text-pretty">
                    &ldquo;Separase cleaves the cohesin complex once APC/C activates.&rdquo;
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-label-small font-semibold text-primary">
                    <Icon name="check" size={14} />
                    <span>Accurate retrieval · Concept consolidated</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Stage 4: Studio Artifact Outbox */}
          <Card
            variant="elevated"
            size="lg"
            className="flex flex-col justify-between rounded-3xl border border-outline-variant/40 bg-surface-container-low p-6 sm:p-8 shadow-elevation-1"
          >
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex size-8 items-center justify-center rounded-xl bg-primary-container text-on-primary-container font-semibold text-label-large font-mono tabular-nums">
                  04
                </span>
                <Badge variant="outline" className="rounded-full font-mono text-label-small">
                  Studio outbox
                </Badge>
              </div>
              <h3 className="mt-5 text-title-large font-heading font-semibold text-on-surface text-balance">
                Generate structured learning artifacts
              </h3>
              <p className="mt-2.5 text-body-medium text-on-surface-variant leading-relaxed text-pretty">
                Work doesn&apos;t vanish into endless chat transcripts. Mimir deposits concrete
                learning artifacts into your course Outbox: practice quizzes, interactive lessons,
                and visual concept maps ready for exam revision.
              </p>
            </div>

            {/* M3E Interactive Card Representation (No Images) */}
            <div className="mt-6 rounded-2xl border border-outline-variant/30 bg-surface-container p-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2 text-label-medium font-medium text-on-surface">
                  <Icon name="hub" size={18} className="text-primary" />
                  <span>Outbox artifacts</span>
                </div>
                <span className="rounded-full bg-primary-container px-2.5 py-0.5 text-label-small font-medium text-on-primary-container">
                  Studio ready
                </span>
              </div>
              <div className="mt-3 space-y-2 text-body-small">
                <div className="flex flex-wrap items-center gap-1.5 pb-1 font-mono">
                  <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-label-small font-medium text-on-surface">
                    Lessons (<span className="tabular-nums">4</span>)
                  </span>
                  <span className="rounded-full bg-secondary-container px-2.5 py-1 text-label-small font-medium text-on-secondary-container">
                    Quizzes (<span className="tabular-nums">12</span>)
                  </span>
                  <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-label-small font-medium text-on-surface">
                    Diagrams (<span className="tabular-nums">3</span>)
                  </span>
                  <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-label-small font-medium text-on-surface">
                    Handouts (<span className="tabular-nums">6</span>)
                  </span>
                </div>
                <div className="rounded-xl bg-surface-container-low p-3 border border-outline-variant/20">
                  <p className="font-medium text-on-surface">
                    Quiz Q3: Which motor protein depolymerizes kinetochore microtubules?
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-label-small">
                    <div className="rounded-lg bg-surface-container px-2 py-1 text-on-surface-variant">
                      A. Myosin II
                    </div>
                    <div className="rounded-lg bg-secondary-container px-2 py-1 font-medium text-on-secondary-container border border-secondary/30">
                      B. Kinesin-13 (Selected) ✓
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
