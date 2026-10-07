import { memo } from "react";
import { ArrowUpRightIcon, XIcon } from "~/lib/icons";
import type { AgentFollowupItem } from "~/lib/remarkAgentDirectives";

export interface ComposerFollowUpSuggestionsProps {
  suggestions: readonly AgentFollowupItem[];
  onApply: (prompt: string) => void;
  onDismiss?: () => void;
}

export const ComposerFollowUpSuggestions = memo(function ComposerFollowUpSuggestions({
  suggestions,
  onApply,
  onDismiss,
}: ComposerFollowUpSuggestionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div
      data-composer-followup-suggestions="true"
      className="pointer-events-auto flex max-w-full flex-wrap items-center gap-2 px-0.5 pb-2 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150"
    >
      {suggestions.map((suggestion) => {
        const tooltipText =
          suggestion.prompt !== suggestion.label ? suggestion.prompt : `Ask: "${suggestion.label}"`;
        return (
          <button
            key={suggestion.id ?? suggestion.label}
            type="button"
            data-agent-followup-suggestion="true"
            data-prompt={suggestion.prompt}
            onClick={() => onApply(suggestion.prompt)}
            className="group inline-flex min-h-9 max-w-full min-w-0 cursor-pointer select-none items-center gap-2 rounded-full border border-[color:var(--color-border-light)] bg-[var(--color-background-elevated-primary)] px-3.5 py-1.5 text-left text-ui leading-snug font-medium text-[var(--color-text-foreground-secondary)] transition-[background-color,border-color,color] duration-150 hover:border-[color:var(--color-border)] hover:bg-[var(--color-background-button-secondary-hover)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:bg-[var(--color-background-button-secondary-hover)]"
            title={tooltipText}
            aria-label={`Ask follow-up: ${suggestion.label}`}
          >
            <span className="line-clamp-2 min-w-0 max-w-[min(72vw,26rem)] break-words">
              {suggestion.label}
            </span>
            <ArrowUpRightIcon className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground group-focus-visible:text-foreground" />
          </button>
        );
      })}
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[var(--color-background-button-secondary-hover)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          title="Dismiss suggestions"
          aria-label="Dismiss suggestions"
        >
          <XIcon className="size-3" />
        </button>
      ) : null}
    </div>
  );
});
