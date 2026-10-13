// FILE: EnvironmentSidechatsSection.tsx
// Purpose: Environment panel "Side chats" section — a single row naming the side chat this
//          host currently has open, with a dot menu carrying New side chat, History (switch
//          between this host's side chats) and Delete. The per-side-chat rows moved into the
//          History submenu so a thread with many detours stops pushing the rest of the panel
//          down.
// Layer: Environment panel section
// Depends on: the shared Environment row skin and the shared Environment menu row pieces.

import type { ThreadId } from "@synara/contracts";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Menu,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
  MenuTrigger,
} from "~/components/ui/menu";
import { EllipsisIcon, HistoryIcon, PlusIcon, SidechatIcon, TrashCanIcon } from "~/lib/icons";
import { cn } from "~/lib/utils";
import { ComposerPickerMenuPopup, ComposerPickerMenuSubPopup } from "../ComposerPickerMenuPopup";
import { MENU_ICON_CLASS_NAME } from "../composerPickerStyles";

import { ENVIRONMENT_MENU_SUBMENU_SIDE, EnvironmentMenuRowLabel } from "./environmentMenuRows";
import {
  ENVIRONMENT_ROW_CLASS_NAME,
  ENVIRONMENT_ROW_ICON_CLASS_NAME,
  EnvironmentRowBody,
  EnvironmentSectionDivider,
} from "./EnvironmentRow";
import { resolveActiveSidechatPanelItem } from "./EnvironmentSidechatsSection.logic";

export interface EnvironmentSidechatPanelItem {
  readonly id: ThreadId;
  readonly title: string;
  readonly expiredAt: string | null;
}

export function EnvironmentSidechatsSection({
  sidechats,
  activeSidechatId,
  onCreate,
  onOpen,
  onDelete,
}: {
  readonly sidechats: readonly EnvironmentSidechatPanelItem[];
  /** The thread this host's dock pane shows; null when it has no side chat pane yet. */
  readonly activeSidechatId: ThreadId | null;
  readonly onCreate: () => void;
  readonly onOpen: (threadId: ThreadId) => void;
  readonly onDelete: (sidechat: EnvironmentSidechatPanelItem) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  // No side chats yet: hide the whole section instead of showing an empty header row.
  if (sidechats.length === 0) {
    return null;
  }
  const activeSidechat = resolveActiveSidechatPanelItem({ sidechats, activeSidechatId });
  // Every action below applies to the row's session, so it is named in the menu too.
  const activeTitle = activeSidechat?.title ?? "Side chats";

  return (
    // The row replaces the old visible "Side chats" label, so the group carries that name
    // for assistive tech instead of the eye.
    <div aria-label="Side chats" role="group">
      <EnvironmentSectionDivider />
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          className={cn(
            ENVIRONMENT_ROW_CLASS_NAME,
            "min-w-0 flex-1",
            activeSidechat?.expiredAt && "opacity-60",
          )}
          aria-label={`Open side chat ${activeTitle}`}
          title={activeTitle}
          onClick={() => {
            if (activeSidechat) {
              onOpen(activeSidechat.id);
            }
          }}
        >
          <EnvironmentRowBody
            icon={<SidechatIcon className={ENVIRONMENT_ROW_ICON_CLASS_NAME} aria-hidden />}
            label={<span className="truncate">{activeTitle}</span>}
          />
        </button>
        <Menu open={menuOpen} onOpenChange={setMenuOpen} keepOpenOnSubmenuInteraction>
          <MenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Side chat options"
                title="Side chat options"
                className="shrink-0"
              />
            }
          >
            <EllipsisIcon className="size-3.5" />
          </MenuTrigger>
          {/* Opens beside the row (the panel docks on the right, so screen-left) like the
              pull request menu, rather than dropping down over the rest of the panel. */}
          <ComposerPickerMenuPopup
            align="end"
            side="left"
            sideOffset={8}
            collisionAvoidance={{ fallbackAxisSide: "end" }}
            className="w-56 min-w-56"
          >
            <MenuItem onClick={onCreate}>
              <EnvironmentMenuRowLabel
                icon={<PlusIcon className={MENU_ICON_CLASS_NAME} aria-hidden />}
                label="New side chat"
              />
            </MenuItem>
            <MenuSub keepOpenOnFocusOut>
              <MenuSubTrigger>
                <EnvironmentMenuRowLabel
                  icon={<HistoryIcon className={MENU_ICON_CLASS_NAME} aria-hidden />}
                  label="History"
                  trailing={sidechats.length > 1 ? String(sidechats.length) : undefined}
                />
              </MenuSubTrigger>
              <ComposerPickerMenuSubPopup
                side={ENVIRONMENT_MENU_SUBMENU_SIDE}
                className="w-72 min-w-72"
              >
                <MenuRadioGroup
                  value={activeSidechat?.id ?? ""}
                  // Re-picking the current session is not a no-op: it re-opens the dock.
                  onValueChange={(value) => {
                    if (value !== "") {
                      onOpen(value as ThreadId);
                    }
                  }}
                >
                  {sidechats.map((sidechat) => (
                    <MenuRadioItem key={sidechat.id} value={sidechat.id}>
                      <EnvironmentMenuRowLabel
                        icon={<SidechatIcon className={MENU_ICON_CLASS_NAME} aria-hidden />}
                        label={sidechat.title}
                        trailing={sidechat.expiredAt !== null ? "Expired" : null}
                      />
                    </MenuRadioItem>
                  ))}
                </MenuRadioGroup>
              </ComposerPickerMenuSubPopup>
            </MenuSub>
            <MenuSeparator />
            <MenuItem
              variant="destructive"
              disabled={!activeSidechat}
              onClick={() => {
                if (activeSidechat) {
                  onDelete(activeSidechat);
                }
              }}
            >
              <EnvironmentMenuRowLabel
                icon={<TrashCanIcon className={MENU_ICON_CLASS_NAME} aria-hidden />}
                label="Delete side chat"
              />
            </MenuItem>
          </ComposerPickerMenuPopup>
        </Menu>
      </div>
    </div>
  );
}
