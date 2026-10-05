"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";

import { cn } from "~/lib/utils";

// M3 puts form labels on on-surface. Height and type stay on the app's `text-ui` scale
// (AGENTS.md). M3 also dims a disabled label to 38% of that ink; nothing in the app
// groups a Label with its field as peers yet, so there is no disabled signal to hang it
// on and the variant would be unreachable. It lands with the form-field group.
function Label({ className, render, ...props }: useRender.ComponentProps<"label">) {
  const defaultProps = {
    className: cn(
      "inline-flex items-center gap-2 text-ui leading-4.5 text-m3-on-surface select-none sm:text-ui sm:leading-4 font-medium",
      className,
    ),
    "data-slot": "label",
  };

  return useRender({
    defaultTagName: "label",
    props: mergeProps<"label">(defaultProps, props),
    render,
  });
}

export { Label };
