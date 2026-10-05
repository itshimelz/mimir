// FILE: SplitShowcase.tsx — M3E alternating row: copy + elevated media card.
import type { ReactNode } from "react";
import { MCard } from "@/components/m3e/card";
import { MLabel, MTitle, MBody } from "@/components/m3e/type";

type SplitShowcaseProps = {
  title: string;
  description: string;
  reverse?: boolean;
  stacked?: boolean;
  prominentMedia?: boolean;
  kicker?: string;
  children: ReactNode;
};

export function SplitShowcase({ title, description, reverse, stacked, prominentMedia, kicker, children }: SplitShowcaseProps) {
  const wrapperClass = stacked
    ? "flex flex-col gap-6 py-8 sm:gap-8 sm:py-12"
    : "grid grid-cols-1 gap-6 py-12 sm:gap-10 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-12 xl:gap-16";
  const textColClass = stacked ? "min-w-0" : `min-w-0 ${reverse ? "lg:order-2" : "lg:order-1"}`;
  const mockOrderClass = stacked ? "" : reverse ? "lg:order-1" : "lg:order-2";
  return (
    <div className={wrapperClass}>
      <div className={textColClass}>
        {kicker && <MLabel className="mb-3 text-[var(--md-sys-color-primary)]">{kicker}</MLabel>}
        <MTitle className="text-[1.5rem] sm:text-[1.65rem]">{title}</MTitle>
        <MBody className="mt-3 max-w-2xl">{description}</MBody>
      </div>
      <div className={`relative flex min-h-0 min-w-0 flex-col ${mockOrderClass}`}>
        <MCard variant="elevated" className="items-center justify-center rounded-[28px] bg-[var(--md-sys-color-surface-container)] p-4 sm:p-6">
          <div className={prominentMedia ? "w-full sm:w-3/4 lg:w-3/5" : "w-3/5"}>{children}</div>
        </MCard>
      </div>
    </div>
  );
}
