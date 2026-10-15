// FILE: DoneStep.tsx
// Purpose: Closing step of the welcome tour: where to go first with the space you set up.
//          The run summary lives in the dialog header.
// Layer: Web UI component

import { SpaceIcon } from "~/components/SpaceIcon";
import { FolderIcon, MessageCircleIcon } from "~/lib/icons";
import type { SpaceIconName } from "@synara/contracts";
import { TourShortcutList } from "./FeatureTourStep";

export function DoneStep(props: {
  readonly spaceLabel: string;
  readonly spaceIcon: SpaceIconName;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5 px-[120px]">
        <p className="text-ui-sm font-medium tracking-[0.04em] text-muted-foreground/70 uppercase">
          Where to go first
        </p>
        <ul className="flex flex-col gap-2">
          <li className="flex items-start gap-2.5 text-ui-lg text-foreground/85">
            <FolderIcon className="mt-[3px] size-4 shrink-0 text-muted-foreground/80" aria-hidden />
            <span>
              Open your notes in <strong className="font-medium text-foreground">Study</strong> and
              ask a question about them.
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-ui-lg text-foreground/85">
            <MessageCircleIcon
              className="mt-[3px] size-4 shrink-0 text-muted-foreground/80"
              aria-hidden
            />
            <span>
              Ask for a lesson or a quiz, then review it in{" "}
              <strong className="font-medium text-foreground">Studio</strong>.
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-ui-lg text-foreground/85">
            <SpaceIcon
              icon={props.spaceIcon}
              className="mt-[3px] size-4 shrink-0 text-muted-foreground/80"
            />
            <span>
              Everything you make stays inside your own{" "}
              <strong className="font-medium text-foreground">{props.spaceLabel}</strong> space.
            </span>
          </li>
        </ul>
      </div>
      <div className="flex flex-col gap-3.5 px-[120px]">
        <p className="text-ui-sm font-medium tracking-[0.04em] text-muted-foreground/70 uppercase">
          Shortcuts worth learning today
        </p>
        <TourShortcutList />
      </div>
    </div>
  );
}
