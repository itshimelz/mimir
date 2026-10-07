// FILE: PptxViewerToolbar.tsx
// Purpose: Top chrome bar for the in-app PPTX viewer. Shares the PDF viewer's
//          structure — file name + type badge on the left, slide navigation in
//          the middle, the shared zoom control plus the shared "Open in editor"
//          split button on the right — and adds the toggle that arms shape
//          annotation on the slide stack.
// Layer: Web PPTX viewer chrome
// Exports: PptxViewerToolbar

import { ChevronLeftIcon, ChevronRightIcon, MessageCircleIcon, RefreshCwIcon } from "~/lib/icons";
import type { ViewerZoomMode } from "~/lib/viewer/viewerZoom";
import { cn } from "~/lib/utils";
import {
  CHAT_SURFACE_HEADER_DIVIDER_CLASS_NAME,
  ChatHeaderIconButton,
} from "../chat/chatHeaderControls";
import { OpenInPicker } from "../chat/OpenInPicker";
import { Badge } from "../ui/badge";
import { ViewerPageIndicator } from "../viewer/ViewerPageIndicator";
import { ViewerZoomControl } from "../viewer/ViewerZoomControl";

interface PptxViewerToolbarProps {
  fileName: string;
  currentSlide: number;
  numSlides: number;
  onJumpToSlide: (slideNumber: number) => void;
  zoomMode: ViewerZoomMode;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSetScale: (scale: number) => void;
  onFitWidth: () => void;
  onFitPage: () => void;
  /** True when the deck is parsed and shapes can be targeted. */
  canAnnotate: boolean;
  annotating: boolean;
  annotationCount: number;
  onToggleAnnotate: () => void;
  openInTarget: string | null;
  onReload?: (() => void) | undefined;
}

export const PptxViewerToolbar = function PptxViewerToolbar(props: PptxViewerToolbarProps) {
  return (
    <div
      className={cn(
        // Match the breadcrumb file-preview header height (h-10) so swapping
        // between a deck and a text file in the same pane doesn't jump the chrome.
        "flex h-10 shrink-0 items-center gap-2 px-3",
        CHAT_SURFACE_HEADER_DIVIDER_CLASS_NAME,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate text-ui font-medium text-foreground" title={props.fileName}>
          {props.fileName}
        </span>
        <Badge variant="outline" size="sm" className="text-muted-foreground/80">
          PPTX
        </Badge>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <ChatHeaderIconButton
          label="Previous slide"
          tone="plain"
          disabled={props.currentSlide <= 1}
          onClick={() => props.onJumpToSlide(props.currentSlide - 1)}
        >
          <ChevronLeftIcon aria-hidden="true" className="size-4" />
        </ChatHeaderIconButton>
        <ViewerPageIndicator
          key={props.currentSlide}
          currentPage={props.currentSlide}
          numPages={props.numSlides}
          onJumpToPage={props.onJumpToSlide}
          inputLabel="Current slide"
        />
        <ChatHeaderIconButton
          label="Next slide"
          tone="plain"
          disabled={props.currentSlide >= props.numSlides}
          onClick={() => props.onJumpToSlide(props.currentSlide + 1)}
        >
          <ChevronRightIcon aria-hidden="true" className="size-4" />
        </ChatHeaderIconButton>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <ChatHeaderIconButton
          label={annotateLabel(props.annotating, props.annotationCount)}
          disabled={!props.canAnnotate}
          aria-pressed={props.annotating}
          data-pressed={props.annotating ? "" : undefined}
          onClick={props.onToggleAnnotate}
        >
          <MessageCircleIcon aria-hidden="true" className="size-3.5" />
        </ChatHeaderIconButton>
        <ViewerZoomControl
          zoomMode={props.zoomMode}
          scale={props.scale}
          onZoomIn={props.onZoomIn}
          onZoomOut={props.onZoomOut}
          onSetScale={props.onSetScale}
          onFitWidth={props.onFitWidth}
          onFitPage={props.onFitPage}
        />
        {props.onReload ? (
          <ChatHeaderIconButton label="Reload file from disk" tone="plain" onClick={props.onReload}>
            <RefreshCwIcon aria-hidden="true" className="size-3.5" />
          </ChatHeaderIconButton>
        ) : null}
        <OpenInPicker
          openInTarget={props.openInTarget}
          labelMode="always"
          defaultEditor="system-default"
        />
      </div>
    </div>
  );
};

function annotateLabel(annotating: boolean, annotationCount: number): string {
  const count = annotationCount > 0 ? ` · ${annotationCount} added` : "";
  return annotating ? `Stop commenting on slides${count}` : `Comment on a slide shape${count}`;
}
