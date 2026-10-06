"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "~/lib/icons";
import { cn } from "~/lib/utils";
import { Button, dialogActionButtonClassName } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";

const DialogCreateHandle = DialogPrimitive.createHandle;

const Dialog = DialogPrimitive.Root;

const DialogPortal = DialogPrimitive.Portal;

function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogBackdrop({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      className={cn(
        // M3's scrim: the `scrim` role at 32% over the whole viewport. It only fades —
        // `motion-scrim` rides the slow effects spring so the scrim does not arrive in
        // lockstep with the dialog's own spatial motion.
        "motion-scrim fixed inset-0 z-50 bg-m3-scrim/32 motion-reduce:transition-none",
        className,
      )}
      data-slot="dialog-backdrop"
      {...props}
    />
  );
}

function DialogViewport({ className, ...props }: DialogPrimitive.Viewport.Props) {
  return (
    <DialogPrimitive.Viewport
      className={cn(
        "fixed inset-0 z-50 grid grid-rows-[1fr_auto_1fr] justify-items-center p-4",
        className,
      )}
      data-slot="dialog-viewport"
      {...props}
    />
  );
}

/**
 * M3 basic dialog: a raised panel with a large corner at elevation 3, its ink on
 * `on-surface-variant`.
 *
 * The fill is the app's shared overlay material rather than a `bg-m3-surface-container-high`
 * utility: the unlayered `.app-popup-surface` rule owns `background` on those elements, so
 * a utility here would be silently dropped (see the M3 overlay note in
 * composerPickerStyles). What M3 does own is the corner, the elevation, the outline, and
 * the ink. The nested-dialog offsets stay because they are choreography, not shape.
 */
const dialogPopupClassName =
  "-translate-y-[calc(1.25rem*var(--nested-dialogs))] relative row-start-2 flex max-h-full min-h-0 w-full min-w-0 max-w-lg scale-[calc(1-0.1*var(--nested-dialogs))] flex-col rounded-2xl border border-m3-outline-variant bg-popover text-m3-on-surface-variant opacity-[calc(1-0.1*var(--nested-dialogs))] shadow-elevation-3 outline-none will-change-transform motion-dialog motion-reduce:transition-none data-nested:data-ending-style:translate-y-8 data-nested:data-starting-style:translate-y-8 data-nested-dialog-open:origin-top data-ending-style:scale-98 data-starting-style:scale-98";

// Capsule-shaped buttons (class contains `rounded-full`) keep their own pill
// geometry in footers, so they are excluded from the sizing override.
const dialogFooterButtonSlotSelector =
  "[&_[data-slot=button]:not([class*='size-9']):not([class*='size-8']):not([class*='size-7']):not([class*='rounded-full'])]";

const dialogFooterButtonClassName = dialogActionButtonClassName
  .split(/\s+/)
  .filter(Boolean)
  .map((className) => `${dialogFooterButtonSlotSelector}:${className.replace(/!/g, "\\!")}`)
  .join(" ");

/** Shared label style for form fields inside dialogs (SpaceEditorDialog, CreateProjectDialog).
 *  M3 dialog ink: a field label is supporting text, so it sits on `on-surface-variant` —
 *  one role below the headline and two below the field value it names. */
const dialogFieldLabelClassName = "font-medium text-m3-on-surface-variant text-ui-sm";

const dialogPanelFieldClassName =
  "[&_[data-slot=textarea-control]]:min-h-24 [&_[data-slot=textarea-control]_[data-slot=textarea]]:px-2.5 [&_[data-slot=textarea-control]_[data-slot=textarea]]:py-2";

function DialogPopup({
  className,
  children,
  showCloseButton: showCloseButtonProp,
  bottomStickOnMobile: bottomStickOnMobileProp,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
  bottomStickOnMobile?: boolean;
}) {
  const showCloseButton = showCloseButtonProp ?? true;
  const bottomStickOnMobile = bottomStickOnMobileProp ?? true;
  return (
    <DialogPortal>
      <DialogBackdrop />
      <DialogViewport
        className={cn(bottomStickOnMobile && "max-sm:grid-rows-[1fr_auto] max-sm:p-0 max-sm:pt-12")}
      >
        <DialogPrimitive.Popup
          className={cn(
            dialogPopupClassName,
            bottomStickOnMobile &&
              "max-sm:max-w-none max-sm:rounded-none max-sm:border-x-0 max-sm:border-t max-sm:border-b-0 max-sm:opacity-[calc(1-min(var(--nested-dialogs),1))] max-sm:data-ending-style:translate-y-4 max-sm:data-starting-style:translate-y-4",
            className,
          )}
          data-slot="dialog-popup"
          {...props}
        >
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close
              aria-label="Close"
              className="absolute end-2 top-2"
              render={<Button size="icon-sm" variant="ghost" />}
            >
              <XIcon />
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Popup>
      </DialogViewport>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 px-4 pt-4 pb-2 in-[[data-slot=dialog-popup]:has([data-slot=dialog-panel])]:pb-1",
        className,
      )}
      data-slot="dialog-header"
      {...props}
    />
  );
}

function DialogFooter({
  className,
  variant: variantProp,
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "default" | "bare";
}) {
  const variant = variantProp ?? "default";
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        dialogFooterButtonClassName,
        variant === "default" &&
          "px-4 py-3 in-[[data-slot=dialog-panel]]:px-0 in-[[data-slot=dialog-panel]]:pb-0",
        variant === "bare" &&
          "px-4 pt-3 pb-4 in-[[data-slot=dialog-panel]]:px-0 in-[[data-slot=dialog-panel]]:pb-0",
        className,
      )}
      data-slot="dialog-footer"
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      // M3 dialog: the headline takes full `on-surface` ink; the supporting text below
      // sits one role down at `on-surface-variant`. Keeping the headline on the panel's
      // body tone is what made it read as body copy.
      className={cn(
        "font-heading font-semibold text-lg leading-none text-m3-on-surface",
        className,
      )}
      data-slot="dialog-title"
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      className={cn("text-ui leading-snug text-m3-on-surface-variant", className)}
      data-slot="dialog-description"
      {...props}
    />
  );
}

function DialogPanel({
  className,
  scrollFade: scrollFadeProp,
  ...props
}: React.ComponentProps<"div"> & { scrollFade?: boolean }) {
  const scrollFade = scrollFadeProp ?? true;
  return (
    <ScrollArea scrollFade={scrollFade}>
      <div
        className={cn(
          "px-4 pb-4 pt-1 in-[[data-slot=dialog-popup]:has([data-slot=dialog-header])]:pt-0 in-[[data-slot=dialog-popup]:has(>[data-slot=dialog-footer])]:pb-3",
          dialogPanelFieldClassName,
          className,
        )}
        data-slot="dialog-panel"
        {...props}
      />
    </ScrollArea>
  );
}

export {
  dialogFieldLabelClassName,
  dialogFooterButtonClassName,
  DialogCreateHandle,
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogBackdrop,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogPanel,
  DialogViewport,
};
