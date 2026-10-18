// FILE: MermaidBlock.tsx
// Purpose: Renders Mermaid diagrams using Pele (fast, lightweight SVG renderer)
//          with interactive view toggling (diagram vs raw code) and copy controls.
// Layer: Web chat presentation component
// Exports: MermaidBlock

import { render } from "pele";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import {
  CheckIcon,
  CodeIcon,
  CopyIcon,
  EyeIcon,
  TextWrapIcon,
  TriangleAlertIcon,
  WorkflowIcon,
} from "~/lib/icons";
import { cn } from "~/lib/utils";
import { copyTextToClipboard } from "../../hooks/useCopyToClipboard";
import type { CodeFenceInfo } from "../../lib/codeFence";
import { IconButton } from "../ui/icon-button";

export interface MermaidBlockProps {
  readonly code: string;
  readonly fence: CodeFenceInfo;
  readonly isStreaming?: boolean;
  readonly direction?: "ltr" | undefined;
  readonly children: ReactNode;
}

export function MermaidBlock({
  code,
  fence,
  isStreaming = false,
  direction,
  children,
}: MermaidBlockProps) {
  const [viewMode, setViewMode] = useState<"diagram" | "code">("diagram");
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copiedTimerRef.current !== null) {
        clearTimeout(copiedTimerRef.current);
        copiedTimerRef.current = null;
      }
    },
    [],
  );

  const { svg, error, diagramType } = useMemo(() => {
    const trimmed = code.trim();
    if (!trimmed) {
      return { svg: null, error: null, diagramType: null };
    }
    try {
      const result = render(trimmed, {
        responsive: true,
        linkRel: "noopener noreferrer",
      });
      return {
        svg: result.svg,
        error: null,
        diagramType: result.type,
      };
    } catch (err) {
      return {
        svg: null,
        error: err instanceof Error ? err.message : String(err),
        diagramType: null,
      };
    }
  }, [code]);

  const handleCopy = () => {
    void copyTextToClipboard(code)
      .then(() => {
        if (copiedTimerRef.current !== null) {
          clearTimeout(copiedTimerRef.current);
        }
        setCopied(true);
        copiedTimerRef.current = setTimeout(() => {
          setCopied(false);
          copiedTimerRef.current = null;
        }, 1200);
      })
      .catch(() => undefined);
  };

  const hasDiagram = svg !== null;
  // If rendering fails while streaming, display the code block smoothly without error flashes.
  // When streaming is done and there's a syntax error, show the code with an error notification.
  const showDiagram = viewMode === "diagram" && hasDiagram;
  const showErrorBanner = !isStreaming && error !== null;

  const displayTitle = fence.fileName ?? "Mermaid";
  const displaySubtitle = diagramType ?? (fence.fileName ? null : "diagram");

  return (
    <div
      className="chat-markdown-mermaid chat-markdown-codeblock"
      data-view-mode={showDiagram ? "diagram" : "code"}
      data-wrap={wrap ? "true" : "false"}
      dir={direction}
    >
      <div className="chat-markdown-mermaid__header chat-markdown-codeblock__header">
        <div className="chat-markdown-mermaid__title">
          <WorkflowIcon className="size-3.5 text-muted-foreground flex-shrink-0" />
          <span className="font-medium text-foreground">{displayTitle}</span>
          {displaySubtitle && (
            <span className="text-muted-foreground text-ui-xs opacity-75 font-normal">
              ({displaySubtitle})
            </span>
          )}
        </div>

        <div className="chat-markdown-mermaid__actions chat-markdown-codeblock__actions">
          {hasDiagram && (
            <div className="chat-markdown-mermaid__view-toggle" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={showDiagram}
                data-active={showDiagram ? "true" : "false"}
                className="chat-markdown-mermaid__view-button"
                onClick={() => setViewMode("diagram")}
                title="View diagram"
              >
                <EyeIcon className="size-3" />
                <span>Diagram</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!showDiagram}
                data-active={!showDiagram ? "true" : "false"}
                className="chat-markdown-mermaid__view-button"
                onClick={() => setViewMode("code")}
                title="View Mermaid source code"
              >
                <CodeIcon className="size-3" />
                <span>Code</span>
              </button>
            </div>
          )}

          {!showDiagram && (
            <IconButton
              className="chat-markdown-codeblock__action"
              onClick={() => setWrap((prev) => !prev)}
              title={wrap ? "Disable soft wrap" : "Enable soft wrap"}
              label={wrap ? "Disable soft wrap" : "Enable soft wrap"}
              aria-pressed={wrap}
              data-active={wrap ? "true" : "false"}
              size="icon-xs"
              variant="ghost"
            >
              <TextWrapIcon className="size-3" />
            </IconButton>
          )}

          <IconButton
            className="chat-markdown-codeblock__action"
            onClick={handleCopy}
            title={copied ? "Copied" : "Copy Mermaid code"}
            label={copied ? "Copied" : "Copy Mermaid code"}
            size="icon-xs"
            variant="ghost"
          >
            {copied ? <CheckIcon className="size-3" /> : <CopyIcon className="size-3" />}
          </IconButton>
        </div>
      </div>

      {showErrorBanner && (
        <div className="chat-markdown-mermaid__error text-ui-xs">
          <TriangleAlertIcon className="size-3.5 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="font-medium">Mermaid Syntax Error:</span>{" "}
            <span className="opacity-90">{error}</span>
          </div>
        </div>
      )}

      {showDiagram ? (
        <div className="chat-markdown-mermaid__diagram-container">
          <div
            className="chat-markdown-mermaid__svg-wrapper"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      ) : (
        <div className="chat-markdown-codeblock__body">{children}</div>
      )}
    </div>
  );
}
