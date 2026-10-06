import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card";

import { cn } from "~/lib/utils";
import { APP_OVERLAY_SURFACE_M3_CLASS_NAME } from "../chat/composerPickerStyles";

// Hover-triggered, interactive card (Base UI PreviewCard). Unlike a Tooltip it
// stays open while the pointer moves into the popup, so its content can hold
// clickable controls (used by the sidebar project/folder hover card).
//
// This is M3's hover card, not a tooltip: a raised `surface-container` at elevation 2
// with a medium corner, where a plain tooltip is an inverse chip. The two differ
// because one holds interactive content and the other does not.
const PreviewCard = PreviewCardPrimitive.Root;

function PreviewCardTrigger(props: PreviewCardPrimitive.Trigger.Props) {
  return <PreviewCardPrimitive.Trigger data-slot="preview-card-trigger" {...props} />;
}

function PreviewCardPopup({
  className,
  positionerClassName,
  align: alignProp,
  side: sideProp,
  sideOffset: sideOffsetProp,
  anchor,
  children,
  ...props
}: PreviewCardPrimitive.Popup.Props & {
  align?: PreviewCardPrimitive.Positioner.Props["align"];
  side?: PreviewCardPrimitive.Positioner.Props["side"];
  sideOffset?: PreviewCardPrimitive.Positioner.Props["sideOffset"];
  anchor?: PreviewCardPrimitive.Positioner.Props["anchor"];
  // Stacking lives on the positioner (the portaled, positioned element), so a
  // z-index override has to land here rather than on the popup className.
  positionerClassName?: string;
}) {
  const align = alignProp ?? "start";
  const side = sideProp ?? "right";
  const sideOffset = sideOffsetProp ?? 8;
  return (
    <PreviewCardPrimitive.Portal>
      <PreviewCardPrimitive.Positioner
        align={align}
        anchor={anchor}
        className={cn(
          "z-50 max-w-(--available-width) transition-[top,left,right,bottom,transform] data-instant:transition-none",
          positionerClassName,
        )}
        data-slot="preview-card-positioner"
        side={side}
        sideOffset={sideOffset}
      >
        <PreviewCardPrimitive.Popup
          className={cn(
            // `motion-popup` carries M3's enter/exit curves; the 0.98 scale stays the
            // app's resting geometry (see TooltipPopup for why).
            APP_OVERLAY_SURFACE_M3_CLASS_NAME,
            "motion-popup origin-(--transform-origin) motion-reduce:transition-none data-ending-style:scale-98 data-starting-style:scale-98",
            className,
          )}
          data-slot="preview-card-popup"
          {...props}
        >
          {children}
        </PreviewCardPrimitive.Popup>
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  );
}

export { PreviewCard, PreviewCardTrigger, PreviewCardPopup };
