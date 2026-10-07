// FILE: PptxAnnotationsSummaryChip.tsx
// Purpose: Renders the compact slide-comment count chip used in composer and user bubbles.
// Layer: Chat attachment presentation

import { pluralize } from "@synara/shared/text";

import { MessageCircleIcon } from "~/lib/icons";
import { formatPptxAnnotationLabel, type PptxAnnotationSelection } from "~/lib/pptxAnnotations";
import { AttachmentSummaryChip } from "./AttachmentSummaryChip";

interface PptxAnnotationChipEntry extends PptxAnnotationSelection {
  id?: string;
}

interface PptxAnnotationsSummaryChipProps {
  annotations: ReadonlyArray<PptxAnnotationChipEntry>;
  onRemove?: (() => void) | undefined;
}

export function PptxAnnotationsSummaryChip(props: PptxAnnotationsSummaryChipProps) {
  if (props.annotations.length === 0) {
    return null;
  }

  return (
    <AttachmentSummaryChip
      icon={MessageCircleIcon}
      label={`${props.annotations.length} ${pluralize(props.annotations.length, "slide comment")}`}
      removeLabel="Remove slide comments"
      onRemove={props.onRemove}
      tooltip={props.annotations.map((annotation, index) => (
        <div key={`${formatPptxAnnotationLabel(annotation)}:${index}`} className="space-y-0.5">
          <p className="text-ui-sm font-medium text-muted-foreground">
            {formatPptxAnnotationLabel(annotation)}
          </p>
          <p className="text-ui leading-relaxed">{annotation.comment}</p>
        </div>
      ))}
    />
  );
}
