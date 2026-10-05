// FILE: src/app/docs/[[...slug]]/not-found.tsx
// Purpose: Docs-flavored 404 for unknown docs slugs (e.g. /docs/nope).
//          The docs catch-all page calls notFound(); without a segment-level
//          boundary Next serves its `__next_error__` fallback document, whose
//          hydration rewrites the <html> class from the RSC tree. Dark mode is
//          preserved by the root ThemeScript, which re-asserts the stored
//          mimir-theme class after any hydration class rewrite (debounced
//          MutationObserver) — in every document, including the error-fallback
//          shell. This boundary only supplies the docs-chromed 404 UI.
// Layer: App Router segment not-found (server component).

import Link from "next/link";
import { Button } from "@/components/m3e/button";

export default function DocsNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center px-4 py-24">
      <div className="mx-auto w-full max-w-xl text-center">
        <p className="text-label-large text-primary">404</p>
        <h1 className="mt-3 text-headline-medium text-on-surface sm:text-display-small">
          Page not found
        </h1>
        <p className="mt-5 text-body-large text-on-surface-variant">
          The documentation page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button variant="filled" size="md" render={<Link href="/docs" />}>
            Browse the docs
          </Button>
          <Button variant="outlined" size="md" render={<Link href="/" />}>
            Back to home
          </Button>
        </div>
      </div>
    </div>
  );
}
