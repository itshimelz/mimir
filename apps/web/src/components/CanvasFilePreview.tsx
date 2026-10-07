// FILE: CanvasFilePreview.tsx
// Purpose: In-app JSON Canvas viewer (.canvas files). Mirrors PdfFilePreview and
//          PptxFilePreview: toolbar on top with zoom, fit, node/edge counts, and
//          Open in editor, over an interactive 2D pan/zoom canvas stage.
// Layer: Web chat/editor file-preview component
// Exports: CanvasFilePreview

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";

import { basenameOfPath } from "~/file-icons";
import { Loader2Icon, TriangleAlertIcon } from "~/lib/icons";
import { buildLocalImageUrl } from "~/lib/localImageUrls";
import { useContainerSize } from "~/lib/viewer/useContainerSize";
import { computeCanvasBounds, computeFitToView, type CanvasNode } from "~/lib/canvas/jsonCanvas";
import { useCanvasDocument } from "~/lib/canvas/useCanvasDocument";
import { cn } from "~/lib/utils";
import { CanvasEdgeLayer } from "./canvas/CanvasEdgeLayer";
import { CanvasNodeCard } from "./canvas/CanvasNodeCard";
import { CanvasViewerToolbar } from "./canvas/CanvasViewerToolbar";

export interface CanvasFilePreviewProps {
  /** Workspace-relative path of the canvas, or an allowlisted absolute path. */
  filePath: string;
  cwd: string | null | undefined;
  previewGrant?: string | null | undefined;
  cacheKey?: string | number | undefined;
  /** Pre-resolved target for the "Open in editor" control in the toolbar. */
  openInTarget: string | null;
  className?: string;
  onReload?: (() => void) | undefined;
  onPreviewReady?: (() => void) | undefined;
  onPreviewError?: (() => void) | undefined;
}

const MIN_SCALE = 0.15;
const MAX_SCALE = 3.0;

export function CanvasFilePreview(props: CanvasFilePreviewProps) {
  const previewUrl = buildLocalImageUrl({
    src: props.filePath,
    cwd: props.cwd ?? undefined,
    grant: props.previewGrant,
    cacheKey: props.cacheKey,
  });
  const fileName = basenameOfPath(props.filePath);

  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const containerSize = useContainerSize(containerEl);

  const doc = useCanvasDocument(previewUrl);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [hasAutoFitted, setHasAutoFitted] = useState(false);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const { onPreviewReady, onPreviewError } = props;
  useEffect(() => {
    if (doc.status === "ready") {
      onPreviewReady?.();
    } else if (doc.status === "error") {
      onPreviewError?.();
    }
  }, [doc.status, onPreviewError, onPreviewReady]);

  // Index nodes by ID for fast lookup during edge routing
  const nodesById = useMemo(() => {
    const map = new Map<string, CanvasNode>();
    if (doc.data?.nodes) {
      for (const node of doc.data.nodes) {
        map.set(node.id, node);
      }
    }
    return map;
  }, [doc.data?.nodes]);

  const bounds = useMemo(() => {
    return computeCanvasBounds(doc.data?.nodes ?? []);
  }, [doc.data?.nodes]);

  // Fit to view once content and container size are available
  const handleFitToView = useCallback(() => {
    if (!containerSize || !doc.data?.nodes.length) {
      setPan({ x: 0, y: 0 });
      setScale(1);
      return;
    }
    const fit = computeFitToView(bounds, containerSize);
    setScale(fit.scale);
    setPan({ x: fit.panX, y: fit.panY });
  }, [bounds, containerSize, doc.data?.nodes.length]);

  useEffect(() => {
    if (!hasAutoFitted && doc.status === "ready" && containerSize && doc.data?.nodes.length) {
      handleFitToView();
      setHasAutoFitted(true);
    }
  }, [doc.status, containerSize, doc.data?.nodes.length, hasAutoFitted, handleFitToView]);

  // Reset auto-fit on URL / file change
  useEffect(() => {
    setHasAutoFitted(false);
  }, [previewUrl]);

  const handleZoomIn = useCallback(() => {
    setScale((current) => Math.min(MAX_SCALE, Number((current * 1.2).toFixed(2))));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((current) => Math.max(MIN_SCALE, Number((current / 1.2).toFixed(2))));
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1);
  }, []);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Only drag with primary mouse button
    if (e.button !== 0 && e.button !== 1) return;
    // Don't drag if clicking directly on a link or text selection
    const target = e.target as HTMLElement;
    if (target.closest("a, button, input, textarea")) return;

    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture might have released automatically
      }
    }
  };

  const handleWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom centered on cursor
      const rect = containerEl?.getBoundingClientRect();
      const cursorX = rect ? e.clientX - rect.left : (containerSize?.width ?? 0) / 2;
      const cursorY = rect ? e.clientY - rect.top : (containerSize?.height ?? 0) / 2;

      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));

      const scaleRatio = newScale / scale;
      const newPanX = cursorX - (cursorX - pan.x) * scaleRatio;
      const newPanY = cursorY - (cursorY - pan.y) * scaleRatio;

      setScale(Number(newScale.toFixed(3)));
      setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
    } else {
      // Pan
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  const outerClassName = cn(
    "flex h-full min-h-0 min-w-0 flex-1 flex-col app-content-surface select-none",
    props.className,
  );

  if (doc.status === "error") {
    return (
      <div className={outerClassName}>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <TriangleAlertIcon className="size-5 text-destructive/80" aria-hidden="true" />
          <p className="text-ui text-muted-foreground">
            {doc.error ?? "Could not open this canvas file."}
          </p>
          {props.onReload ? (
            <button
              type="button"
              className="rounded-md px-2 py-1 text-ui leading-snug hover:bg-foreground/8"
              onClick={props.onReload}
            >
              Reload file from disk
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  const nodes = doc.data?.nodes ?? [];
  const edges = doc.data?.edges ?? [];

  return (
    <div className={outerClassName}>
      <CanvasViewerToolbar
        fileName={fileName}
        nodeCount={nodes.length}
        edgeCount={edges.length}
        scale={scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onFitToView={handleFitToView}
        openInTarget={props.openInTarget}
        onReload={props.onReload}
      />

      <div
        ref={setContainerEl}
        className="relative min-h-0 flex-1 overflow-hidden cursor-grab active:cursor-grabbing bg-background touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        {/* Subtle grid pattern background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)",
            backgroundSize: `${Math.max(12, Math.round(24 * scale))}px ${Math.max(12, Math.round(24 * scale))}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        />

        {doc.status === "loading" ? (
          <div
            className="flex min-h-full items-center justify-center"
            role="status"
            aria-label="Loading canvas..."
          >
            <Loader2Icon className="size-4 animate-spin opacity-60" aria-hidden="true" />
          </div>
        ) : nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center p-6">
            <p className="text-ui text-muted-foreground">This canvas has no nodes.</p>
          </div>
        ) : (
          <div
            className="absolute origin-top-left"
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
              transformOrigin: "0 0",
            }}
          >
            {/* SVG edge layer */}
            <CanvasEdgeLayer edges={edges} nodesById={nodesById} bounds={bounds} />

            {/* Nodes layer */}
            {nodes.map((node) => (
              <CanvasNodeCard key={node.id} node={node} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
