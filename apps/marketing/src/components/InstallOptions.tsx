// FILE: InstallOptions.tsx
// Purpose: Renders the three platform download cards (macOS / Windows / Linux),
//          detects the visitor's OS to highlight the recommended one, and lets
//          Mac users switch between the Apple Silicon and Intel builds.
// Layer: Client component (M3E cards, buttons, segmented toggle group)
// Depends on: src/lib/platform, src/lib/releases (ReleaseDownloads type), InstallerCount

"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { FaApple, FaWindows, FaLinux } from "react-icons/fa";
import InstallerCount from "@/components/InstallerCount";
import { Badge } from "@/components/m3e/badge";
import { Button } from "@/components/m3e/button";
import { Card } from "@/components/m3e/card";
import { Icon } from "@/components/m3e/icon";
import { ToggleGroup, ToggleGroupItem } from "@/components/m3e/toggle-group";
import { detectCurrentOS, detectMacArch, type MacArch, type OS } from "@/lib/platform";
import type { ReleaseDownloads } from "@/lib/releases";

const OS_LABEL: Record<Exclude<OS, "unknown">, string> = {
  mac: "macOS",
  windows: "Windows",
  linux: "Linux",
};

// Detection is a one-time, client-only browser read, so we expose it through
// useSyncExternalStore (like DownloadButton) instead of a setState-in-effect.
// Results are memoized at module scope so the WebGL probe runs at most once.
const subscribe = () => () => {};

let cachedOS: OS | undefined;
function getOSSnapshot(): OS {
  if (cachedOS === undefined) cachedOS = detectCurrentOS();
  return cachedOS;
}

let cachedArch: MacArch | undefined;
function getArchSnapshot(): MacArch {
  if (cachedArch === undefined) cachedArch = detectMacArch();
  return cachedArch;
}

export default function InstallOptions({
  downloads,
  installerCount,
}: {
  downloads: ReleaseDownloads;
  installerCount: number | null;
}) {
  // "unknown"/"arm64" during SSR + first client render, then the real values.
  const os = useSyncExternalStore<OS>(subscribe, getOSSnapshot, () => "unknown");
  const detectedArch = useSyncExternalStore(subscribe, getArchSnapshot, () => "arm64" as MacArch);

  // User can override the detected Mac architecture via the toggle.
  const [archOverride, setArchOverride] = useState<MacArch | null>(null);
  const arch = archOverride ?? detectedArch;

  const macHref = arch === "arm64" ? downloads.mac.arm64 : downloads.mac.x64;

  return (
    <div className="flex flex-col items-center text-center">
      <p className="mb-6 min-h-[18px] text-body-small text-on-surface-variant">
        {os !== "unknown" ? (
          <>
            Detected <span className="text-on-surface">{OS_LABEL[os]}</span> — recommended option
            highlighted below.
          </>
        ) : (
          "Pick your platform to download the latest build."
        )}
      </p>

      <div className="grid w-full gap-4 sm:grid-cols-3">
        <PlatformCard
          index={0}
          glyph={<FaApple className="size-6" aria-hidden="true" />}
          name="macOS"
          subtitle=".dmg · Apple Silicon & Intel"
          href={macHref}
          recommended={os === "mac"}
        >
          <ArchToggle arch={arch} onChange={setArchOverride} />
        </PlatformCard>

        <PlatformCard
          index={1}
          glyph={<FaWindows className="size-[22px]" aria-hidden="true" />}
          name="Windows"
          subtitle=".exe installer · 64-bit"
          href={downloads.windows}
          recommended={os === "windows"}
        />

        <PlatformCard
          index={2}
          glyph={<FaLinux className="size-6" aria-hidden="true" />}
          name="Linux"
          subtitle=".AppImage · x86_64"
          href={downloads.linux}
          recommended={os === "linux"}
        />
      </div>

      <p className="mt-8 text-body-small text-on-surface-variant">
        <InstallerCount initialCount={installerCount} />
      </p>

      <p className="mt-2 text-body-small leading-[1.6] text-on-surface-variant">
        {downloads.version ? `Latest release ${downloads.version}. ` : ""}
        Looking for an older version or the checksums?{" "}
        <a
          href={downloads.releasesUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:decoration-primary focus-ring rounded-sm"
        >
          Browse all releases
        </a>
        .
      </p>
    </div>
  );
}

function PlatformCard({
  index,
  glyph,
  name,
  subtitle,
  href,
  recommended,
  children,
}: {
  index: number;
  glyph: ReactNode;
  name: string;
  subtitle: string;
  href: string;
  recommended: boolean;
  children?: ReactNode;
}) {
  return (
    <Card
      variant="outlined"
      style={{ animationDelay: `${index * 90}ms` }}
      className={`animate-rise-in relative flex flex-col items-center rounded-2xl px-5 pt-7 pb-5 text-center ${
        recommended ? "border-primary ring-2 ring-primary" : ""
      }`}
    >
      {recommended ? (
        <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 gap-1 whitespace-nowrap border-primary bg-surface text-primary">
          <Icon name="check" size={14} aria-hidden="true" />
          For your device
        </Badge>
      ) : null}

      <span className="flex h-7 items-center justify-center text-on-surface">{glyph}</span>

      <h2 className="mt-3 text-title-medium text-on-surface">{name}</h2>
      <p className="mt-1 text-body-small text-on-surface-variant">{subtitle}</p>

      {/* Pinned to the bottom so every card's Download button lines up. */}
      <div className="mt-auto w-full pt-6">
        {children ? <div className="mb-3 flex justify-center">{children}</div> : null}
        <Button
          variant="filled"
          className="w-full"
          render={<a href={href} />}
          aria-label={`Download Mimir for ${name}`}
        >
          Download
          <Icon name="download" data-icon="inline-end" />
        </Button>
      </div>
    </Card>
  );
}

const ARCH_OPTIONS = [
  { value: "arm64", label: "Apple Silicon" },
  { value: "x64", label: "Intel" },
] as const;

function ArchToggle({ arch, onChange }: { arch: MacArch; onChange: (arch: MacArch) => void }) {
  return (
    <ToggleGroup
      value={[arch]}
      onValueChange={(value) => {
        const next = value[0];
        if (next) onChange(next as MacArch);
      }}
      aria-label="macOS chip"
      className="text-label-large"
    >
      {ARCH_OPTIONS.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value} size="sm">
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
