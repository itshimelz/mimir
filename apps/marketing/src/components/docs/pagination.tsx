// FILE: components/docs/pagination.tsx
// Purpose: Previous/Next footer for docs pages as compact M3E buttons —
//          replaces fumadocs' default footer cards, which read as large empty
//          surfaces.
// Layer: server component (no client hooks).

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/m3e/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/m3e/symbols";

type PageLink = { name: ReactNode; url: string } | undefined;

export function DocsPagination({ previous, next }: { previous: PageLink; next: PageLink }) {
  if (!previous && !next) return null;

  return (
    <nav className="not-prose flex items-center justify-between gap-3" aria-label="Docs pages">
      {previous ? (
        <Button variant="outlined" size="sm" render={<Link href={previous.url} />}>
          <ChevronLeftIcon className="text-on-surface-variant" />
          {previous.name}
        </Button>
      ) : (
        <span />
      )}
      {next ? (
        <Button variant="outlined" size="sm" render={<Link href={next.url} />}>
          {next.name}
          <ChevronRightIcon className="text-on-surface-variant" />
        </Button>
      ) : null}
    </nav>
  );
}
