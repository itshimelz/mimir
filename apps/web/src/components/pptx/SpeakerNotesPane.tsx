// FILE: SpeakerNotesPane.tsx
// Purpose: Attached speaker notes pane rendered directly below the active slide,
//          mirroring ChatGPT's Popcorn presentation notes section.
// Layer: Web PPTX viewer component
// Exports: SpeakerNotesPane

import { cn } from "~/lib/utils";

interface SpeakerNotesPaneProps {
  notes: string;
  slideNumber: number;
  className?: string;
}

export function SpeakerNotesPane(props: SpeakerNotesPaneProps) {
  const { notes, slideNumber, className } = props;
  const hasNotes = notes.trim().length > 0;

  return (
    <section
      aria-label={`Speaker notes for slide ${slideNumber}`}
      className={cn(
        "mt-4 w-full rounded-xl border border-border/60 bg-muted/20 p-4 shadow-xs transition-all duration-150",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-ui-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          Speaker notes
        </span>
        <span className="text-ui-xs text-muted-foreground/60">Slide {slideNumber}</span>
      </div>
      <div
        className={cn(
          "text-ui leading-relaxed whitespace-pre-wrap select-text",
          hasNotes ? "text-foreground/90 font-normal" : "text-muted-foreground/60 italic",
        )}
      >
        {hasNotes ? notes : "No speaker notes for this slide."}
      </div>
    </section>
  );
}
