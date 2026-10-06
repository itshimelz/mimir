// FILE: lib/docsLayout.tsx
// Purpose: Shared Fumadocs layout options styled after the site chrome —
//          same M3E wordmark, compact nav links, Download CTA, and top-chrome theme toggle.
// Layer: docs layout configuration (server-importable).

import Image from "next/image";
import Link from "next/link";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/m3e/button";

export function docsLayoutOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="flex items-center gap-2 text-title-small text-on-surface">
          <Image
            src="/mimir-icon.png"
            alt=""
            width={22}
            height={22}
            className="rounded-xs border border-outline-variant"
          />
          Mimir
          <span className="rounded-full border border-outline-variant px-2 py-px text-label-medium text-on-surface-variant">
            Docs
          </span>
        </span>
      ),
      url: "/",
      transparentMode: "none",
      children: (
        <div className="ms-auto flex items-center justify-end">
          <ThemeToggle />
        </div>
      ),
    },
    links: [
      { text: "Install", url: "/install" },
      { text: "Changelog", url: "/changelog" },
      {
        type: "custom",
        children: (
          <Button
            variant="outlined"
            size="sm"
            className="mx-2 mt-1"
            render={<Link href="/install" />}
          >
            Download
          </Button>
        ),
      },
    ],
    themeSwitch: { enabled: false },
  };
}
