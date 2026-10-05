// FILE: m3e/type.tsx — M3E type scale + section helpers for marketing.
import { cn } from "@/lib/utils";

export function MDisplay({ className, ...props }: React.ComponentProps<"h1">) {
  return <h1 className={cn("text-[clamp(2.5rem,6vw,3.75rem)] leading-[1.05] font-normal tracking-[-0.02em] text-[var(--md-sys-color-on-surface)]", className)} {...props} />;
}
export function MHeadline({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("text-[clamp(1.5rem,3.4vw,2rem)] leading-[1.15] font-normal tracking-[-0.015em] text-[var(--md-sys-color-on-surface)]", className)} {...props} />;
}
export function MTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("text-[19px] leading-[1.4] font-medium tracking-[-0.01em] text-[var(--md-sys-color-on-surface)]", className)} {...props} />;
}
export function MBody({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-[16px] leading-[1.6] text-[var(--md-sys-color-on-surface-variant)]", className)} {...props} />;
}
export function MLabel({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-[12px] leading-[1.4] font-medium tracking-[0.08em] text-[var(--md-sys-color-on-surface-variant)] uppercase", className)} {...props} />;
}
