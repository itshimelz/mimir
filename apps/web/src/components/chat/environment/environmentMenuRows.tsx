// FILE: environmentMenuRows.tsx
// Purpose: Row pieces shared by the Environment panel's action menus (the pull request menu
//          and the side chat menu), so both render identical label and placeholder rows
//          instead of each keeping its own copy.
// Layer: Environment panel UI primitive
// Exports: EnvironmentMenuRowLabel, EnvironmentMenuPlaceholder, and the shared menu layout tokens.

import type { ReactNode } from "react";

/** Right-aligned secondary value on a menu row (diff stat, count, current status).
 *  The label grows instead of this span using `flex-1`: sub-trigger chevrons already carry
 *  `margin-inline-start: auto`, and two auto margins would split the free space and float
 *  the value mid-row instead of flush against the chevron. */
export const ENVIRONMENT_MENU_TRAILING_CLASS_NAME =
  "shrink-0 pl-3 text-muted-foreground tabular-nums";

/** The root menu opens to the left of the docked panel, so submenus keep cascading that way
 *  instead of folding back over the panel. Base UI flips them when there is no room. */
export const ENVIRONMENT_MENU_SUBMENU_SIDE = "inline-start";

/** Centered message for a menu region with nothing in it (empty history, load failure). */
export function EnvironmentMenuPlaceholder({ text }: { text: string }) {
  return <div className="px-3 py-3 text-center text-ui text-muted-foreground">{text}</div>;
}

/** Menu row contents: leading glyph, truncating label, optional trailing value. */
export function EnvironmentMenuRowLabel({
  icon,
  label,
  trailing,
}: {
  icon: ReactNode;
  label: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <>
      {icon}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {trailing ? <span className={ENVIRONMENT_MENU_TRAILING_CLASS_NAME}>{trailing}</span> : null}
    </>
  );
}
