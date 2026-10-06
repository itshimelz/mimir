import { describe, expect, it } from "vitest";
import {
  AGENT_FILE_CITATION_PATH_ATTRIBUTE,
  AGENT_FILE_CITATION_PURPOSE_ATTRIBUTE,
  AGENT_FILE_CITATION_TAG_NAME,
  AGENT_FOLLOWUP_LIST_CLASS_NAME,
  AGENT_FOLLOWUP_LIST_ITEM_CLASS_NAME,
  AGENT_FOLLOWUP_PROMPT_ATTRIBUTE,
  AGENT_FOLLOWUP_TAG_NAME,
  classifyAgentDirective,
  extractAgentFollowups,
  parseDirectiveAttributes,
  remarkAgentDirectives,
  splitTextWithAgentDirectives,
} from "./remarkAgentDirectives";

describe("parseDirectiveAttributes", () => {
  it("parses double-quoted attributes", () => {
    const attrs = parseDirectiveAttributes('path="/home/user/document.pdf" purpose="output"');
    expect(attrs).toEqual({
      path: "/home/user/document.pdf",
      purpose: "output",
    });
  });

  it("parses single-quoted and unquoted attributes", () => {
    const attrs = parseDirectiveAttributes("path='test.ts' flag=true");
    expect(attrs).toEqual({
      path: "test.ts",
      flag: "true",
    });
  });

  it("handles prompt attributes with spaces and punctuation", () => {
    const attrs = parseDirectiveAttributes(
      'prompt="Turn the primer into a design checklist tailored to Mimir\'s workspace."',
    );
    expect(attrs).toEqual({
      prompt: "Turn the primer into a design checklist tailored to Mimir's workspace.",
    });
  });
});

describe("classifyAgentDirective", () => {
  it("identifies file citations from various agent formats", () => {
    expect(classifyAgentDirective("codex-file-citation", {})).toBe("file-citation");
    expect(classifyAgentDirective("file-citation", {})).toBe("file-citation");
    expect(classifyAgentDirective("citation", {})).toBe("file-citation");
    expect(classifyAgentDirective("file", { path: "foo.pdf" })).toBe("file-citation");
  });

  it("identifies follow-up suggestions from various agent formats", () => {
    expect(classifyAgentDirective("codex-followup", {})).toBe("followup");
    expect(classifyAgentDirective("followup", {})).toBe("followup");
    expect(classifyAgentDirective("follow-up", {})).toBe("followup");
    expect(classifyAgentDirective("suggest", {})).toBe("followup");
    expect(classifyAgentDirective("suggestion", {})).toBe("followup");
    expect(classifyAgentDirective("prompt", {})).toBe("followup");
  });

  it("returns generic for unknown directives", () => {
    expect(classifyAgentDirective("custom-unknown", {})).toBe("generic");
  });
});

