// FILE: PdfViewerToolbar.tsx
// Purpose: Top chrome bar for the in-app PDF viewer. Mirrors the reference UI:
//          file name + "PDF" label on the left, centered page navigation, and
//          the shared zoom control + the shared "Open in editor" split button
//          on the right.
// Layer: Web PDF viewer chrome
// Exports: PdfViewerToolbar

import { ChevronLeftIcon, ChevronRightIcon, RefreshCwIcon } from "~/lib/icons";
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

interface PdfViewerToolbarProps {
  fileName: string;
  currentPage: number;
  numPages: number;
  onJumpToPage: (pageNumber: number) => void;
  zoomMode: ViewerZoomMode;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSetScale: (scale: number) => void;
  onFitWidth: () => void;
  onFitPage: () => void;
  openInTarget: string | null;
  onReload?: (() => void) | undefined;
}

export const PdfViewerToolbar = function PdfViewerToolbar(props: PdfViewerToolbarProps) {
  return (
    <div
      className={cn(
        // Match the breadcrumb file-preview header height (h-10) so swapping
        // between a PDF and a text file in the same pane doesn't jump the chrome.
        "flex h-10 shrink-0 items-center gap-2 px-3",
        CHAT_SURFACE_HEADER_DIVIDER_CLASS_NAME,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate text-ui font-medium text-foreground" title={props.fileName}>
          {props.fileName}
        </span>
        <Badge variant="outline" size="sm" className="text-muted-foreground/80">
          PDF
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
