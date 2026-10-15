// FILE: HomepageRail.tsx
// Purpose: Quiet desktop section navigation for the long marketing page,
//          as an M3E compact navigation rail.
// Layer: Client component

"use client";

import { useEffect, useState } from "react";
import { NavigationRail, NavigationRailItem } from "@/components/m3e/navigation";
import { scrollToAnchor } from "@/lib/scrollToAnchor";

const SECTIONS = [
  { id: "overview", label: "Overview", icon: "home" },
  { id: "providers", label: "Providers", icon: "hub" },
  { id: "workflow", label: "Workflow", icon: "account_tree" },
  { id: "privacy", label: "Privacy", icon: "shield" },
  { id: "faq", label: "FAQ", icon: "help" },
] as const;

export default function HomepageRail() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    const sections = SECTIONS.map(({ id }) => document.getElementById(id)).filter(
      (section): section is HTMLElement => section !== null,
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => {
            const distanceA = Math.abs(a.boundingClientRect.top - window.innerHeight * 0.3);
            const distanceB = Math.abs(b.boundingClientRect.top - window.innerHeight * 0.3);
            return distanceA - distanceB;
          });
        const next = visible[0]?.target.id;
        if (next) setActiveId(next);
      },
      {
        rootMargin: "-18% 0px -62% 0px",
        threshold: [0, 0.15, 0.5],
      },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <NavigationRail
      aria-label="Homepage sections"
      compact
      className="fixed top-1/2 right-0 z-30 hidden h-auto max-h-[75vh] -translate-y-1/2 rounded-l-2xl bg-surface-container pt-3 pb-2 shadow-elevation-2 [@media(min-width:1440px)]:flex"
    >
      {SECTIONS.map(({ id, label, icon }) => (
        <NavigationRailItem
          key={id}
          icon={icon}
          label={label}
          active={activeId === id}
          onClick={(event) => {
            if (scrollToAnchor(id, event)) setActiveId(id);
          }}
          render={<a href={`#${id}`} />}
        />
      ))}
    </NavigationRail>
  );
}
