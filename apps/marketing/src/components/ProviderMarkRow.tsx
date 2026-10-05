// FILE: ProviderMarkRow.tsx — provider marks as M3E elevated cards.
import { SiOpenai } from "react-icons/si";
import { AntigravityIcon, ClaudeIcon, CursorIcon, DevinIcon, DroidIcon, GrokIcon, OpencodeIcon, PiIcon } from "@/components/BrandIcons";

const marks = [
  { name: "Claude Code", Icon: ClaudeIcon, className: "text-[#D97757]" },
  { name: "Codex", Icon: SiOpenai, className: "text-[var(--md-sys-color-on-surface)]" },
  { name: "OpenCode", Icon: OpencodeIcon, className: "text-[var(--md-sys-color-on-surface)]" },
  { name: "Cursor", Icon: CursorIcon, className: "text-[var(--md-sys-color-on-surface)]" },
  { name: "Antigravity", Icon: AntigravityIcon, className: "" },
  { name: "Grok Build", Icon: GrokIcon, className: "text-[var(--md-sys-color-on-surface)]" },
  { name: "Devin CLI", Icon: DevinIcon, className: "text-[var(--md-sys-color-on-surface)]" },
  { name: "Pi", Icon: PiIcon, className: "text-[var(--md-sys-color-on-surface)]" },
  { name: "Factory Droid", Icon: DroidIcon, className: "text-[var(--md-sys-color-on-surface)]" },
] as const;

export default function ProviderMarkRow({ centered = false, showLabels = false }: { centered?: boolean; showLabels?: boolean }) {
  return (
    <div role="list" aria-label="Supported coding-agent runtimes" className={`flex flex-wrap items-center gap-2 ${centered ? "justify-center" : ""}`}>
      {marks.map(({ name, Icon, className }) => (
        <div key={name} title={name} role="listitem" className={`inline-flex items-center justify-center rounded-[12px] bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] shadow-[var(--md-sys-elevation-1)] ${showLabels ? "gap-2 px-3 py-2" : "size-[44px]"}`}>
          <Icon className={`size-[20px] ${className}`} aria-hidden="true" />
          <span className={showLabels ? "text-[12px] font-medium" : "sr-only"}>{name}</span>
        </div>
      ))}
    </div>
  );
}
