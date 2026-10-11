// FILE: CanvasNodeCard.tsx
// Purpose: Renders a single node card in the JSON Canvas view:
//          - "group" nodes as grouped backdrop regions with label headers
//          - "text" nodes with markdown formatting and scrollable body
//          - "link" nodes with URL and external link launcher
//          - "file" nodes with file badge and path reference
// Layer: Web canvas node presentation component
// Exports: CanvasNodeCard

import { memo } from "react";

import { ArrowUpRightIcon, FileIcon, GlobeIcon } from "~/lib/icons";
import { resolveCanvasColor, type CanvasGroupNode, type CanvasNode } from "~/lib/canvas/jsonCanvas";
import { cn } from "~/lib/utils";
import ChatMarkdown from "../ChatMarkdown";

interface CanvasNodeCardProps {
  node: CanvasNode;
}

export const CanvasNodeCard = memo(function CanvasNodeCard({ node }: CanvasNodeCardProps) {
  const color = resolveCanvasColor(node.color);

  const style: React.CSSProperties = {
    position: "absolute",
    left: `${node.x}px`,
    top: `${node.y}px`,
    width: `${node.width}px`,
    height: `${node.height}px`,
  };

  if (node.type === "group") {
    return <CanvasGroupCard node={node} color={color} style={style} />;
  }

  const borderStyle = color ? { borderColor: color.border, backgroundColor: color.bg } : undefined;

  return (
    <div
      style={{ ...style, ...borderStyle }}
      className={cn(
        "group absolute z-10 flex flex-col rounded-xl border bg-card/95 text-card-foreground shadow-md backdrop-blur-xs transition-shadow hover:shadow-lg",
        color ? "" : "border-border/80 hover:border-border",
      )}
    >
      {node.type === "text" && (
        <div className="flex h-full flex-col overflow-hidden p-3.5">
          <div className="min-h-0 flex-1 overflow-auto">
            <ChatMarkdown cwd={undefined} text={node.text} className="text-ui leading-relaxed" />
          </div>
        </div>
      )}

      {node.type === "link" && (
        <div className="flex h-full flex-col justify-between p-3.5">
          <div className="flex items-center gap-2">
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
              aria-hidden="true"
            >
              <GlobeIcon className="size-4" />
            </span>
            <span className="truncate text-ui font-medium text-foreground" title={node.url}>
              {node.url}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <a
              href={node.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-ui-sm font-medium text-primary hover:bg-primary/10"
              onClick={(e) => e.stopPropagation()}
            >
              <span>Visit Link</span>
              <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      )}

      {node.type === "file" && (
        <div className="flex h-full flex-col justify-between p-3.5">
          <div className="flex items-start gap-2">
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
              aria-hidden="true"
            >
              <FileIcon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <span
                className="block truncate text-ui font-medium text-foreground"
                title={node.file}
              >
                {node.file}
              </span>
              {node.subpath ? (
                <span
                  className="block truncate text-ui-xs text-muted-foreground"
                  title={node.subpath}
                >
                  {node.subpath}
                </span>
              ) : null}
            </div>
          </div>

          <div className="pt-2">
            <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-ui-xs font-mono text-muted-foreground">
              Workspace File
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

function CanvasGroupCard({
  node,
  color,
  style,
}: {
  node: CanvasGroupNode;
  color: ReturnType<typeof resolveCanvasColor>;
  style: React.CSSProperties;
}) {
  const groupBorderStyle: React.CSSProperties = {
    ...style,
    borderColor: color?.border ?? "var(--border)",
    backgroundColor: color?.bg ?? "rgb(var(--foreground-rgb) / 0.02)",
  };

  return (
    <div
      style={groupBorderStyle}
      className="pointer-events-none absolute z-0 rounded-2xl border-2 border-dashed transition-all"
    >
      {node.label ? (
        <div className="absolute -top-3.5 left-4 pointer-events-auto">
          <span
            className="inline-flex items-center rounded-md border border-border/80 bg-background/90 px-2 py-0.5 text-ui-sm font-medium text-foreground shadow-xs backdrop-blur-xs"
            style={color ? { borderColor: color.border } : undefined}
          >
            {node.label}
          </span>
        </div>
      ) : null}
    </div>
  );
}
