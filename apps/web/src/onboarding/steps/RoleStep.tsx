// FILE: RoleStep.tsx
// Purpose: Second step of the welcome tour — pick how you work here (Student / Teacher /
//          Researcher) and see the label and icon that choice gives your space. Preview only:
//          nothing is persisted, and no folder, scaffold, or permission is derived from it.
// Layer: Web UI component

import { SpaceIcon } from "~/components/SpaceIcon";
import { useRadioGroupKeyboardNav } from "~/hooks/useRadioGroupKeyboardNav";
import { cn } from "~/lib/utils";
import { LEARNER_ROLES, type LearnerRoleId } from "../logic";

export function RoleStep(props: {
  value: LearnerRoleId;
  onValueChange: (value: LearnerRoleId) => void;
}) {
  const roleIds = LEARNER_ROLES.map((role) => role.id);
  const radioItemProps = useRadioGroupKeyboardNav({
    values: roleIds,
    value: props.value,
    onValueChange: props.onValueChange,
  });

  return (
    <div className="flex flex-col gap-3">
      <div
        role="radiogroup"
        aria-label="How are you using Mimir"
        className="grid grid-cols-3 gap-3"
      >
        {LEARNER_ROLES.map((role) => {
          const selected = role.id === props.value;
          return (
            <button
              key={role.id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={cn(
                "flex min-h-[132px] cursor-pointer flex-col items-start gap-2.5 rounded-xl border bg-popover px-4 py-4 text-start outline-none transition-colors motion-reduce:transition-none",
                "focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset",
                selected
                  ? "border-foreground ring-1 ring-foreground ring-inset"
                  : "border-foreground/9 hover:border-foreground/25",
              )}
              onClick={() => props.onValueChange(role.id)}
              {...radioItemProps(role.id)}
            >
              {/* The space preview: the exact glyph and wording a space filed under this role
                  would carry, so the choice is judged on what it produces, not on an abstract
                  label. */}
              <span
                className={cn(
                  "flex h-7 items-center gap-1.5 rounded-lg px-2 text-ui-sm",
                  selected
                    ? "bg-foreground/8 text-foreground"
                    : "bg-foreground/4 text-muted-foreground",
                )}
              >
                <SpaceIcon icon={role.spaceIcon} className="size-[15px]" />
                <span className="font-medium">{role.spaceLabel}</span>
              </span>
              <span className="text-ui-lg font-medium text-foreground">{role.label}</span>
              <span className="text-ui leading-normal text-muted-foreground">
                {role.description}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-ui-sm text-muted-foreground/80">
        Each course gets its own space. Start with one, add more whenever you begin something new.
      </p>
    </div>
  );
}
