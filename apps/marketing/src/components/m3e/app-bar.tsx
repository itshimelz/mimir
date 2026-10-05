// FILE: m3e/app-bar.tsx — M3E Top app bar (scroll-elevated, tonal on scroll).
"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function MTopAppBar({ className, barTitle, leading, trailing, children, ...props }: Omit<React.ComponentProps<"header">, "title"> & { barTitle?: React.ReactNode; leading?: React.ReactNode; trailing?: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header ref={ref} data-slot="app-bar" data-scrolled={scrolled || undefined} className={cn("transition-shape relative flex h-16 w-full items-center gap-1 bg-[var(--md-sys-color-surface)] px-1 text-[var(--md-sys-color-on-surface)] data-scrolled:bg-[var(--md-sys-color-surface-container)] data-scrolled:shadow-[var(--md-sys-elevation-2)]", className)} {...props}>
      {leading ? <div className="flex shrink-0 items-center">{leading}</div> : null}
      {barTitle ? <div className="min-w-0 flex-1 px-3 text-[22px] leading-[1.3] font-normal tracking-normal">{barTitle}</div> : null}
      {children}
      {trailing ? <div className="flex shrink-0 items-center text-[var(--md-sys-color-on-surface-variant)]">{trailing}</div> : null}
    </header>
  );
}
