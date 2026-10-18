// FILE: SynaraLogo.tsx
// Purpose: Render the Mimir mark as an inline SVG that follows theme foreground color.
// Layer: Shared app branding primitive

import type { SVGProps } from "react";
import { SYNARA_LOGO_PATHS } from "~/assets/synaraLogoPath";
import { cn } from "~/lib/utils";

export interface SynaraLogoProps extends SVGProps<SVGSVGElement> {
  variant?: "monochrome" | "color" | "color-badge";
}

export function SynaraLogo({ variant = "monochrome", className, ...props }: SynaraLogoProps) {
  const ariaLabel = props["aria-label"];
  const ariaHidden = props["aria-hidden"];

  if (variant === "color-badge") {
    return (
      <span
        aria-hidden={ariaHidden ? true : ariaLabel ? undefined : true}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-2xl bg-white shadow-xs ring-1 ring-black/5 dark:ring-white/10",
          className,
        )}
      >
        <img
          src="/synara-logo.svg"
          alt={typeof ariaLabel === "string" ? ariaLabel : ""}
          className="size-[68%] shrink-0 select-none object-contain"
        />
      </span>
    );
  }

  if (variant === "color") {
    return (
      <img
        src="/synara-logo.svg"
        alt={typeof ariaLabel === "string" ? ariaLabel : ""}
        aria-hidden={ariaHidden ? true : ariaLabel ? undefined : true}
        className={cn("shrink-0 select-none object-contain", className)}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={ariaLabel ? undefined : true}
      {...props}
      className={cn("shrink-0 text-foreground", className)}
    >
      {SYNARA_LOGO_PATHS.map((path) => (
        <path key={path} d={path} fill="currentColor" fillRule="evenodd" />
      ))}
    </svg>
  );
}
