// FILE: ChangelogPicker.tsx
// Purpose: Compact release picker shown in the header on small screens (where the
//          right-rail doesn't fit). A native <select> — so phones get the OS
//          wheel/list picker — that jumps to the chosen release and reflects the
//          one currently in view. Hidden at md+ (the rail takes over).
// Layer: Client component (M3E native select); shares scroll-spy with the rail.

"use client";

import { NativeSelect, NativeSelectOption } from "@/components/m3e/native-select";
import { type ChangelogNavItem, useActiveAnchor } from "@/lib/useActiveAnchor";

export default function ChangelogPicker({ items }: { items: ChangelogNavItem[] }) {
  const { active, jumpTo } = useActiveAnchor(items);

  return (
    <NativeSelect
      size="sm"
      aria-label="Jump to release"
      value={active ?? items[0]?.anchor ?? ""}
      onChange={(event) => jumpTo(event.target.value)}
      className="inline-flex md:hidden"
    >
      {items.map((item) => (
        <NativeSelectOption key={item.anchor} value={item.anchor}>
          {item.version} · {item.date}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
