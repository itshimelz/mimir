// FILE: ChangelogNav.tsx
// Purpose: Sticky left-rail "on this page" menu (md+) for the changelog — lists
//          every release, scroll-spies the one in view, and anchors to it on
//          click (smooth, reduced-motion aware). Keeps the active row visible in
//          the rail as you scroll the page.
// Layer: Client component (M3E segmented items); data is passed in from the server page.

"use client";

import { useEffect, useRef } from "react";
import { type ChangelogNavItem, useActiveAnchor } from "@/lib/useActiveAnchor";
import { Item, ItemContent, ItemGroup } from "@/components/m3e/item";

export type { ChangelogNavItem };

export default function ChangelogNav({ items }: { items: ChangelogNavItem[] }) {
  const { active, jumpTo } = useActiveAnchor(items);
  const navRef = useRef<HTMLElement>(null);

  // Keep the active row scrolled into view within the rail itself.
  useEffect(() => {
    if (!active || !navRef.current) return;
    const link = navRef.current.querySelector(`a[href="#${active}"]`);
    link?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <nav
      ref={navRef}
      aria-label="Releases"
      className="no-scrollbar sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-8"
    >
      <p className="text-label-medium text-on-surface-variant">Releases</p>
      <ItemGroup className="mt-3 gap-0.5">
        {items.map((item) => {
          const isActive = active === item.anchor;
          return (
            <Item
              key={item.anchor}
              variant="segmented"
              size="sm"
              data-selected={isActive ? "" : undefined}
              render={
                <a
                  href={`#${item.anchor}`}
                  onClick={(event) => jumpTo(item.anchor, event)}
                  aria-current={isActive ? "true" : undefined}
                />
              }
            >
              <ItemContent className="flex-row items-baseline justify-between gap-2">
                <span
                  className={
                    isActive ? "text-label-large" : "text-label-large text-on-surface-variant"
                  }
                >
                  {item.version}
                </span>
                <span className="shrink-0 text-body-small text-on-surface-variant">
                  {item.date}
                </span>
              </ItemContent>
            </Item>
          );
        })}
      </ItemGroup>
    </nav>
  );
}
