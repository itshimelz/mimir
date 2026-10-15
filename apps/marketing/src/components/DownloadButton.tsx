// FILE: DownloadButton.tsx — OS-aware hero CTA as an M3E filled button.
"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/m3e/button";
import { Icon } from "@/components/m3e/icon";
import { detectOS, type OS } from "@/lib/platform";

const LABEL: Record<OS, string> = {
  mac: "Download for macOS",
  windows: "Download for Windows",
  linux: "Download for Linux",
  unknown: "Download Mimir",
};
type NavigatorWithUserAgentData = Navigator & { userAgentData?: { platform?: string } };

export default function DownloadButton({ className = "" }: { className?: string }) {
  const label = useSyncExternalStore(
    () => () => undefined,
    () => {
      const nav = navigator as NavigatorWithUserAgentData;
      return LABEL[
        detectOS(navigator.userAgent, nav.userAgentData?.platform ?? navigator.platform)
      ];
    },
    () => LABEL.unknown,
  );
  return (
    <Button
      variant="filled"
      size="md"
      className={className}
      render={
        <Link href="/install">
          {label}
          <Icon name="download" data-icon="inline-end" />
        </Link>
      }
    />
  );
}
