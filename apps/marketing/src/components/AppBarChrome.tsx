// FILE: AppBarChrome.tsx
// Purpose: M3E top app bar for the marketing chrome (scroll-elevated).
// Layer: Client component (useScrolled); stars arrive from the server Navbar.
"use client";

import Image from "next/image";
import Link from "next/link";
import { FaGithub } from "react-icons/fa";
import { AppBar, useScrolled } from "@/components/m3e/app-bar";
import { Button } from "@/components/m3e/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import MobileNav from "@/components/MobileNav";
import { formatStars } from "@/lib/githubStars";
import { GITHUB_REPO_URL } from "@/lib/seo";

const NAV_LINKS = [
  { href: "/install", label: "Install" },
  { href: "/docs", label: "Docs" },
  { href: "/changelog", label: "Changelog" },
  { href: "/sponsor", label: "Sponsor" },
] as const;

export default function AppBarChrome({ stars }: { stars: number | null }) {
  const scrolled = useScrolled();
  return (
    <AppBar
      aria-label="Primary navigation"
      scrolled={scrolled}
      className="sticky top-0 z-40 px-4 sm:px-6"
      title={
        <Link
          href="/"
          aria-label="Mimir home"
          className="focus-ring inline-flex items-center gap-2 rounded-full outline-none"
        >
          <Image src="/mimir-icon.png" alt="" width={26} height={26} className="rounded-sm" />
          <span className="hidden sm:inline">Mimir</span>
        </Link>
      }
      trailing={
        <>
          <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
            {NAV_LINKS.map(({ href, label }) => (
              <Button
                key={href}
                variant="ghost"
                size="sm"
                render={<Link href={href} />}
                className={label === "Sponsor" ? "hidden lg:inline-flex" : undefined}
              >
                {label}
              </Button>
            ))}
          </nav>
          <div className="hidden items-center gap-1 sm:flex">
            <ThemeToggle />
            {stars !== null ? (
              <Button
                variant="ghost"
                size="sm"
                aria-label={`GitHub stars: ${formatStars(stars)}`}
                render={
                  <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" />
                }
              >
                <FaGithub data-icon="inline-start" />
                {formatStars(stars)}
              </Button>
            ) : null}
            <Button variant="tonal" size="sm" render={<Link href="/install" />}>
              Download
            </Button>
          </div>
          <MobileNav />
        </>
      }
    />
  );
}