describe("splitTextWithAgentDirectives", () => {
  it("splits file citation directive", () => {
    const nodes = splitTextWithAgentDirectives(
      ':codex-file-citation{path="/home/itshimelz/Outbox/primer.pdf" purpose="output"}',
    );
    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.data?.hName).toBe(AGENT_FILE_CITATION_TAG_NAME);
    expect(nodes[0]?.data?.hProperties?.[AGENT_FILE_CITATION_PATH_ATTRIBUTE]).toBe(
      "/home/itshimelz/Outbox/primer.pdf",
    );
    expect(nodes[0]?.data?.hProperties?.[AGENT_FILE_CITATION_PURPOSE_ATTRIBUTE]).toBe("output");
  });

  it("splits followup suggestion directive when stripFollowups is false", () => {
    const nodes = splitTextWithAgentDirectives(
      ':codex-followup[Make a checklist]{prompt="Turn primer into checklist"}',
      { stripFollowups: false },
    );
    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.data?.hName).toBe(AGENT_FOLLOWUP_TAG_NAME);
    expect(nodes[0]?.data?.hProperties?.[AGENT_FOLLOWUP_PROMPT_ATTRIBUTE]).toBe(
      "Turn primer into checklist",
    );
  });

  it("strips followup suggestion directive by default", () => {
    const nodes = splitTextWithAgentDirectives(
      ':codex-followup[Make a checklist]{prompt="Turn primer into checklist"}',
    );
    expect(nodes).toHaveLength(0);
  });

  it("absorbs leading bullet markers before follow-up directive when stripFollowups is false", () => {
    const nodes = splitTextWithAgentDirectives(
      '• :codex-followup[Make a checklist]{prompt="Turn primer into checklist"}',
      { stripFollowups: false },
    );
    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.data?.hName).toBe(AGENT_FOLLOWUP_TAG_NAME);
  });

  it("keeps surrounding prose intact while stripping followup", () => {
    const nodes = splitTextWithAgentDirectives(
      'Created file :file-citation{path="guide.pdf"} for review. :codex-followup[Next]{prompt="Go"}',
    );
    expect(nodes).toHaveLength(3);
    expect(nodes[0]).toEqual({ type: "text", value: "Created file " });
    expect(nodes[1]?.data?.hName).toBe(AGENT_FILE_CITATION_TAG_NAME);
    expect(nodes[2]).toEqual({ type: "text", value: " for review. " });
  });
});

describe("extractAgentFollowups", () => {
  it("extracts follow-up suggestions from raw directive text", () => {
    const text = [
      "Here is the primer.",
      ':codex-file-citation{path="/home/user/doc.pdf" purpose="output"}',
      '- :codex-followup[Make a Mimir-specific design checklist]{prompt="Create design checklist"}',
      '- :codex-followup[Create a matching UI mockup]{prompt="Create mockup"}',
      '• :followup[Make a short presentation]{prompt="Create presentation"}',
    ].join("\n");

    const followups = extractAgentFollowups(text);
    expect(followups).toEqual([
      {
        label: "Make a Mimir-specific design checklist",
        prompt: "Create design checklist",
      },
      {
        label: "Create a matching UI mockup",
        prompt: "Create mockup",
      },
      {
        label: "Make a short presentation",
        prompt: "Create presentation",
      },
    ]);
  });
});

describe("remarkAgentDirectives AST transformation", () => {
  it("strips lists containing only followups by default", () => {
    const tree: any = {
      type: "root",
      children: [
        {
          type: "list",
          children: [
            {
              type: "listItem",
              children: [
                {
                  type: "paragraph",
                  children: [
                    {
                      type: "text",
                      value: ':codex-followup[First action]{prompt="Action 1"}',
                    },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              children: [
                {
                  type: "paragraph",
                  children: [
                    {
                      type: "text",
                      value: ':codex-followup[Second action]{prompt="Action 2"}',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const plugin = remarkAgentDirectives();
    plugin(tree);

    expect(tree.children).toHaveLength(0);
  });

  it("transforms AST text nodes and tags list of followups when stripFollowups is false", () => {
    const tree: any = {
      type: "root",
      children: [
        {
          type: "list",
          children: [
            {
              type: "listItem",
              children: [
                {
                  type: "paragraph",
                  children: [
                    {
                      type: "text",
                      value: ':codex-followup[First action]{prompt="Action 1"}',
                    },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              children: [
                {
                  type: "paragraph",
                  children: [
                    {
                      type: "text",
                      value: ':codex-followup[Second action]{prompt="Action 2"}',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const plugin = remarkAgentDirectives({ stripFollowups: false });
    plugin(tree);

    const listNode = tree.children[0];
    expect(listNode.data?.hProperties?.className).toBe(AGENT_FOLLOWUP_LIST_CLASS_NAME);
    expect(listNode.children[0].data?.hProperties?.className).toBe(
      AGENT_FOLLOWUP_LIST_ITEM_CLASS_NAME,
    );
    expect(listNode.children[0].children[0].children[0].type).toBe("agentFollowup");
  });
});
