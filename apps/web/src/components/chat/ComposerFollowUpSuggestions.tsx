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
      className="pointer-events-auto pb-2 flex flex-wrap items-center gap-1.5 px-0.5 animate-in fade-in duration-150"
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
            className="group inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-border-light)] bg-[var(--color-background-elevated-primary)] px-3 py-1 text-ui text-foreground shadow-sm transition-all duration-150 select-none cursor-pointer hover:bg-[var(--color-background-button-secondary-hover)] hover:border-foreground/20 active:scale-[0.98]"
            title={tooltipText}
            aria-label={`Ask follow-up: ${suggestion.label}`}
          >
            <span className="truncate max-w-[420px]">{suggestion.label}</span>
            <ArrowUpRightIcon className="size-3 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
          </button>
        );
      })}
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-[var(--color-background-button-secondary-hover)] hover:text-foreground transition-colors cursor-pointer"
          title="Dismiss suggestions"
          aria-label="Dismiss suggestions"
        >
          <XIcon className="size-3" />
        </button>
      ) : null}
    </div>
  );
});
