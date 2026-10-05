// FILE: m3e/snackbar.tsx — M3E Snackbar (inverse-surface, rounded expressive).
import { cn } from "@/lib/utils";

export function MSnackbar({ className, message, action, ...props }: React.ComponentProps<"div"> & { message: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div role="status" data-slot="snackbar" className={cn("flex min-h-12 w-full items-center gap-3 rounded-[8px] bg-[var(--md-sys-color-inverse-surface)] py-3.5 pr-4 pl-4 text-[14px] leading-[1.45] text-[var(--md-sys-color-inverse-on-surface)] shadow-[var(--md-sys-elevation-3)] sm:w-max sm:max-w-[600px] sm:min-w-[344px]", className)} {...props}>
      <div className="min-w-0 flex-1">{message}</div>
      {action ? <div className="flex shrink-0 items-center text-[var(--md-sys-color-inverse-primary)]">{action}</div> : null}
    </div>
  );
}
