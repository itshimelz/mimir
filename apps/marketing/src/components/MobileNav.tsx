"use client";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MIconButton } from "@/components/m3e/icon-button";
import { MButton } from "@/components/m3e/button";
import { MIcon } from "@/components/m3e/icon";

const links = [
  { href: "/install", label: "Install" },
  { href: "/docs", label: "Docs" },
  { href: "/changelog", label: "Changelog" },
] as const;

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);
  return (
    <div className="relative flex items-center gap-1 sm:hidden">
      <ThemeToggle />
      <MButton variant="tonal" size="xs" render={<Link href="/install">Download</Link>} />
      <MIconButton type="button" aria-expanded={open} aria-controls={menuId} aria-label={open ? "Close navigation" : "Open navigation"} onClick={() => setOpen((c) => !c)}>
        <MIcon name={open ? "close" : "menu"} size={20} />
      </MIconButton>
      <div id={menuId} inert={!open} className={`absolute top-11 right-0 z-50 w-[min(17rem,calc(100vw-2rem))] origin-top-right rounded-[16px] border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-2 shadow-[var(--md-sys-elevation-3)] transition-[opacity,transform,visibility] duration-200 motion-reduce:transition-none ${open ? "visible translate-y-0 scale-100 opacity-100" : "invisible -translate-y-1 scale-95 opacity-0"}`}>
        <nav aria-label="Mobile navigation" className="grid gap-1">
          <a href="https://x.com/trymimir" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="state-layer focus-ring rounded-[12px] px-3 py-2.5 text-[13px] text-[var(--md-sys-color-on-surface-variant)] outline-none">X</a>
          {links.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className="state-layer focus-ring rounded-[12px] px-3 py-2.5 text-[13px] text-[var(--md-sys-color-on-surface-variant)] outline-none">{label}</Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
