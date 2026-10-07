"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";

import { cn } from "~/lib/utils";

// Box + fill skins, shared with the menu's checkbox rows (`MenuCheckboxItem variant="checkbox"`).
export const CHECKBOX_BOX_CLASS_NAME =
  "relative inline-flex size-4.5 shrink-0 items-center justify-center rounded-xs border border-border bg-background outline-none transition-colors motion-spatial-fast focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background aria-invalid:border-destructive/60 focus-visible:aria-invalid:border-destructive focus-visible:aria-invalid:ring-destructive/48 data-disabled:opacity-64 sm:size-4 dark:not-data-checked:bg-input/32 dark:aria-invalid:ring-destructive/24";
export const CHECKBOX_INDICATOR_CLASS_NAME =
  "-inset-px absolute flex items-center justify-center rounded-xs text-primary-foreground transition-all motion-spatial-fast data-unchecked:hidden data-checked:bg-primary data-indeterminate:text-foreground";

export function CheckboxCheckGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-3.5 sm:size-3", className)}
      fill="none"
      height="24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="3"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
    </svg>
  );
}

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      className={cn(CHECKBOX_BOX_CLASS_NAME, className)}
      data-slot="checkbox"
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={CHECKBOX_INDICATOR_CLASS_NAME}
        data-slot="checkbox-indicator"
        render={(props, state) => (
          <span {...props}>
            {state.indeterminate ? (
              <svg
                className="size-3.5 sm:size-3"
                fill="none"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M5.252 12h13.496" />
              </svg>
            ) : (
              <CheckboxCheckGlyph />
            )}
          </span>
        )}
      />
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
