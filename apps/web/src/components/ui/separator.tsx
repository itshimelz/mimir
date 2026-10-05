// FILE: separator.tsx
// Purpose: The hairline rule between groups in menus, panels, and lists.
// Layer: UI primitive
// Exports: Separator

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";

import { cn } from "~/lib/utils";

/**
 * M3 draws a separator in `outline-variant`, the faintest of the three outline roles,
 * so a divider never competes with content the way `outline` does.
 */
function Separator({
  className,
  orientation: orientationProp,
  ...props
}: SeparatorPrimitive.Props) {
  const orientation = orientationProp ?? "horizontal";
  return (
    <SeparatorPrimitive
      className={cn(
        "shrink-0 bg-m3-outline-variant data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:not-[[class^='h-']]:not-[[class*='_h-']]:self-stretch",
        className,
      )}
      data-slot="separator"
      orientation={orientation}
      {...props}
    />
  );
}

export { Separator };
