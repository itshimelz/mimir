// FILE: DocxViewerToolbar.tsx
// Purpose: Top chrome bar for the in-app DOCX viewer. Provides file name and
//          badge, page navigation, tracked changes (redlines) toggle, ChatGPT-style
//          "Request edits" comment action, zoom controls, reload, and "Open in editor".
// Layer: Web DOCX viewer chrome
// Exports: DocxViewerToolbar

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DiffIcon,
  RefreshCwIcon,
  SparkleIcon,
} from "~/lib/icons";
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

export interface DocxViewerToolbarProps {
  fileName: string;
  currentPage: number;
  numPages: number;
  onJumpToPage: (pageNumber: number) => void;
  hasRedlines: boolean;
  showRedlines: boolean;
  onToggleRedlines: () => void;
  zoomMode: ViewerZoomMode;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSetScale: (scale: number) => void;
  onFitWidth: () => void;
  onFitPage: () => void;
  openInTarget: string | null;
  onReload?: (() => void) | undefined;
  onRequestEdits?: (() => void) | undefined;
  hasActiveSelection?: boolean;
}

export function DocxViewerToolbar(props: DocxViewerToolbarProps) {
  return (
    <div
      className={cn(
        "flex h-10 shrink-0 items-center justify-between gap-2 px-3",
        CHAT_SURFACE_HEADER_DIVIDER_CLASS_NAME,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate text-ui font-medium text-foreground" title={props.fileName}>
          {props.fileName}
        </span>
        <Badge variant="outline" size="sm" className="text-muted-foreground/80">
          DOCX
        </Badge>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <ChatHeaderIconButton
          label="Previous page"
          tone="plain"
          disabled={props.currentPage <= 1}
          onClick={() => props.onJumpToPage(props.currentPage - 1)}
        >
          <ChevronLeftIcon aria-hidden="true" className="size-4" />
        </ChatHeaderIconButton>
        <ViewerPageIndicator
          key={props.currentPage}
          currentPage={props.currentPage}
          numPages={props.numPages}
          onJumpToPage={props.onJumpToPage}
          inputLabel="Current page"
        />
        <ChatHeaderIconButton
          label="Next page"
          tone="plain"
          disabled={props.currentPage >= props.numPages}
          onClick={() => props.onJumpToPage(props.currentPage + 1)}
        >
          <ChevronRightIcon aria-hidden="true" className="size-4" />
        </ChatHeaderIconButton>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {/* Tracked changes / Redlines toggle button */}
        {props.hasRedlines ? (
          <button
            type="button"
            onClick={props.onToggleRedlines}
            aria-pressed={props.showRedlines}
            className={cn(
              "flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-ui-xs font-medium transition-colors border",
              props.showRedlines
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                : "bg-background text-foreground/80 border-border/60 hover:bg-muted/50 hover:text-foreground",
            )}
            aria-label={
              props.showRedlines
                ? "Hide redlines (show clean version)"
                : "Show redlines (tracked revisions)"
            }
            title={
              props.showRedlines
                ? "Hide redlines (show clean version)"
                : "Show redlines (tracked revisions)"
            }
          >
            <DiffIcon aria-hidden="true" className="size-3.5" />
            <span>{props.showRedlines ? "Redlines on" : "Show redlines"}</span>
          </button>
        ) : null}

        {/* ChatGPT-style "Request edits" / comment on selection action */}
        {props.onRequestEdits ? (
          <button
            type="button"
            onClick={props.onRequestEdits}
            className={cn(
              "flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-ui-xs font-medium transition-colors border",
              props.hasActiveSelection
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-background text-foreground/80 border-border/60 hover:bg-muted/50 hover:text-foreground",
            )}
            aria-label="Request edits or comment on selected text in chat"
            title="Request edits or comment on selected text in chat"
          >
            <SparkleIcon
              aria-hidden="true"
              className={cn(
                "size-3.5",
                props.hasActiveSelection ? "text-primary-foreground" : "text-primary",
              )}
            />
            <span>Request edits</span>
          </button>
        ) : null}

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
}
