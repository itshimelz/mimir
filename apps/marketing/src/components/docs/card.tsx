// FILE: components/docs/card.tsx
// Purpose: MDX <Cards>/<Card> for docs pages, built on the M3E Card primitives
//          so docs surfaces match the rest of the design system.
// Layer: server component (no client hooks).

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/m3e/cn";
import { Card as M3Card, CardDescription, CardHeader, CardTitle } from "@/components/m3e/card";
import { Icon } from "@/components/m3e/icon";

export function Cards({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("not-prose my-5 grid gap-3 sm:grid-cols-2", className)}>{children}</div>
  );
}

type DocsCardProps = {
  title: ReactNode;
  description?: ReactNode;
  href?: string;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export function Card({ title, description, href, icon, className, children }: DocsCardProps) {
  const card = (
    <M3Card
      size="sm"
      variant="outlined"
      interactive={Boolean(href)}
      className={cn("h-full gap-1", className)}
    >
      <CardHeader className="gap-1">
        <CardTitle className="flex items-center gap-2 text-title-small">
          {icon ? <span className="text-on-surface-variant [&_svg]:size-4">{icon}</span> : null}
          {title}
          {href ? (
            <Icon
              name="arrow_outward"
              size={14}
              className="ms-auto shrink-0 text-on-surface-variant transition-transform group-hover/card:translate-x-px group-hover/card:-translate-y-px"
            />
          ) : null}
        </CardTitle>
        {description ? (
          <CardDescription className="text-body-medium leading-relaxed">
            {description}
          </CardDescription>
        ) : null}
        {children ? (
          <div className="text-body-medium leading-relaxed text-on-surface-variant">{children}</div>
        ) : null}
      </CardHeader>
    </M3Card>
  );

  if (!href) return card;

  return (
    <Link href={href} className="group/doccard block no-underline focus-ring rounded-md">
      {card}
    </Link>
  );
}
