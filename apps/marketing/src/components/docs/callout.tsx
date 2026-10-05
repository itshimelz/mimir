// FILE: components/docs/callout.tsx
// Purpose: MDX <Callout> for docs pages, built on the M3E Alert component.
//          Type only changes the icon and the container role.
// Layer: server component (no client hooks).

import type { ReactNode } from "react";
import { cn } from "@/lib/m3e/cn";
import { Alert, AlertDescription, AlertTitle } from "@/components/m3e/alert";
import { Icon } from "@/components/m3e/icon";

type CalloutType = "info" | "note" | "tip" | "warn" | "warning" | "error";

// @icons info lightbulb warning error
const CALLOUT_ICONS: Record<CalloutType, string> = {
  info: "info",
  note: "info",
  tip: "lightbulb",
  warn: "warning",
  warning: "warning",
  error: "error",
};

const CALLOUT_VARIANTS: Record<CalloutType, "default" | "info" | "tertiary" | "destructive"> = {
  info: "info",
  note: "default",
  tip: "tertiary",
  warn: "destructive",
  warning: "destructive",
  error: "destructive",
};

export function Callout({
  type = "info",
  title,
  className,
  children,
}: {
  type?: CalloutType;
  title?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Alert
      variant={CALLOUT_VARIANTS[type] ?? "info"}
      className={cn("not-prose my-5 rounded-lg", className)}
    >
      <Icon name={CALLOUT_ICONS[type] ?? "info"} />
      {title ? <AlertTitle className="text-title-small">{title}</AlertTitle> : null}
      <AlertDescription className="text-body-medium leading-relaxed">
        {children}
      </AlertDescription>
    </Alert>
  );
}
