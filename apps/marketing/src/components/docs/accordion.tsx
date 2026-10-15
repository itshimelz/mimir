// FILE: components/docs/accordion.tsx
// Purpose: MDX <Accordions>/<Accordion title="…"> for docs pages, built on the
//          M3E accordion primitives. Keeps the authored MDX API (title prop,
//          nested children) while rendering the M3 components.
// Layer: client component (Base UI accordion state).

"use client";

import { useId, type ReactNode } from "react";
import {
  Accordion as M3Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/m3e/accordion";

export function Accordions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <M3Accordion className={className} data-prose-block>
      {children}
    </M3Accordion>
  );
}

export function Accordion({ title, children }: { title: ReactNode; children: ReactNode }) {
  const value = useId();
  return (
    <AccordionItem value={value}>
      <AccordionTrigger>{title}</AccordionTrigger>
      <AccordionContent>{children}</AccordionContent>
    </AccordionItem>
  );
}
