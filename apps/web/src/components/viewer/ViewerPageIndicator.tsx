// FILE: ViewerPageIndicator.tsx
// Purpose: The "current / total" page editor every stacked document viewer
//          shows in its toolbar: a typed number that clamps to the document and
//          jumps on Enter/blur, next to a dimmed total. One control so the PDF
//          page stack and the PPTX slide stack behave identically.
// Layer: Web viewer chrome
// Exports: ViewerPageIndicator

import { useState } from "react";

export interface ViewerPageIndicatorProps {
  currentPage: number;
  numPages: number;
  onJumpToPage: (pageNumber: number) => void;
  /** Accessible name for the number field, e.g. "Current slide". */
  inputLabel: string;
}

export const ViewerPageIndicator = function ViewerPageIndicator(props: ViewerPageIndicatorProps) {
  const { currentPage, numPages, onJumpToPage } = props;
  // The caller keys this editor by currentPage, so every navigation gets a new
  // draft even when the page sequence returns A -> B -> A.
  const [draft, setDraft] = useState(String(currentPage));

  const commit = () => {
    const parsed = Number.parseInt(draft, 10);
    if (Number.isFinite(parsed)) {
      const clamped = Math.min(Math.max(parsed, 1), Math.max(numPages, 1));
      onJumpToPage(clamped);
      // Canonicalize in place for jumps that clamp to the current page: the
      // keyed remount only resets the draft when the page actually changes.
      setDraft(String(clamped));
    } else {
      setDraft(String(currentPage));
    }
  };

  return (
    <span className="flex items-center gap-1 text-ui-sm tabular-nums text-muted-foreground">
      <input
        value={draft}
        inputMode="numeric"
        aria-label={props.inputLabel}
        className="h-6 w-8 rounded-sm border border-border/60 bg-transparent text-center text-ui-sm text-foreground tabular-nums outline-none focus-visible:border-[color:var(--color-border-focus)]"
        onChange={(event) => setDraft(event.target.value.replace(/[^0-9]/g, ""))}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
      />
      <span className="opacity-70">/ {numPages}</span>
    </span>
  );
};
