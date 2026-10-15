// FILE: LocalCommentBox.tsx
// Purpose: Inline "Local comment" editor anchored to a target in a read-only
//          preview surface — a file line today, a slide shape next. Mirrors
//          Codex's comment box: a Synara badge header, the target label, a
//          borderless request field, and Cancel/Comment actions (Comment stays
//          disabled until non-empty text).
// Layer: Chat preview interaction UI

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

import { FILE_COMMENT_TEXT_MAX_CHARS, normalizeFileCommentText } from "~/lib/fileComments";
import { SynaraLogo } from "../SynaraLogo";
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
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-ui-lg font-semibold text-[var(--color-text-foreground)]">
          <span className="local-comment__badge">
            <SynaraLogo className="size-3 text-[var(--color-text-foreground-secondary)]" />
          </span>
          Local comment
        </span>
        <span className="text-ui text-muted-foreground">Comment on {props.targetLabel}</span>
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
      <div className="flex items-center justify-end gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          className="px-3.5"
          disabled={!canSubmit}
          onClick={submit}
        >
          Comment
        </Button>
      </div>
    </div>
  );
}
