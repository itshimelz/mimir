// FILE: MultiProjectShowcase.tsx
// Purpose: Shows persistent Course Space organization across university classes.
// Layer: Marketing UI section (M3E cards, badges, icons, type scale)

import { Badge } from "@/components/m3e/badge";
import { Card } from "@/components/m3e/card";
import { Icon } from "@/components/m3e/icon";

const sectionHeading =
  "text-headline-small text-on-surface sm:text-headline-medium font-heading font-semibold";
const sectionBody =
  "mt-3 max-w-xl text-body-medium text-on-surface-variant sm:mt-4 sm:text-body-large leading-relaxed";
const container = "mx-auto w-full max-w-6xl px-4 sm:px-6";

export function MultiProjectShowcase() {
  return (
    <section className="py-12 sm:py-20 border-t border-outline-variant/30">
      <div className={container}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center lg:gap-10 xl:gap-14">
          <div className="min-w-0">
            <Badge
              variant="secondary"
              className="rounded-full px-3.5 py-1 text-label-medium font-medium shadow-xs"
            >
              Course Spaces
            </Badge>
            <h2 className={`${sectionHeading} mt-4`}>Keep every course space ready to resume.</h2>
            <p className={sectionBody}>
              Move between midterm preparation, seminar reading decks, and problem sets without
              rebuilding context from scattered windows. Each Course Space isolates its own
              syllabus, lecture slides, agent retrieval sessions, and generated studio artifacts.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-label-small font-medium text-on-surface-variant">
              <span className="flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 border border-outline-variant/40">
                <Icon name="check" size={14} className="text-primary" />
                Local folder isolation
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 border border-outline-variant/40">
                <Icon name="check" size={14} className="text-secondary" />
                Zero cross-course context bleed
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 border border-outline-variant/40">
                <Icon name="check" size={14} className="text-tertiary" />
                Persistent session scratchpad
              </span>
            </div>
          </div>

          <div className="relative min-w-0">
            <Card
              variant="elevated"
              className="rounded-3xl border border-outline-variant/40 bg-surface-container-low p-5 sm:p-6 shadow-elevation-1"
            >
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                <div className="flex items-center gap-2">
                  <Icon name="home" size={18} className="text-primary" />
                  <span className="text-title-small font-medium text-on-surface">
                    Course spaces
                  </span>
                </div>
                <Badge variant="outline" className="font-mono text-label-small">
                  3 enrolled spaces
                </Badge>
              </div>

              <div className="mt-4 space-y-3">
                {/* Active Course Space 1 */}
                <div className="rounded-2xl border-2 border-primary/50 bg-surface-container p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-primary" />
                      <span className="text-label-medium font-semibold text-on-surface">
                        Biology 101 · Molecular Genetics
                      </span>
                    </div>
                    <span className="rounded-full bg-primary-container px-2 py-0.5 text-label-small font-medium text-on-primary-container">
                      Active space
                    </span>
                  </div>
                  <p className="mt-1 text-body-small text-on-surface-variant">
                    4 lecture slide decks · 14 outbox artifacts · 1 active retrieval task
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-label-small text-on-surface-variant">
                      📄 lecture-08-crispr.pdf
                    </span>
                    <span className="rounded-full bg-secondary-container/60 px-2.5 py-0.5 text-label-small font-medium text-on-secondary-container">
                      🧩 Mitosis vs Meiosis Quiz
                    </span>
                  </div>
                </div>

                {/* Course Space 2 */}
                <div className="rounded-2xl border border-outline-variant/30 bg-surface-container/60 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-secondary" />
                      <span className="text-label-medium font-medium text-on-surface">
                        CS 224 · Algorithms & Complexity
                      </span>
                    </div>
                    <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-label-small text-on-surface-variant">
                      Saved state
                    </span>
                  </div>
                  <p className="mt-1 text-body-small text-on-surface-variant">
                    Dynamic programming & graph traversal · 8 practice artifacts
                  </p>
                </div>

                {/* Course Space 3 */}
                <div className="rounded-2xl border border-outline-variant/30 bg-surface-container/60 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-tertiary" />
                      <span className="text-label-medium font-medium text-on-surface">
                        Chem 102 · Reaction Mechanisms
                      </span>
                    </div>
                    <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-label-small text-on-surface-variant">
                      Ready to resume
                    </span>
                  </div>
                  <p className="mt-1 text-body-small text-on-surface-variant">
                    Kinetics & equilibrium · 6 visual reaction maps
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
