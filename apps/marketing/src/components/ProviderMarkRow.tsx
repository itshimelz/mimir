// FILE: ProviderMarkRow.tsx — provider marks as M3E assist chips.
import { SiOpenai } from "react-icons/si";
import { Chip } from "@/components/m3e/chip";
import {
  AntigravityIcon,
  ClaudeIcon,
  CursorIcon,
  DevinIcon,
  DroidIcon,
  GrokIcon,
  OpencodeIcon,
  PiIcon,
} from "@/components/BrandIcons";

const marks = [
  { name: "Claude Code", Icon: ClaudeIcon, className: "text-[#D97757]" },
  { name: "Codex", Icon: SiOpenai, className: "text-on-surface" },
  { name: "OpenCode", Icon: OpencodeIcon, className: "text-on-surface" },
  { name: "Cursor", Icon: CursorIcon, className: "text-on-surface" },
  { name: "Antigravity", Icon: AntigravityIcon, className: "" },
  { name: "Grok Build", Icon: GrokIcon, className: "text-on-surface" },
  { name: "Devin CLI", Icon: DevinIcon, className: "text-on-surface" },
  { name: "Pi", Icon: PiIcon, className: "text-on-surface" },
  { name: "Factory Droid", Icon: DroidIcon, className: "text-on-surface" },
] as const;

export default function ProviderMarkRow({
  centered = false,
  showLabels = false,
}: {
  centered?: boolean;
  showLabels?: boolean;
}) {
  return (
    <div
      role="list"
      aria-label="Supported coding-agent runtimes"
      className={`flex flex-wrap items-center gap-2 ${centered ? "justify-center" : ""}`}
    >
      {marks.map(({ name, Icon, className }) => (
        <Chip
          key={name}
          render={<div />}
          role="listitem"
          title={name}
          variant="elevated"
          className={
            showLabels ? "gap-2" : "size-11 justify-center px-0 has-data-[slot=chip-leading]:pl-0"
          }
          icon={<Icon className={`size-5 ${className}`} aria-hidden="true" />}
        >
          <span className={showLabels ? "text-label-large text-on-surface" : "sr-only"}>
            {name}
          </span>
        </Chip>
      ))}
    </div>
  );
}
