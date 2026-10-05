// FILE: SponsorRow.tsx
// Purpose: The one sponsor list row — avatar/logo, name, quiet meta line — shared by
//          /sponsors and the preview strip on /sponsor.
// Layer: Presentational component (M3E item + avatar)
// Depends on: next/image, data/sponsors, lib/sponsors
//
// Why one row and not a set of tiles:
//   The wall used to render two different shapes (a bordered chip and a large
//   featured card), which turned a short list of names into a heavy grid of
//   boxes. A sponsor list reads better as a list — no card chrome, no borders,
//   just the avatar and the name, with hover as the only affordance. Tier
//   recognition is carried by ORDER and by the logo swap below, not by making
//   some names physically larger than others.

import Image from "next/image";
import type { Sponsor } from "@/data/sponsors";
import { sponsorLink, sponsorMetaLabel } from "@/lib/sponsors";
import { Avatar, AvatarImage } from "@/components/m3e/avatar";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/m3e/item";

export function SponsorRow({ sponsor }: { sponsor: Sponsor }) {
  const meta = sponsorMetaLabel(sponsor);

  return (
    <Item
      size="sm"
      render={
        <a href={sponsorLink(sponsor)} target="_blank" rel="noopener noreferrer" />
      }
      className="-mx-2 rounded-xl hover:bg-on-surface/8"
    >
      {sponsor.logoUrl ? (
        // The $149+ tiers are sold on logo placement, so a sponsor who has sent
        // a logo gets it shown in place of the avatar — same row, same height.
        <ItemMedia variant="image" className="h-9 w-[132px] rounded-sm bg-transparent">
          <Image
            src={sponsor.logoUrl}
            alt={`${sponsor.name} logo`}
            width={132}
            height={36}
            className="h-9 w-auto max-w-[132px] object-contain object-left"
          />
        </ItemMedia>
      ) : (
        <Avatar size="sm">
          <AvatarImage src={sponsor.avatarUrl} alt="" />
        </Avatar>
      )}

      <ItemContent>
        <ItemTitle>{sponsor.name}</ItemTitle>
        {meta ? <ItemDescription>{meta}</ItemDescription> : null}
      </ItemContent>
    </Item>
  );
}
