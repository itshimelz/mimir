// FILE: CanvasEdgeLayer.tsx
// Purpose: SVG layer rendering connecting edges and arrows between nodes
//          in the JSON Canvas view.
// Layer: Web canvas edge presentation component
// Exports: CanvasEdgeLayer

import { memo, useMemo } from "react";

import {
  computeEdgePath,
  resolveCanvasColor,
  type CanvasBaseNode,
  type CanvasEdge,
  type CanvasNode,
} from "~/lib/canvas/jsonCanvas";

interface CanvasEdgeLayerProps {
  edges: readonly CanvasEdge[];
  nodesById: ReadonlyMap<string, CanvasNode>;
  bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
}

export const CanvasEdgeLayer = memo(function CanvasEdgeLayer({
  edges,
  nodesById,
  bounds,
}: CanvasEdgeLayerProps) {
  const renderedEdges = useMemo(() => {
    const list: Array<{
      edge: CanvasEdge;
      path: string;
      color: string;
      labelPoint: { x: number; y: number };
      hasArrow: boolean;
    }> = [];

    for (const edge of edges) {
      const source = nodesById.get(edge.fromNode);
      const target = nodesById.get(edge.toNode);
      if (!source || !target) continue;

      const pathData = computeEdgePath(source as CanvasBaseNode, target as CanvasBaseNode, edge);
      const resolvedColor = resolveCanvasColor(edge.color);
      const strokeColor = resolvedColor?.border ?? "rgb(148 163 184)"; // slate-400 fallback

      list.push({
        edge,
        path: pathData.path,
        color: strokeColor,
        labelPoint: pathData.labelPoint,
        hasArrow: edge.toEnd !== "none",
      });
    }

    return list;
  }, [edges, nodesById]);

  // Expand SVG canvas bounds to cover all potential edge curves
  const svgPadding = 400;
  const svgLeft = bounds.minX - svgPadding;
  const svgTop = bounds.minY - svgPadding;
  const svgWidth = bounds.width + svgPadding * 2;
  const svgHeight = bounds.height + svgPadding * 2;

  return (
    <svg
      className="pointer-events-none absolute z-5 overflow-visible"
      style={{
        left: `${svgLeft}px`,
        top: `${svgTop}px`,
        width: `${svgWidth}px`,
        height: `${svgHeight}px`,
      }}
      viewBox={`${svgLeft} ${svgTop} ${svgWidth} ${svgHeight}`}
    >
      <defs>
        <marker
          id="canvas-arrow-default"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgb(148 163 184)" />
        </marker>
        {renderedEdges.map((item) =>
          item.hasArrow ? (
            <marker
              key={`marker-${item.edge.id}`}
              id={`canvas-arrow-${item.edge.id}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={item.color} />
            </marker>
          ) : null,
        )}
      </defs>

      {renderedEdges.map(({ edge, path, color, hasArrow }) => (
        <path
          key={edge.id}
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          markerEnd={hasArrow ? `url(#canvas-arrow-${edge.id})` : undefined}
          className="transition-colors"
        />
      ))}

      {renderedEdges.map(({ edge, labelPoint }) =>
        edge.label ? (
          <g
            key={`label-${edge.id}`}
            transform={`translate(${labelPoint.x}, ${labelPoint.y})`}
            className="pointer-events-auto"
          >
            <rect
              x="-40"
              y="-12"
              width="80"
              height="24"
              rx="6"
              className="fill-background/95 stroke-border"
              strokeWidth="1"
            />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground font-sans text-ui-xs font-medium"
              style={{ fontSize: "11px" }}
            >
              {edge.label}
            </text>
          </g>
        ) : null,
      )}
    </svg>
  );
});
