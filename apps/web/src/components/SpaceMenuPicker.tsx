// FILE: SpaceMenuPicker.tsx
// Purpose: Header switcher for the Space (course) a workspace belongs to.
// Notes: Mirrors ProjectMenuPicker's trigger/popup split deliberately — the project row
//        underneath it is the same shape, and two pickers that disagree read as two ideas.

import type { SpaceId } from "@synara/contracts";
import { type ReactElement, type ReactNode, useState } from "react";

import { ComposerPickerMenuPopup } from "~/components/chat/ComposerPickerMenuPopup";
import {
  Menu,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "~/components/ui/menu";
import { orderedSpaceIdsForPicker, spaceDisplayIcon, spaceDisplayName } from "~/lib/spaceGrouping";
import { useStore } from "~/store";
import { useVoidSpace } from "~/voidSpaceStore";
import { SpaceIcon } from "./SpaceIcon";

export function SpaceMenuPicker(props: {
  readonly selectedSpaceId: SpaceId | null;
  readonly onSpaceIdChange: (spaceId: SpaceId | null) => void;
  /** Rendered through MenuTrigger's `render` slot so each surface owns its trigger chrome. */
  readonly trigger: ReactElement;
  readonly children?: ReactNode;
  readonly align?: "start" | "center" | "end";
  readonly popupClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Menu open={open} onOpenChange={setOpen}>
      <MenuTrigger render={props.trigger}>{props.children}</MenuTrigger>
      <ComposerPickerMenuPopup align={props.align ?? "start"} className={props.popupClassName}>
        {/* Mounted only while open, like ProjectMenuPicker's list: the spaces snapshot
            updates on every shell event and a closed picker must stay inert. */}
        {open ? <SpaceMenuPickerList {...props} /> : null}
      </ComposerPickerMenuPopup>
    </Menu>
  );
}

function SpaceMenuPickerList(props: {
  readonly selectedSpaceId: SpaceId | null;
  readonly onSpaceIdChange: (spaceId: SpaceId | null) => void;
}) {
  const spaces = useStore((store) => store.spaces);
  const voidSpace = useVoidSpace();
  // The course you are in first, then Void, then the rest in user order — the same
  // ordering every other grouped list in the app uses.
  const ordered = orderedSpaceIdsForPicker(spaces, props.selectedSpaceId);

  return (
    <MenuRadioGroup
      value={props.selectedSpaceId ?? ""}
      onValueChange={(value) => {
        if (value === (props.selectedSpaceId ?? "")) return;
        props.onSpaceIdChange(value === VOID_VALUE ? null : (value as SpaceId));
      }}
    >
      {ordered.map((spaceId, index) => (
        <SpaceMenuPickerRow
          key={spaceId ?? VOID_VALUE}
          spaceId={spaceId}
          name={spaceDisplayName(spaceId, spaces, voidSpace)}
          icon={spaceDisplayIcon(spaceId, spaces, voidSpace)}
          selected={spaceId === props.selectedSpaceId}
          first={index === 0}
        />
      ))}
    </MenuRadioGroup>
  );
}

/** Void is not a stored row, so it needs a stable value in a radio group. */
const VOID_VALUE = "__void__";

function SpaceMenuPickerRow(props: {
  readonly spaceId: SpaceId | null;
  readonly name: string;
  readonly icon: ReturnType<typeof spaceDisplayIcon>;
  readonly selected: boolean;
  readonly first: boolean;
}) {
  return (
    <>
      {props.first ? null : <MenuSeparator />}
      <MenuRadioItem value={props.spaceId ?? VOID_VALUE}>
        <span className="flex min-w-0 items-center gap-2">
          <SpaceIcon icon={props.icon} className="size-3.5 shrink-0" />
          <span className="min-w-0 truncate">{props.name}</span>
        </span>
      </MenuRadioItem>
    </>
  );
}
