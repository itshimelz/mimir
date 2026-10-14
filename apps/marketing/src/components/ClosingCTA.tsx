// FILE: ClosingCTA.tsx — M3E expressive closing card.
import { Badge } from "@/components/m3e/badge";
import { Button } from "@/components/m3e/button";
import { Card } from "@/components/m3e/card";
import { Icon } from "@/components/m3e/icon";
import { PRODUCT_CATEGORY, PRODUCT_HERO_TITLE } from "@/data/product";

export default function ClosingCTA({
  initialInstallerCount,
}: {
  initialInstallerCount?: number | null;
} = {}) {
  void initialInstallerCount;
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 text-center sm:px-6">
        <Card
          variant="elevated"
          size="lg"
          className="items-center rounded-3xl bg-primary-container p-10 text-center sm:p-16 border border-outline-variant/30 shadow-elevation-1"
        >
          <Badge
            variant="secondary"
            className="rounded-full px-4 py-1 text-label-medium font-medium shadow-xs"
          >
            Mimir co-learner workspace
          </Badge>
          <p className="mt-6 text-on-primary-container/80 tracking-wider uppercase font-mono text-label-small">
            {PRODUCT_CATEGORY}
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-display-small text-on-primary-container font-heading font-semibold sm:text-display-medium text-balance">
            {PRODUCT_HERO_TITLE}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-body-large text-on-primary-container leading-relaxed text-pretty">
            Turn lecture notes, textbooks, and syllabus files into an interactive learning
            environment. Inspect coursework in Study mode, review interactive lessons and quizzes in
            Studio mode, and build lasting knowledge with an AI co-learner.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3">
            <Button
              variant="filled"
              size="lg"
              className="rounded-full shadow-elevation-1"
              render={<a href="#overview" />}
            >
              Return to overview
              <Icon name="arrow_forward" data-icon="inline-end" />
            </Button>
            <p className="text-body-small text-on-primary-container/80 text-pretty">
              Local-first cognitive architecture · Engineered for university rigor
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}
