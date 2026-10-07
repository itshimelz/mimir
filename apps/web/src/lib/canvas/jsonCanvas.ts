// FILE: jsonCanvas.ts
// Purpose: Types, parsing, color mapping, and geometric routing for the
//          JSON Canvas 1.0 open specification (https://jsoncanvas.org/spec/1.0/).
// Layer: Web canvas rendering library
// Exports: Canvas types, parseJsonCanvas, resolveCanvasColor, computeCanvasBounds,
//          computeEdgePath, computeFitToView

export type CanvasSide = "top" | "right" | "bottom" | "left";
export type CanvasEdgeEnd = "none" | "arrow";

export interface CanvasBaseNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

export interface CanvasTextNode extends CanvasBaseNode {
  type: "text";
  text: string;
}

export interface CanvasFileNode extends CanvasBaseNode {
  type: "file";
  file: string;
  subpath?: string;
}

export interface CanvasLinkNode extends CanvasBaseNode {
  type: "link";
  url: string;
}

export interface CanvasGroupNode extends CanvasBaseNode {
  type: "group";
  label?: string;
  background?: string;
  backgroundStyle?: "cover" | "ratio" | "repeat";
}

export type CanvasNode = CanvasTextNode | CanvasFileNode | CanvasLinkNode | CanvasGroupNode;

export interface CanvasEdge {
  id: string;
  fromNode: string;
  fromSide?: CanvasSide;
  fromEnd?: CanvasEdgeEnd;
  toNode: string;
  toSide?: CanvasSide;
  toEnd?: CanvasEdgeEnd;
  color?: string;
  label?: string;
}

export interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export interface CanvasParseResult {
  data: CanvasData | null;
  error: string | null;
}

const isValidSide = (s: unknown): s is CanvasSide =>
  s === "top" || s === "right" || s === "bottom" || s === "left";

const isValidEnd = (end: unknown): end is CanvasEdgeEnd => end === "none" || end === "arrow";

/**
 * Validates and parses JSON Canvas text conforming to JSON Canvas Spec 1.0.
 */
