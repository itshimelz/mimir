"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";

import { cn } from "~/lib/utils";

// Box + fill skins, shared with the menu's checkbox rows (`MenuCheckboxItem variant="checkbox"`).
// M3 checkbox: the box is `surface-container-lowest` bordered in `outline`, and the
// selected fill is the `primary` role rather than a small square inside a larger box.
export const CHECKBOX_BOX_CLASS_NAME =
  "relative inline-flex size-4.5 shrink-0 items-center justify-center rounded-xs border border-m3-outline bg-m3-surface-container-lowest outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--md-sys-color-secondary)] aria-invalid:border-m3-error/36 focus-visible:aria-invalid:border-m3-error data-disabled:opacity-64 data-disabled:border-m3-on-surface/12 sm:size-4";
export const CHECKBOX_INDICATOR_CLASS_NAME =
  "-inset-px absolute flex items-center justify-center rounded-xs text-m3-on-primary data-unchecked:hidden data-checked:bg-m3-primary data-indeterminate:bg-m3-primary data-indeterminate:text-m3-on-primary";

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
