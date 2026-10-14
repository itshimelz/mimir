// FILE: SiteFooter.tsx
// Purpose: Shared page footer (branding, learning architecture, academic research links, trust status, and privacy) used across routes.
// Layer: Presentational component (M3E tokens + buttons)
"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/m3e/button";
import { Icon } from "@/components/m3e/icon";
import { Separator } from "@/components/m3e/separator";
import { GITHUB_REPO_URL } from "@/lib/seo";

const ARCHITECTURE_LINKS = [
  { href: "/#overview", label: "Course Spaces" },
  { href: "/#overview", label: "Study & Studio Views" },
  { href: "/#workflow", label: "Active Retrieval Loop" },
  { href: "/#providers", label: "Runtime Topology" },
  { href: "/#faq", label: "Knowledge Outbox" },
] as const;

const ACADEMIC_LINKS = [
  { href: "/#overview", label: "Cognitive Retention Thesis" },
  { href: "/#privacy", label: "Zero Institutional Liability" },
  { href: "/privacy", label: "Student Data Privacy" },
  { href: "/#faq", label: "Socratic Scaffolding FAQ" },
] as const;

const ECOSYSTEM_LINKS = [
  {
    href: GITHUB_REPO_URL,
    label: "Source Code",
    external: true,
  },
  {
    href: "/llms.txt",
    label: "llms.txt (Agent Context)",
    external: true,
  },
  {
    href: "/llms-full.txt",
    label: "llms-full.txt (Full Corpus)",
    external: true,
  },
  {
    href: "https://opensource.org/licenses/MIT",
    label: "MIT License",
    external: true,
  },
] as const;

export default function SiteFooter() {
  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  return (
    <footer className="mt-auto border-t border-outline-variant/40 bg-surface-container-lowest/70 backdrop-blur-md">
      <div className="mx-auto w-full max-w-6xl px-4 pt-12 pb-8 sm:px-6 sm:pt-16 sm:pb-12">
        {/* Main Navigation Grid */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand & Purpose Column */}
          <div className="flex flex-col justify-between lg:col-span-5">
            <div>
              <Link
                href="/"
                className="focus-ring inline-flex items-center gap-2.5 rounded-full outline-none"
                aria-label="Mimir home"
              >
                <Image
                  src="/mimir-logo.png"
                  alt="Mimir logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                />
                <span className="font-heading text-title-medium font-semibold tracking-tight text-on-surface">
                  Mimir
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-label-small font-mono font-medium text-primary">
                  Local-First
                </span>
              </Link>

              <p className="mt-4 max-w-sm text-body-small leading-relaxed text-on-surface-variant text-pretty">
                The desktop-first agentic co-learner engineered for university rigor. Inverts
                passive text generation into active cognitive retrieval, keeping course materials
                and research 100% on local hardware.
              </p>

              {/* Local Engine Trust Indicator */}
              <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 text-label-small text-on-surface-variant">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                <span className="font-mono font-medium text-on-surface tabular-nums">
                  100% Local Isolation
                </span>
                <span className="text-outline-variant">·</span>
                <span>Zero Telemetry</span>
              </div>
            </div>

            <p className="mt-6 text-body-small text-on-surface-variant/80">
              Crafted with care by{" "}
              <a
                href="https://github.com/itshimelz"
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring rounded-xs font-medium text-primary transition-colors hover:text-primary-dim"
              >
                Himelz Studio
              </a>
            </p>
          </div>

          {/* Navigation Columns */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 lg:col-span-7">
            {/* Architecture */}
            <div className="flex flex-col gap-3">
              <h3 className="text-label-small font-mono font-semibold uppercase tracking-wider text-on-surface">
                Architecture
              </h3>
              <ul className="flex flex-col gap-2.5">
                {ARCHITECTURE_LINKS.map(({ href, label }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="focus-ring inline-block rounded-xs text-body-small text-on-surface-variant transition-colors hover:text-on-surface"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Research & Trust */}
            <div className="flex flex-col gap-3">
              <h3 className="text-label-small font-mono font-semibold uppercase tracking-wider text-on-surface">
                Research & Trust
              </h3>
              <ul className="flex flex-col gap-2.5">
                {ACADEMIC_LINKS.map(({ href, label }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="focus-ring inline-block rounded-xs text-body-small text-on-surface-variant transition-colors hover:text-on-surface"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ecosystem & Context */}
            <div className="flex flex-col gap-3">
              <h3 className="text-label-small font-mono font-semibold uppercase tracking-wider text-on-surface">
                Ecosystem
              </h3>
              <ul className="flex flex-col gap-2.5">
                {ECOSYSTEM_LINKS.map(({ href, label, external }) => (
                  <li key={label}>
                    <a
                      href={href}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="group focus-ring inline-flex items-center gap-1 rounded-xs text-body-small text-on-surface-variant transition-colors hover:text-on-surface"
                    >
                      <span>{label}</span>
                      <Icon
                        name="arrow_outward"
                        size={14}
                        className="text-on-surface-variant/60 transition-colors group-hover:text-on-surface"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <Separator className="mt-12 mb-6 opacity-30" />

        {/* Bottom Metadata Bar */}
        <div className="flex flex-col gap-4 text-label-small text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              © <span className="tabular-nums">{new Date().getFullYear()}</span> Mimir · Himelz
              Studio. MIT Licensed.
            </span>
            <span className="hidden text-outline-variant sm:inline">·</span>
            <span>Engineered for University Rigor</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="xs" render={<Link href="/privacy" />}>
              Privacy Policy
            </Button>
            <Button
              variant="outlined"
              size="xs"
              onClick={handleScrollToTop}
              className="gap-1 border-outline-variant/50 text-on-surface-variant hover:text-on-surface"
            >
              Back to top
              <Icon name="keyboard_arrow_up" size={16} data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
