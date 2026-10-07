// FILE: SiteFooter.tsx
// Purpose: Shared page footer (credits + attribution + privacy link) used across routes.
// Layer: Presentational component (M3E tokens + buttons)

import Link from "next/link";
import { Button } from "@/components/m3e/button";

const FOOTER_LINKS = [{ href: "/privacy", label: "Privacy" }] as const;

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-outline-variant py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 text-body-small text-on-surface-variant sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-6">
        <span>
          Made by{" "}
          <a
            href="https://github.com/itshimelz"
            target="_blank"
            rel="noopener noreferrer"
            className="state-layer rounded-sm px-0.5 font-medium text-primary transition-colors hover:text-primary-dim focus-ring"
          >
            Himelz Studio
          </a>
        </span>
        <div className="flex flex-wrap items-center gap-1">
          {FOOTER_LINKS.map(({ href, label }) => (
            <Button key={href} variant="ghost" size="xs" render={<Link href={href} />}>
              {label}
            </Button>
          ))}
        </div>
      </div>
    </footer>
  );
}
