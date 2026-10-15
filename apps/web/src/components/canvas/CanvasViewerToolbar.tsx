// FILE: CanvasViewerToolbar.tsx
// Purpose: Top toolbar for the in-app JSON Canvas viewer (.canvas files).
//          Matches the design of PdfViewerToolbar and PptxViewerToolbar:
//          filename + CANVAS badge, node/edge count, zoom/fit controls, reload,
//          and the shared OpenInPicker.
// Layer: Web canvas viewer chrome
// Exports: CanvasViewerToolbar

import { Maximize2, MinusIcon, PlusIcon, RefreshCwIcon } from "~/lib/icons";
import { cn } from "~/lib/utils";
import {
  CHAT_SURFACE_HEADER_DIVIDER_CLASS_NAME,
  ChatHeaderButton,
  ChatHeaderIconButton,
} from "../chat/chatHeaderControls";
import { OpenInPicker } from "../chat/OpenInPicker";
import { Badge } from "../ui/badge";

interface CanvasViewerToolbarProps {
  fileName: string;
  nodeCount: number;
  edgeCount: number;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToView: () => void;
  openInTarget: string | null;
  onReload?: (() => void) | undefined;
}

export function CanvasViewerToolbar(props: CanvasViewerToolbarProps) {
  const zoomPercent = Math.round(props.scale * 100);

  return (
    <div
      className={cn(
        "flex h-10 shrink-0 items-center gap-2 px-3",
        CHAT_SURFACE_HEADER_DIVIDER_CLASS_NAME,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate text-ui font-medium text-foreground" title={props.fileName}>
          {props.fileName}
        </span>
        <Badge variant="outline" size="sm" className="text-muted-foreground/80">
          CANVAS
        </Badge>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <span className="text-ui-sm tabular-nums text-muted-foreground">
          {props.nodeCount} {props.nodeCount === 1 ? "node" : "nodes"}
          {props.edgeCount > 0
            ? ` · ${props.edgeCount} ${props.edgeCount === 1 ? "edge" : "edges"}`
            : ""}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
        <div className="flex items-center gap-0.5">
          <ChatHeaderIconButton label="Zoom out" tone="plain" onClick={props.onZoomOut}>
            <MinusIcon aria-hidden="true" className="size-4" />
          </ChatHeaderIconButton>

          <ChatHeaderButton
            tone="plain"
            className="min-w-14 justify-center px-1.5 text-ui-sm tabular-nums"
            title="Reset zoom to 100%"
            onClick={props.onResetZoom}
          >
            {zoomPercent}%
          </ChatHeaderButton>

          <ChatHeaderIconButton label="Zoom in" tone="plain" onClick={props.onZoomIn}>
            <PlusIcon aria-hidden="true" className="size-4" />
          </ChatHeaderIconButton>

          <ChatHeaderIconButton
            label="Fit all nodes to view"
            tone="plain"
            onClick={props.onFitToView}
          >
            <Maximize2 aria-hidden="true" className="size-3.5" />
          </ChatHeaderIconButton>
        </div>

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
