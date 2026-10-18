import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MermaidBlock } from "./MermaidBlock";
import type { CodeFenceInfo } from "../../lib/codeFence";

function createFence(overrides: Partial<CodeFenceInfo> = {}): CodeFenceInfo {
  return {
    language: "mermaid",
    isFileReference: false,
    filePath: null,
    fileName: null,
    directory: null,
    lineRange: null,
    ...overrides,
  };
}

describe("MermaidBlock", () => {
  it("renders a valid Mermaid flowchart into an SVG with Pele classes", () => {
    const code = "flowchart TD\n    A[Start] --> B[Finish]";
    const fence = createFence();
    const html = renderToStaticMarkup(
      <MermaidBlock code={code} fence={fence} isStreaming={false}>
        <pre>
          <code>{code}</code>
        </pre>
      </MermaidBlock>,
    );

    expect(html).toContain("chat-markdown-mermaid");
    expect(html).toContain("pele pele-flowchart");
    expect(html).toContain("<svg");
    expect(html).toContain("Start");
    expect(html).toContain("Finish");
    expect(html).toContain("(flowchart)");
  });

  it("renders a sequence diagram with the detected type label", () => {
    const code = "sequenceDiagram\n    Alice->>Bob: Hello Bob";
    const fence = createFence();
    const html = renderToStaticMarkup(
      <MermaidBlock code={code} fence={fence} isStreaming={false}>
        <pre>
          <code>{code}</code>
        </pre>
      </MermaidBlock>,
    );

    expect(html).toContain("pele pele-sequence");
    expect(html).toContain("Alice");
    expect(html).toContain("Bob");
    expect(html).toContain("(sequence)");
  });

  it("handles syntax errors gracefully when not streaming by showing the error banner and fallback", () => {
    const brokenCode = "flowchart TD\n    A -->";
    const fence = createFence();
    const html = renderToStaticMarkup(
      <MermaidBlock code={brokenCode} fence={fence} isStreaming={false}>
        <pre className="code-fallback">
          <code>{brokenCode}</code>
        </pre>
      </MermaidBlock>,
    );

    expect(html).toContain("chat-markdown-mermaid__error");
    expect(html).toContain("Mermaid Syntax Error:");
    expect(html).toContain("code-fallback");
  });

  it("suppresses the error banner while streaming so in-progress diagrams stream smoothly", () => {
    const partialCode = "flowchart TD\n    A -->";
    const fence = createFence();
    const html = renderToStaticMarkup(
      <MermaidBlock code={partialCode} fence={fence} isStreaming={true}>
        <pre className="code-fallback">
          <code>{partialCode}</code>
        </pre>
      </MermaidBlock>,
    );

    expect(html).not.toContain("chat-markdown-mermaid__error");
    expect(html).toContain("code-fallback");
  });

  it("uses custom file name as title when the fence represents a file reference", () => {
    const code = "graph TD\n    X --> Y";
    const fence = createFence({
      isFileReference: true,
      filePath: "src/diagram.mmd",
      fileName: "diagram.mmd",
    });
    const html = renderToStaticMarkup(
      <MermaidBlock code={code} fence={fence} isStreaming={false}>
        <pre>
          <code>{code}</code>
        </pre>
      </MermaidBlock>,
    );

    expect(html).toContain("diagram.mmd");
    expect(html).toContain("(flowchart)");
  });
});
