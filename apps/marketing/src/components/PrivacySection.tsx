// FILE: PrivacySection.tsx
// Purpose: Homepage trust block describing the local workspace boundary and
//          the provider boundary without implying that provider sessions stay local.
// Layer: Marketing UI section (M3E cards + icons)

import Link from "next/link";
import { Button } from "@/components/m3e/button";
import { Card } from "@/components/m3e/card";
import { Icon } from "@/components/m3e/icon";

const heading = "text-headline-medium text-on-surface sm:text-headline-large";
const body = "mt-5 max-w-2xl text-body-large text-on-surface-variant";
const container = "mx-auto w-full max-w-6xl px-4 sm:px-6";

const pillars = [
  {
    icon: "hard_drive",
    title: "Workspace state stays on your machine",
    description:
      "Projects, task history, settings, and local application state are stored by the desktop app on your machine rather than in a Mimir-hosted workspace account.",
  },
  {
    icon: "power",
    title: "Provider traffic goes to the selected provider",
    description:
      "The coding-agent runtime receives the prompts, files, diffs, command output, and tool results required for that provider session. Mimir does not proxy normal provider traffic through its own model service.",
  },
  {
    icon: "shield",
    title: "No Mimir account is required",
    description:
      "Install the desktop app and use the provider accounts already configured on your machine. Remote access remains an explicit, self-hosted capability.",
  },
  {
    icon: "visibility_off",
    title: "Anonymous analytics are opt-in",
    description:
      "Optional usage analytics are disabled by default and are designed not to include source code, prompts, or conversation history.",
  },
];

export default function PrivacySection() {
  return (
    <section className="border-t border-outline-variant py-14 sm:py-20">
      <div className={container}>
        <p className="text-label-large text-primary">Local-first boundary</p>
        <h2 className={`${heading} mt-3`}>Know where every part of the work goes.</h2>
        <p className={body}>
          Mimir keeps its workspace layer local and connects to the provider runtime you select. The
          boundary is explicit: local application state stays on your machine, while provider
          sessions receive the context they need to perform the task.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {pillars.map(({ icon, title, description }) => (
            <Card key={title} variant="outlined" className="rounded-lg p-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-container-high">
                  <Icon name={icon} className="text-on-surface" />
                </span>
                <span className="text-title-medium text-on-surface">{title}</span>
              </div>
              <p className="mt-3 text-body-medium text-on-surface-variant">{description}</p>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2 text-body-medium">
          <Button variant="text" size="sm" render={<Link href="/privacy" />}>
            Read the privacy approach
            <Icon name="arrow_forward" data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </section>
  );
}
