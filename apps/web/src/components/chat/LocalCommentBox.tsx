// FILE: LocalCommentBox.tsx
// Purpose: Inline comment editor anchored to a target in a read-only
//          preview surface — a file line or a slide shape.
// Layer: Chat preview interaction UI

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

import { MessageCircleIcon, XIcon } from "~/lib/icons";
import { FILE_COMMENT_TEXT_MAX_CHARS, normalizeFileCommentText } from "~/lib/fileComments";
import { Button } from "../ui/button";

interface LocalCommentBoxProps {
  // Pre-formatted target label, e.g. "line 12" or "slide 3 · Title 4".
  targetLabel: string;
  // CSS lengths, not just numbers: the editor surface anchors in pixels while the
  // slide annotator anchors in percentages of the rendered slide.
  top: CSSProperties["top"];
  left: CSSProperties["left"];
  width: CSSProperties["width"];
  onCancel: () => void;
  onSubmit: (text: string) => void;
}

export function LocalCommentBox(props: LocalCommentBoxProps) {
  const { onCancel, onSubmit } = props;
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus the field as soon as the box opens so the user can type immediately.
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const normalized = normalizeFileCommentText(value);
  const canSubmit = normalized.length > 0 && normalized.length <= FILE_COMMENT_TEXT_MAX_CHARS;

  const submit = () => {
    const text = normalizeFileCommentText(value);
    if (text.length === 0 || text.length > FILE_COMMENT_TEXT_MAX_CHARS) {
      return;
    }
    onSubmit(text);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
      return;
    }
    // Cmd/Ctrl+Enter commits; a bare Enter inserts a newline so multi-line
    // requests stay possible.
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      submit();
    }
  };

  const isMac =
    typeof navigator !== "undefined" && /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);

  return (
    <div
      className="local-comment__box"
      style={{ top: props.top, left: props.left, width: props.width }}
      // Keep clicks/selection inside the box from reaching the file surface
      // (context menu, selection toolbar, the gutter affordance).
      onMouseDown={(event) => event.stopPropagation()}
      onMouseUp={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
        <div className="flex min-w-0 items-center gap-1.5 text-ui-xs text-muted-foreground">
          <MessageCircleIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">
            Comment on <span className="font-medium text-foreground">{props.targetLabel}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          title="Close (Esc)"
          aria-label="Close"
        >
          <XIcon className="size-3" />
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Request change"
        rows={2}
        maxLength={FILE_COMMENT_TEXT_MAX_CHARS}
        className="local-comment__input"
      />

      <div className="flex items-center justify-between gap-2 pt-0.5">
        <span className="hidden text-ui-xs text-muted-foreground/60 sm:inline">
          <kbd className="rounded border border-border/60 bg-muted/30 px-1 py-0.5 font-mono text-ui-xs text-muted-foreground">
            {isMac ? "⌘↵" : "Ctrl+↵"}
          </kbd>{" "}
          to send
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onCancel}
            className="text-ui-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            size="xs"
            className="px-3 text-ui-xs font-medium shadow-sm"
            disabled={!canSubmit}
            onClick={submit}
          >
            Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
