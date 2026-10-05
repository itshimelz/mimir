// FILE: MobileNav.tsx
// Purpose: Small-screen navigation as an M3E dropdown menu.
// Layer: Client component
"use client";
import { useState } from "react";
import Link from "next/link";
import { SiX } from "react-icons/si";
import { Button } from "@/components/m3e/button";
import { Icon } from "@/components/m3e/icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/m3e/dropdown-menu";

const LINKS = [
  { href: "/install", label: "Install", icon: "download" },
  { href: "/docs", label: "Docs", icon: "menu_book" },
  { href: "/changelog", label: "Changelog", icon: "history" },
] as const;

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            aria-label={open ? "Close navigation" : "Open navigation"}
          />
        }
      >
        <Icon name={open ? "close" : "menu"} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {LINKS.map(({ href, label, icon }) => (
          <DropdownMenuItem key={href} render={<Link href={href} />}>
            <Icon name={icon} />
            {label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={<a href="https://x.com/trymimir" target="_blank" rel="noopener noreferrer" />}
        >
          <SiX />
          X
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
