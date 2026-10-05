// FILE: Navbar.tsx
// Purpose: M3E top app bar for marketing (scroll-elevated, Mimir theme).
import Image from "next/image";
import Link from "next/link";
import { FaGithub } from "react-icons/fa";
import { formatStars, getStars } from "@/lib/githubStars";
import { GITHUB_REPO_URL } from "@/lib/seo";
import { ThemeToggle } from "@/components/ThemeToggle";
import MobileNav from "@/components/MobileNav";
import { MTopAppBar } from "@/components/m3e/app-bar";
import { MButton } from "@/components/m3e/button";

export default async function Navbar() {
  const stars = await getStars();
  return (
    <MTopAppBar
      aria-label="Primary navigation"
      className="sticky top-0 z-40 px-4 sm:px-6"
      barTitle={
        <Link href="/" aria-label="Mimir home" className="focus-ring inline-flex items-center gap-2 rounded-full text-[15px] font-medium tracking-[-0.01em] outline-none">
          <Image src="/mimir-icon.png" alt="" width={26} height={26} className="rounded-[8px]" />
          <span className="hidden sm:inline">Mimir</span>
        </Link>
      }
      trailing={
        <>
          <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 text-sm sm:flex">
            <Link href="/install" className="state-layer focus-ring rounded-full px-3 py-2 text-[var(--md-sys-color-on-surface-variant)] outline-none">Install</Link>
            <Link href="/docs" className="state-layer focus-ring rounded-full px-3 py-2 text-[var(--md-sys-color-on-surface-variant)] outline-none">Docs</Link>
            <Link href="/changelog" className="state-layer focus-ring rounded-full px-3 py-2 text-[var(--md-sys-color-on-surface-variant)] outline-none">Changelog</Link>
            <Link href="/sponsor" className="state-layer focus-ring hidden rounded-full px-3 py-2 text-[var(--md-sys-color-on-surface-variant)] outline-none lg:inline">Sponsor</Link>
          </div>
          <div className="hidden shrink-0 items-center gap-1 sm:flex">
            <ThemeToggle />
            {stars !== null ? (
              <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" aria-label={`GitHub stars: ${formatStars(stars)}`} className="state-layer focus-ring flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] text-[var(--md-sys-color-on-surface-variant)] outline-none">
                <FaGithub className="size-4" />
                {formatStars(stars)}
              </a>
            ) : null}
            <MButton variant="tonal" size="sm" render={<Link href="/install">Download</Link>} />
          </div>
          <MobileNav />
        </>
      }
    />
  );
}
