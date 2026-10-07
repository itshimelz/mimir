// FILE: ViewerZoomControl.tsx
// Purpose: The zoom cluster every in-app document viewer puts in its toolbar:
//          zoom out, a percentage button opening the fit/preset menu, zoom in.
//          One control so the PDF and PPTX viewers cannot drift apart in
//          presets, menu contents, or keyboard/hover behavior.
// Layer: Web viewer chrome
// Exports: ViewerZoomControl

import { ChevronDownIcon, MinusIcon, PlusIcon } from "~/lib/icons";
import {
  formatZoomPercent,
  VIEWER_ZOOM_PRESETS,
  type ViewerZoomMode,
} from "~/lib/viewer/viewerZoom";
import { ComposerPickerMenuPopup } from "../chat/ComposerPickerMenuPopup";
import { ChatHeaderButton, ChatHeaderIconButton } from "../chat/chatHeaderControls";
import { Menu, MenuRadioGroup, MenuRadioItem, MenuSeparator, MenuTrigger } from "../ui/menu";

function viewerZoomSelectionValue(mode: ViewerZoomMode, scale: number): string {
  if (mode.type === "fit-width") {
    return "fit-width";
  }
  if (mode.type === "fit-page") {
    return "fit-page";
  }
  return String(Math.round(scale * 100));
}

export interface ViewerZoomControlProps {
  zoomMode: ViewerZoomMode;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSetScale: (scale: number) => void;
  onFitWidth: () => void;
  onFitPage: () => void;
}

export const ViewerZoomControl = function ViewerZoomControl(props: ViewerZoomControlProps) {
  const selectionValue = viewerZoomSelectionValue(props.zoomMode, props.scale);

  return (
    <div className="flex items-center gap-0.5">
      <ChatHeaderIconButton label="Zoom out" tone="plain" onClick={props.onZoomOut}>
        <MinusIcon aria-hidden="true" className="size-4" />
      </ChatHeaderIconButton>
      <Menu>
        <MenuTrigger
          render={<ChatHeaderButton tone="plain" className="min-w-16 justify-center gap-1 px-2" />}
        >
          <span className="tabular-nums">{formatZoomPercent(props.scale)}</span>
          <ChevronDownIcon aria-hidden="true" className="size-3.5 opacity-70" />
        </MenuTrigger>
        <ComposerPickerMenuPopup align="end" side="bottom" className="w-40 min-w-40">
          <MenuRadioGroup
            value={selectionValue}
            onValueChange={(value) => {
              if (value === "fit-width") {
                props.onFitWidth();
              } else if (value === "fit-page") {
                props.onFitPage();
              } else {
                const percent = Number(value);
                if (Number.isFinite(percent)) {
                  props.onSetScale(percent / 100);
                }
              }
            }}
          >
            <MenuRadioItem value="fit-width">Fit width</MenuRadioItem>
            <MenuRadioItem value="fit-page">Fit page</MenuRadioItem>
            <MenuSeparator className="mx-1" />
            {VIEWER_ZOOM_PRESETS.map((preset) => {
              const percent = String(Math.round(preset * 100));
              return (
                <MenuRadioItem key={percent} value={percent}>
                  {percent}%
                </MenuRadioItem>
              );
            })}
          </MenuRadioGroup>
        </ComposerPickerMenuPopup>
      </Menu>
      <ChatHeaderIconButton label="Zoom in" tone="plain" onClick={props.onZoomIn}>
        <PlusIcon aria-hidden="true" className="size-4" />
      </ChatHeaderIconButton>
    </div>
  );
};