export function parseJsonCanvas(raw: string): CanvasParseResult {
  if (!raw || typeof raw !== "string" || !raw.trim()) {
    return { data: null, error: "Canvas file is empty." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Syntax error";
    return { data: null, error: `Invalid JSON Canvas file: ${message}` };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { data: null, error: "Root must be a JSON object containing nodes or edges." };
  }

  const root = parsed as Record<string, unknown>;
  const rawNodes = root.nodes;
  const rawEdges = root.edges;

  if (rawNodes !== undefined && !Array.isArray(rawNodes)) {
    return { data: null, error: "'nodes' must be an array." };
  }
  if (rawEdges !== undefined && !Array.isArray(rawEdges)) {
    return { data: null, error: "'edges' must be an array." };
  }

  const nodes: CanvasNode[] = [];
  const validNodeIds = new Set<string>();

  if (Array.isArray(rawNodes)) {
    for (let i = 0; i < rawNodes.length; i++) {
      const item = rawNodes[i];
      if (typeof item !== "object" || item === null) continue;
      const n = item as Record<string, unknown>;

      if (typeof n.id !== "string" || !n.id.trim()) continue;
      const id = n.id.trim();
      const x = typeof n.x === "number" && Number.isFinite(n.x) ? n.x : 0;
      const y = typeof n.y === "number" && Number.isFinite(n.y) ? n.y : 0;
      const width =
        typeof n.width === "number" && Number.isFinite(n.width) && n.width > 0 ? n.width : 250;
      const height =
        typeof n.height === "number" && Number.isFinite(n.height) && n.height > 0 ? n.height : 140;
      const color = typeof n.color === "string" ? n.color : undefined;

      const base: CanvasBaseNode = { id, x, y, width, height, color };

      if (n.type === "text") {
        nodes.push({
          ...base,
          type: "text",
          text: typeof n.text === "string" ? n.text : "",
        });
        validNodeIds.add(id);
      } else if (n.type === "file") {
        nodes.push({
          ...base,
          type: "file",
          file: typeof n.file === "string" ? n.file : "",
          subpath: typeof n.subpath === "string" ? n.subpath : undefined,
        });
        validNodeIds.add(id);
      } else if (n.type === "link") {
        nodes.push({
          ...base,
          type: "link",
          url: typeof n.url === "string" ? n.url : "",
        });
        validNodeIds.add(id);
      } else if (n.type === "group") {
        nodes.push({
          ...base,
          type: "group",
          label: typeof n.label === "string" ? n.label : undefined,
          background: typeof n.background === "string" ? n.background : undefined,
          backgroundStyle:
            n.backgroundStyle === "cover" ||
            n.backgroundStyle === "ratio" ||
            n.backgroundStyle === "repeat"
              ? n.backgroundStyle
              : undefined,
        });
        validNodeIds.add(id);
      }
    }
  }

  const edges: CanvasEdge[] = [];
  if (Array.isArray(rawEdges)) {
    for (let i = 0; i < rawEdges.length; i++) {
      const item = rawEdges[i];
      if (typeof item !== "object" || item === null) continue;
      const e = item as Record<string, unknown>;

      if (typeof e.id !== "string" || !e.id.trim()) continue;
      if (typeof e.fromNode !== "string" || !e.fromNode.trim()) continue;
      if (typeof e.toNode !== "string" || !e.toNode.trim()) continue;

      edges.push({
        id: e.id.trim(),
        fromNode: e.fromNode.trim(),
        fromSide: isValidSide(e.fromSide) ? e.fromSide : undefined,
        fromEnd: isValidEnd(e.fromEnd) ? e.fromEnd : "none",
        toNode: e.toNode.trim(),
        toSide: isValidSide(e.toSide) ? e.toSide : undefined,
        toEnd: isValidEnd(e.toEnd) ? e.toEnd : "arrow",
        color: typeof e.color === "string" ? e.color : undefined,
        label: typeof e.label === "string" ? e.label : undefined,
      });
    }
  }

  return {
    data: { nodes, edges },
    error: null,
  };
}

export interface CanvasResolvedColor {
  border: string;
  bg: string;
  accent: string;
}

/**
 * Maps JSON Canvas spec color preset ("1" to "6") or hex color to CSS color values.
 * Spec presets:
 * 1 = Red, 2 = Orange, 3 = Yellow, 4 = Green, 5 = Cyan, 6 = Purple.
 */
export function resolveCanvasColor(color: string | undefined): CanvasResolvedColor | null {
  if (!color || typeof color !== "string") return null;
  const trimmed = color.trim();
  switch (trimmed) {
    case "1":
      return { border: "rgb(239 68 68)", bg: "rgb(239 68 68 / 0.08)", accent: "rgb(239 68 68)" };
    case "2":
      return { border: "rgb(249 115 22)", bg: "rgb(249 115 22 / 0.08)", accent: "rgb(249 115 22)" };
    case "3":
      return { border: "rgb(234 179 8)", bg: "rgb(234 179 8 / 0.08)", accent: "rgb(234 179 8)" };
    case "4":
      return { border: "rgb(34 197 94)", bg: "rgb(34 197 94 / 0.08)", accent: "rgb(34 197 94)" };
    case "5":
      return { border: "rgb(6 182 212)", bg: "rgb(6 182 212 / 0.08)", accent: "rgb(6 182 212)" };
    case "6":
      return { border: "rgb(168 85 247)", bg: "rgb(168 85 247 / 0.08)", accent: "rgb(168 85 247)" };
    default:
      if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed)) {
        return {
          border: trimmed,
          bg: `${trimmed}15`,
          accent: trimmed,
        };
      }
      return null;
  }
}

export interface CanvasBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

/**
 * Calculates the bounding box enclosing all given nodes.
 */
export function computeCanvasBounds(nodes: readonly CanvasNode[], padding = 60): CanvasBounds {
  if (nodes.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: 800,
      maxY: 600,
      width: 800,
      height: 600,
    };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    if (node.x < minX) minX = node.x;
    if (node.y < minY) minY = node.y;
    const right = node.x + node.width;
    const bottom = node.y + node.height;
    if (right > maxX) maxX = right;
    if (bottom > maxY) maxY = bottom;
  }

  const paddedMinX = minX - padding;
  const paddedMinY = minY - padding;
  const paddedMaxX = maxX + padding;
  const paddedMaxY = maxY + padding;

  return {
    minX: paddedMinX,
    minY: paddedMinY,
    maxX: paddedMaxX,
    maxY: paddedMaxY,
    width: Math.max(paddedMaxX - paddedMinX, 100),
    height: Math.max(paddedMaxY - paddedMinY, 100),
  };
}

