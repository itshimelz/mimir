// FILE: AskAISection.tsx
// Purpose: Lets visitors ask external AI assistants whether Mimir fits them.
// Layer: Marketing UI section (M3E assist chips)

"use client";

import type { MouseEvent } from "react";
import { useState } from "react";
import type { IconType } from "react-icons";
import { SiClaude, SiGooglegemini, SiOpenai } from "react-icons/si";
import { Chip } from "@/components/m3e/chip";

interface AiLink {
  readonly label: string;
  readonly appHref: string;
  readonly webHref: string;
  readonly icon: IconType;
  readonly iconClass: string;
  /** Copy the prompt on click, for assistants that cannot accept it by URL. */
  readonly copyPrompt?: boolean;
}

const ASK_AI_PROMPT =
  "Evaluate Mimir (https://mimir.himelz.studio) as a desktop-first agentic co-learner for university students. It organizes course materials into isolated Spaces, provides a dual Study view for PDF and slide reading, and a Studio view for interactive lessons, active retrieval quizzes, and visual knowledge maps. Based on this architecture, how does it help students build durable knowledge compared to standard AI chatbots?";

const encodedPrompt = encodeURIComponent(ASK_AI_PROMPT);

const aiLinks: readonly AiLink[] = [
  {
    label: "Ask ChatGPT",
    appHref: `https://chatgpt.com/?q=${encodedPrompt}`,
    webHref: `https://chatgpt.com/?q=${encodedPrompt}`,
    icon: SiOpenai,
    iconClass: "text-on-surface",
  },
  {
    label: "Ask Claude",
    appHref: `claude://claude.ai/new?q=${encodedPrompt}`,
    webHref: `https://claude.ai/new?q=${encodedPrompt}`,
    icon: SiClaude,
    iconClass: "text-[#D97757]",
  },
  {
    // Gemini supports no prompt prefill and no app-scheme deep link, so this one
    // copies the prompt to the clipboard and opens the web app for a paste.
    label: "Ask Gemini",
    appHref: "https://gemini.google.com/app",
    webHref: "https://gemini.google.com/app",
    icon: SiGooglegemini,
    iconClass: "text-[#4285F4]",
    copyPrompt: true,
  },
];

const heading = "text-headline-medium text-on-surface sm:text-headline-large";
const body = "mx-auto mt-5 max-w-xl text-body-large text-on-surface-variant";
const container = "mx-auto w-full max-w-6xl px-4 sm:px-6";

function openMobileDeepLink(
  event: MouseEvent<HTMLAnchorElement>,
  appHref: string,
  webHref: string,
) {
  if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    return;
  }

  event.preventDefault();

  let leftPage = false;
  const markLeftPage = () => {
    leftPage = true;
  };
  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      markLeftPage();
    }
  };

  window.addEventListener("pagehide", markLeftPage, { once: true });
  document.addEventListener("visibilitychange", handleVisibilityChange, {
    once: true,
  });

  window.location.href = appHref;

  window.setTimeout(() => {
    window.removeEventListener("pagehide", markLeftPage);
    document.removeEventListener("visibilitychange", handleVisibilityChange);

    if (!leftPage && document.visibilityState === "visible") {
      window.location.href = webHref;
    }
  }, 900);
}

// Gemini cannot receive the prompt through the URL, so it is copied instead and
// the button reports that for a moment before falling back to its normal label.
async function copyPromptToClipboard(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(ASK_AI_PROMPT);
    return true;
  } catch {
    return false; // denied or unsupported — the visitor still lands on Gemini
  }
}

export default function AskAISection() {
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  return (
    <section className="border-t border-outline-variant py-14 sm:py-20">
      <div className={container}>
        <div className="text-center">
          <p className="text-label-large text-primary">Model evaluation</p>
          <h2 className={`${heading} mt-3`}>Ask external AI models about Mimir</h2>
          <p className={body}>
            Ask ChatGPT, Claude, or Gemini to evaluate Mimir&apos;s architecture. The prefilled
            prompt analyzes the co-learning loop and local course isolation so you receive a
            concrete breakdown, not generic promotional text.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
            {aiLinks.map(({ label, appHref, webHref, icon: Icon, iconClass, copyPrompt }) => {
              const copied = copiedLabel === label;
              return (
                <Chip
                  key={label}
                  size="md"
                  variant="elevated"
                  className="w-full max-w-[270px] justify-center sm:w-auto sm:max-w-none"
                  icon={<Icon className={`size-5 ${iconClass}`} aria-hidden="true" />}
                  aria-label={
                    copyPrompt
                      ? `${label} about Mimir — copies the prompt to paste`
                      : `${label} about Mimir`
                  }
                  render={
                    <a
                      href={webHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => {
                        if (copyPrompt) {
                          void copyPromptToClipboard().then((didCopy) => {
                            if (!didCopy) return;
                            setCopiedLabel(label);
                            window.setTimeout(() => setCopiedLabel(null), 2500);
                          });
                        }
                        openMobileDeepLink(event, appHref, webHref);
                      }}
                    />
                  }
                >
                  {copied ? "Prompt copied — paste it" : label}
                </Chip>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
