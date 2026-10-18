"use client";

import * as React from "react";
import { Menubar as MenubarPrimitive } from "@base-ui/react/menubar";
import { cn } from "~/lib/utils";

import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPortal,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubTrigger,
  MenuTrigger,
} from "~/components/ui/menu";
import {
  ComposerPickerMenuPopup,
  ComposerPickerMenuSubPopup,
} from "~/components/chat/ComposerPickerMenuPopup";

function Menubar({ className, ...props }: MenubarPrimitive.Props) {
  return (
    <MenubarPrimitive
      data-slot="menubar"
      className={cn(
        "flex h-8 items-center gap-0.5 rounded-none border-0 bg-transparent p-0",
        className,
      )}
      {...props}
    />
  );
}

function MenubarMenu(props: React.ComponentProps<typeof Menu>) {
  return <Menu data-slot="menubar-menu" {...props} />;
}

function MenubarGroup(props: React.ComponentProps<typeof MenuGroup>) {
  return <MenuGroup data-slot="menubar-group" {...props} />;
}

function MenubarPortal(props: React.ComponentProps<typeof MenuPortal>) {
  return <MenuPortal data-slot="menubar-portal" {...props} />;
}

function MenubarTrigger({ className, ...props }: React.ComponentProps<typeof MenuTrigger>) {
  return (
    <MenuTrigger
      data-slot="menubar-trigger"
      className={cn(
        "inline-flex h-7 items-center rounded-md px-2 text-ui-sm font-normal text-muted-foreground outline-none select-none transition-colors duration-100 hover:bg-surface-secondary/80 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 aria-expanded:bg-surface-secondary/80 aria-expanded:text-foreground cursor-pointer [-webkit-app-region:no-drag]",
        className,
      )}
      {...props}
    />
  );
}

function MenubarContent({
  className,
  align = "start",
  alignOffset = 0,
  sideOffset = 4,
  side = "bottom",
  ...props
}: React.ComponentProps<typeof ComposerPickerMenuPopup>) {
  return (
    <ComposerPickerMenuPopup
      data-slot="menubar-content"
      align={align}
      alignOffset={alignOffset}
      sideOffset={sideOffset}
      side={side}
      className={cn("min-w-48", className)}
      {...props}
    />
  );
}

function MenubarItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof MenuItem>) {
  return (
    <MenuItem
      data-slot="menubar-item"
      data-inset={inset}
      variant={variant}
      className={cn(
        "group/menubar-item min-h-7 gap-4 justify-between rounded-md px-2 py-1 text-ui-sm",
        className,
      )}
      {...props}
    />
  );
}

function MenubarCheckboxItem({
  className,
  ...props
}: React.ComponentProps<typeof MenuCheckboxItem>) {
  return (
    <MenuCheckboxItem
      data-slot="menubar-checkbox-item"
      className={cn("min-h-7 text-ui-sm", className)}
      {...props}
    />
  );
}

function MenubarRadioGroup(props: React.ComponentProps<typeof MenuRadioGroup>) {
  return <MenuRadioGroup data-slot="menubar-radio-group" {...props} />;
}

function MenubarRadioItem({ className, ...props }: React.ComponentProps<typeof MenuRadioItem>) {
  return (
    <MenuRadioItem
      data-slot="menubar-radio-item"
      className={cn("min-h-7 text-ui-sm", className)}
      {...props}
    />
  );
}

function MenubarLabel({ className, ...props }: React.ComponentProps<typeof MenuGroupLabel>) {
  return (
    <MenuGroupLabel
      data-slot="menubar-label"
      className={cn("text-ui-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

function MenubarSeparator({ className, ...props }: React.ComponentProps<typeof MenuSeparator>) {
  return (
    <MenuSeparator
      data-slot="menubar-separator"
      className={cn("-mx-1 my-1", className)}
      {...props}
    />
  );
}

function MenubarShortcut({ className, ...props }: React.ComponentProps<typeof MenuShortcut>) {
  return (
    <MenuShortcut data-slot="menubar-shortcut" className={cn("text-ui-xs", className)} {...props} />
  );
}

function MenubarSub(props: React.ComponentProps<typeof MenuSub>) {
  return <MenuSub data-slot="menubar-sub" {...props} />;
}

function MenubarSubTrigger({ className, ...props }: React.ComponentProps<typeof MenuSubTrigger>) {
  return (
    <MenuSubTrigger
      data-slot="menubar-sub-trigger"
      className={cn("min-h-7 text-ui-sm", className)}
      {...props}
    />
  );
}

function MenubarSubContent({
  className,
  ...props
}: React.ComponentProps<typeof ComposerPickerMenuSubPopup>) {
  return (
    <ComposerPickerMenuSubPopup
      data-slot="menubar-sub-content"
      className={cn("min-w-36", className)}
      {...props}
    />
  );
}

export {
  Menubar,
  MenubarPortal,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarGroup,
  MenubarSeparator,
  MenubarLabel,
  MenubarItem,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
};