/**
 * Computes anchor coordinates for a specific side of a node.
 */
export function getNodeAnchorPoint(
  node: CanvasBaseNode,
  side: CanvasSide,
): { x: number; y: number } {
  switch (side) {
    case "top":
      return { x: node.x + node.width / 2, y: node.y };
    case "bottom":
      return { x: node.x + node.width / 2, y: node.y + node.height };
    case "left":
      return { x: node.x, y: node.y + node.height / 2 };
    case "right":
      return { x: node.x + node.width, y: node.y + node.height / 2 };
  }
}

/**
 * Infers natural anchor sides between two nodes when not specified in edge definition.
 */
export function inferNaturalSides(
  source: CanvasBaseNode,
  target: CanvasBaseNode,
): { fromSide: CanvasSide; toSide: CanvasSide } {
  const sourceCenterX = source.x + source.width / 2;
  const sourceCenterY = source.y + source.height / 2;
  const targetCenterX = target.x + target.width / 2;
  const targetCenterY = target.y + target.height / 2;

  const dx = targetCenterX - sourceCenterX;
  const dy = targetCenterY - sourceCenterY;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx > 0 ? { fromSide: "right", toSide: "left" } : { fromSide: "left", toSide: "right" };
  }
  return dy > 0 ? { fromSide: "bottom", toSide: "top" } : { fromSide: "top", toSide: "bottom" };
}

export interface EdgePathResult {
  path: string;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  labelPoint: { x: number; y: number };
}

/**
 * Calculates a smooth cubic bezier SVG path and center label position connecting two nodes.
 */
export function computeEdgePath(
  source: CanvasBaseNode,
  target: CanvasBaseNode,
  edge: CanvasEdge,
): EdgePathResult {
  const natural = inferNaturalSides(source, target);
  const fromSide = edge.fromSide ?? natural.fromSide;
  const toSide = edge.toSide ?? natural.toSide;

  const start = getNodeAnchorPoint(source, fromSide);
  const end = getNodeAnchorPoint(target, toSide);

  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  const dist = Math.sqrt(dx * dx + dy * dy);
  const offset = Math.max(Math.min(dist * 0.45, 160), 30);

  let cp1x = start.x;
  let cp1y = start.y;
  let cp2x = end.x;
  let cp2y = end.y;

  switch (fromSide) {
    case "right":
      cp1x += offset;
      break;
    case "left":
      cp1x -= offset;
      break;
    case "top":
      cp1y -= offset;
      break;
    case "bottom":
      cp1y += offset;
      break;
  }

  switch (toSide) {
    case "right":
      cp2x += offset;
      break;
    case "left":
      cp2x -= offset;
      break;
    case "top":
      cp2y -= offset;
      break;
    case "bottom":
      cp2y += offset;
      break;
  }

  // Cubic bezier midpoint approximation at t = 0.5:
  // B(0.5) = 0.125 * P0 + 0.375 * P1 + 0.375 * P2 + 0.125 * P3
  const midX = 0.125 * start.x + 0.375 * cp1x + 0.375 * cp2x + 0.125 * end.x;
  const midY = 0.125 * start.y + 0.375 * cp1y + 0.375 * cp2y + 0.125 * end.y;

  return {
    path: `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`,
    startPoint: start,
    endPoint: end,
    labelPoint: { x: midX, y: midY },
  };
}

/**
 * Calculates scale and translation offsets to fit canvas content snugly within a viewport.
 */
export function computeFitToView(
  bounds: CanvasBounds,
  viewport: { width: number; height: number },
  minScale = 0.15,
  maxScale = 1.75,
): { scale: number; panX: number; panY: number } {
  if (viewport.width <= 0 || viewport.height <= 0 || bounds.width <= 0 || bounds.height <= 0) {
    return { scale: 1, panX: 0, panY: 0 };
  }

  const scaleX = viewport.width / bounds.width;
  const scaleY = viewport.height / bounds.height;
  const rawScale = Math.min(scaleX, scaleY);
  const scale = Math.min(maxScale, Math.max(minScale, rawScale));

  const boundsCenterX = bounds.minX + bounds.width / 2;
  const boundsCenterY = bounds.minY + bounds.height / 2;

  const panX = viewport.width / 2 - boundsCenterX * scale;
  const panY = viewport.height / 2 - boundsCenterY * scale;

  return { scale, panX, panY };
}
