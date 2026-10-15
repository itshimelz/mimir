// FILE: remarkAgentDirectives.ts
// Purpose: Remark plugin that parses AI agent directives (file citations, follow-up
//          suggestions, and general prompt suggestions) inside markdown text nodes
//          into custom AST elements for interactive rendering in the chat UI.
// Layer: Web chat presentation logic
// Exports: AST tag names, attribute constants, classification helpers, and remark plugin

export const AGENT_FILE_CITATION_TAG_NAME = "agent-file-citation";
export const AGENT_FILE_CITATION_PATH_ATTRIBUTE = "data-citation-path";
export const AGENT_FILE_CITATION_LABEL_ATTRIBUTE = "data-citation-label";
export const AGENT_FILE_CITATION_PURPOSE_ATTRIBUTE = "data-citation-purpose";
export const AGENT_FILE_CITATION_DESCRIPTION_ATTRIBUTE = "data-citation-description";

export const AGENT_FOLLOWUP_TAG_NAME = "agent-followup";
export const AGENT_FOLLOWUP_PROMPT_ATTRIBUTE = "data-followup-prompt";
export const AGENT_FOLLOWUP_LABEL_ATTRIBUTE = "data-followup-label";
export const AGENT_FOLLOWUP_ID_ATTRIBUTE = "data-followup-id";

export const AGENT_FOLLOWUP_LIST_CLASS_NAME = "agent-followup-list";
export const AGENT_FOLLOWUP_LIST_ITEM_CLASS_NAME = "agent-followup-list-item";

export type AgentDirectiveKind = "file-citation" | "followup" | "generic";

interface Point {
  line: number;
  column: number;
  offset?: number;
}

interface Position {
  start: Point;
  end: Point;
}

interface MdastNode {
  type: string;
  value?: string;
  position?: Position;
  children?: MdastNode[];
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
}

const SKIPPED_PARENT_TYPES = new Set([
  "code",
  "inlineCode",
  "link",
  "linkReference",
  "image",
  "imageReference",
  "definition",
]);

function advancePoint(start: Point, raw: string): Point {
  const lines = raw.split("\n");
  return {
    line: start.line + lines.length - 1,
    column: lines.length === 1 ? start.column + raw.length : lines[lines.length - 1]!.length + 1,
    offset: (start.offset ?? 0) + raw.length,
  };
}

/**
 * Parses directive attribute strings like:
 * path="/path/to/file.pdf" purpose="output"
 * prompt='Tell me more'
 */
