// FILE: m3e/nav.tsx — M3E Navigation bar / rail primitives (marketing shell).
"use client";
import { cn } from "@/lib/utils";
import { Ripple } from "@/components/m3e/ripple";

export function MNavBar({ className, ...props }: React.ComponentProps<"nav">) {
  return <nav data-slot="nav-bar" className={cn("flex items-center gap-1 rounded-full bg-[var(--md-sys-color-surface-container)] px-2 py-1", className)} {...props} />;
}
export function MNavItem({ className, active, icon, label, ...props }: React.ComponentProps<"a"> & { active?: boolean; icon?: React.ReactNode; label: React.ReactNode }) {
  return (
    <a data-slot="nav-item" data-active={active || undefined} className={cn("state-layer focus-ring transition-shape relative flex items-center gap-2 overflow-hidden rounded-full px-4 py-2 text-sm font-medium outline-none", active ? "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]" : "text-[var(--md-sys-color-on-surface-variant)]", className)} {...props}>
      <Ripple />
      {icon}
      {label}
    </a>
  );
}
