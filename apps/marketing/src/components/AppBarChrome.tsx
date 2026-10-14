// FILE: AppBarChrome.tsx
// Purpose: M3E top app bar for the marketing chrome (scroll-elevated).
// Layer: Client component (useScrolled); stars arrive from the server Navbar.
"use client";

import Image from "next/image";
import Link from "next/link";
import { AppBar, useScrolled } from "@/components/m3e/app-bar";
import { Button } from "@/components/m3e/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import MobileNav from "@/components/MobileNav";

const NAV_LINKS = [
  { href: "/#overview", label: "Overview" },
  { href: "/#workflow", label: "Workflow" },
  { href: "/#faq", label: "FAQ" },
] as const;

export default function AppBarChrome({ stars }: { stars?: number | null } = {}) {
  void stars;
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
          className="focus-ring inline-flex items-center gap-2.5 rounded-full outline-none"
        >
          <Image
            src="/mimir-logo.png"
            alt="Mimir"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
            priority
          />
          <span className="font-heading font-medium tracking-tight">Mimir</span>
        </Link>
      }
      trailing={
        <>
          <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
            {NAV_LINKS.map(({ href, label }) => (
              <Button key={href} variant="ghost" size="sm" render={<Link href={href} />}>
                {label}
              </Button>
            ))}
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
          </div>
          <MobileNav />
        </>
      }
    />
  );
}