export function parseDirectiveAttributes(raw: string | undefined): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (!raw || raw.trim().length === 0) return attrs;

  const pattern = /([a-zA-Z0-9_-]+)(?:=(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|([^\s}]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(raw)) !== null) {
    const key = match[1]!;
    const val = match[2] ?? match[3] ?? match[4];
    if (val !== undefined) {
      attrs[key] = val.replace(/\\(["'\\])/g, "$1");
    } else {
      attrs[key] = "true";
    }
  }
  return attrs;
}

/**
 * Classifies a directive name and its attributes into standard agent interaction kinds:
 * file-citation, followup suggestion, or generic.
 */
export function classifyAgentDirective(
  name: string,
  attrs: Record<string, string>,
): AgentDirectiveKind {
  const lower = name.toLowerCase();
  if (
    /(?:^|-)(?:file-citation|citation)$/.test(lower) ||
    (/(?:^|-)file$/.test(lower) && Boolean(attrs.path || attrs.file || attrs.src || attrs.href))
  ) {
    return "file-citation";
  }
  if (/(?:^|-)(?:follow-?up|suggest(?:ion)?|prompt|quick-action)$/.test(lower)) {
    return "followup";
  }
  return "generic";
}

function fileCitationToNode(
  path: string,
  label: string | undefined,
  purpose: string | undefined,
  description: string | undefined,
  position?: Position,
): MdastNode {
  return {
    type: "agentFileCitation",
    data: {
      hName: AGENT_FILE_CITATION_TAG_NAME,
      hProperties: {
        [AGENT_FILE_CITATION_PATH_ATTRIBUTE]: path,
        ...(label ? { [AGENT_FILE_CITATION_LABEL_ATTRIBUTE]: label } : {}),
        ...(purpose ? { [AGENT_FILE_CITATION_PURPOSE_ATTRIBUTE]: purpose } : {}),
        ...(description ? { [AGENT_FILE_CITATION_DESCRIPTION_ATTRIBUTE]: description } : {}),
      },
    },
    ...(position ? { position } : {}),
    children: [],
  };
}

function followupToNode(
  prompt: string,
  label: string,
  id: string | undefined,
  position?: Position,
): MdastNode {
  return {
    type: "agentFollowup",
    data: {
      hName: AGENT_FOLLOWUP_TAG_NAME,
      hProperties: {
        [AGENT_FOLLOWUP_PROMPT_ATTRIBUTE]: prompt,
        [AGENT_FOLLOWUP_LABEL_ATTRIBUTE]: label,
        ...(id ? { [AGENT_FOLLOWUP_ID_ATTRIBUTE]: id } : {}),
      },
    },
    ...(position ? { position } : {}),
    children: [],
  };
}

export interface AgentFollowupItem {
  id?: string;
  label: string;
  prompt: string;
}

export interface RemarkAgentDirectivesOptions {
  /**
   * When true (default), strips follow-up suggestions from the markdown text
   * so they are not rendered inside the assistant message body.
   */
  stripFollowups?: boolean;
}

const DIRECTIVE_REGEX =
  /(?:(^|\n)[ \t]*[•\-*][ \t]*)?(?<!\w)(:{1,3})([a-zA-Z0-9_-]+)(?:\[([^\]\n]*)\]\{((?:[^{}\n"]|"(?:\\.|[^"\n\\])*"|'(?:\\.|[^'\n\\])*')*)\}|\[([^\]\n]*)\]|\{((?:[^{}\n"]|"(?:\\.|[^"\n\\])*"|'(?:\\.|[^'\n\\])*')*)\})/g;

/**
 * Extracts all follow-up suggestions from raw markdown text for presentation
 * near the prompt composer.
 */
export function extractAgentFollowups(text: string): AgentFollowupItem[] {
  if (!text || !text.includes(":")) {
    return [];
  }
  const followups: AgentFollowupItem[] = [];
  DIRECTIVE_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = DIRECTIVE_REGEX.exec(text)) !== null) {
    const name = match[3]!;
    const labelInBracketWithAttrs = match[4];
    const attrsWithBracket = match[5];
    const labelOnly = match[6];
    const attrsOnly = match[7];

    const rawLabel = labelInBracketWithAttrs ?? labelOnly;
    const rawAttrs = attrsWithBracket ?? attrsOnly;
    const attrs = parseDirectiveAttributes(rawAttrs);

    const kind = classifyAgentDirective(name, attrs);
    if (kind === "followup") {
      const label = rawLabel || attrs.label || attrs.title || attrs.prompt || "";
      const prompt = attrs.prompt ?? attrs.text ?? rawLabel ?? "";
      const id = attrs.id;
      if (prompt || label) {
        followups.push({
          ...(id ? { id } : {}),
          label: label || prompt,
          prompt: prompt || label,
        });
      }
    }
  }
  return followups;
}

export function splitTextWithAgentDirectives(
  nodeOrValue: MdastNode | string,
  options?: RemarkAgentDirectivesOptions,
): MdastNode[] {
  const isNode = typeof nodeOrValue === "object" && nodeOrValue !== null;
  const value = isNode ? (nodeOrValue.value ?? "") : nodeOrValue;
  const initialPosition = isNode ? nodeOrValue.position : undefined;

  if (value.length === 0 || !value.includes(":")) {
    return isNode ? [nodeOrValue] : [{ type: "text", value }];
  }

  const nodes: MdastNode[] = [];
  let cursor = 0;
  let currentPoint = initialPosition?.start;
  DIRECTIVE_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = DIRECTIVE_REGEX.exec(value)) !== null) {
    const fullMatch = match[0];
    const matchIndex = match.index;
    const leadingNewline = match[1];
    const name = match[3]!;
    const labelInBracketWithAttrs = match[4];
    const attrsWithBracket = match[5];
    const labelOnly = match[6];
    const attrsOnly = match[7];

    const rawLabel = labelInBracketWithAttrs ?? labelOnly;
    const rawAttrs = attrsWithBracket ?? attrsOnly;
    const attrs = parseDirectiveAttributes(rawAttrs);

    const kind = classifyAgentDirective(name, attrs);
    if (kind === "generic") {
      continue;
    }

    // Append preceding plain text
    const textBefore = value.slice(cursor, matchIndex);
    if (textBefore.length > 0) {
      const nextPoint = currentPoint ? advancePoint(currentPoint, textBefore) : undefined;
      nodes.push({
        type: "text",
        value: textBefore,
        ...(currentPoint && nextPoint ? { position: { start: currentPoint, end: nextPoint } } : {}),
      });
      currentPoint = nextPoint;
    } else if (leadingNewline) {
      const nextPoint = currentPoint ? advancePoint(currentPoint, "\n") : undefined;
      nodes.push({
        type: "text",
        value: "\n",
        ...(currentPoint && nextPoint ? { position: { start: currentPoint, end: nextPoint } } : {}),
      });
      currentPoint = nextPoint;
    }

    const directiveEndIndex = matchIndex + fullMatch.length;
    const matchedText = value.slice(matchIndex, directiveEndIndex);
    const directiveEndPoint = currentPoint ? advancePoint(currentPoint, matchedText) : undefined;
    const directivePosition =
      currentPoint && directiveEndPoint
        ? { start: currentPoint, end: directiveEndPoint }
        : undefined;

    const stripFollowups = options?.stripFollowups !== false;
    if (kind === "file-citation") {
      const path = attrs.path ?? attrs.file ?? attrs.src ?? attrs.href ?? rawLabel ?? "";
      const label = rawLabel || attrs.label || attrs.title;
      const purpose = attrs.purpose;
      const description = attrs.description;
      nodes.push(fileCitationToNode(path, label, purpose, description, directivePosition));
    } else if (kind === "followup") {
      if (!stripFollowups) {
        const label = rawLabel || attrs.label || attrs.title || attrs.prompt || "";
        const prompt = attrs.prompt ?? attrs.text ?? rawLabel ?? "";
        const id = attrs.id;
        nodes.push(followupToNode(prompt, label, id, directivePosition));
      }
    }

    currentPoint = directiveEndPoint;
    cursor = directiveEndIndex;
  }

  if (cursor === 0) {
    return isNode ? [nodeOrValue] : [{ type: "text", value }];
  }

  if (cursor < value.length) {
    const remainingText = value.slice(cursor);
    const endPoint = currentPoint ? advancePoint(currentPoint, remainingText) : undefined;
    nodes.push({
      type: "text",
      value: remainingText,
      ...(currentPoint && endPoint ? { position: { start: currentPoint, end: endPoint } } : {}),
    });
  }

  return nodes;
}

function isWhitespaceOnlyText(node: MdastNode): boolean {
  return node.type === "text" && (!node.value || node.value.trim().length === 0);
}

function markFollowupListIfAllFollowups(listNode: MdastNode): void {
  if (listNode.type !== "list" || !Array.isArray(listNode.children)) return;

  const items = listNode.children.filter((child) => child.type === "listItem");
  if (items.length === 0) return;

  const isAllFollowups = items.every((item) => {
    if (!Array.isArray(item.children)) return false;
    const significantBlocks = item.children.filter(
      (block) => block.type !== "text" || !isWhitespaceOnlyText(block),
    );
    if (significantBlocks.length !== 1) return false;

    const block = significantBlocks[0]!;
    if (block.type === "agentFollowup") return true;
    if (block.type === "paragraph" && Array.isArray(block.children)) {
      const inlineChildren = block.children.filter((c) => !isWhitespaceOnlyText(c));
      return inlineChildren.length === 1 && inlineChildren[0]?.type === "agentFollowup";
    }
    return false;
  });

  if (isAllFollowups) {
    listNode.data = {
      ...listNode.data,
      hProperties: {
        ...listNode.data?.hProperties,
        className: AGENT_FOLLOWUP_LIST_CLASS_NAME,
      },
    };
    for (const item of items) {
      item.data = {
        ...item.data,
        hProperties: {
          ...item.data?.hProperties,
          className: AGENT_FOLLOWUP_LIST_ITEM_CLASS_NAME,
        },
      };
    }
  }
}

function isNonEmptyMdastNode(child: MdastNode): boolean {
  if (child.type === "text") {
    return Boolean(child.value && child.value.trim().length > 0);
  }
  if (child.type === "agentFileCitation" || child.type === "agentFollowup") {
    return true;
  }
  if (Array.isArray(child.children)) {
    return child.children.some(isNonEmptyMdastNode);
  }
  return true;
}

export function remarkAgentDirectives(options?: RemarkAgentDirectivesOptions) {
  const stripFollowups = options?.stripFollowups !== false;

  return (tree: MdastNode) => {
    const visit = (node: MdastNode): void => {
      if (!Array.isArray(node.children) || node.children.length === 0) {
        return;
      }

      let changed = false;
      const nextChildren: MdastNode[] = [];

      for (const child of node.children) {
        if (child.type === "text") {
          const replacements = splitTextWithAgentDirectives(child, options);
          if (replacements.length !== 1 || replacements[0] !== child) {
            changed = true;
          }
          nextChildren.push(...replacements);
          continue;
        }

        if (!SKIPPED_PARENT_TYPES.has(child.type)) {
          visit(child);
        }

        if (stripFollowups) {
          if (
            (child.type === "paragraph" || child.type === "listItem" || child.type === "list") &&
            !isNonEmptyMdastNode(child)
          ) {
            changed = true;
            continue;
          }
        }

        nextChildren.push(child);
      }

      if (changed) {
        node.children = nextChildren;
      }

      if (!stripFollowups && node.type === "list") {
        markFollowupListIfAllFollowups(node);
      }
    };

    visit(tree);
  };
}
