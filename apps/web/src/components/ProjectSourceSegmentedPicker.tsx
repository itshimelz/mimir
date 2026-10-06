// FILE: ProjectSourceSegmentedPicker.tsx
// Purpose: How a project is added (a local folder or a GitHub repository), as M3
//          segmented tabs over the dialog's two form bodies.
// Layer: Web UI dialog control
// Exports: ProjectSourceSegmentedPicker, ProjectSource
// Why: Material 3 Expressive segmented tabs. The Folder/GitHub choice swaps the whole
//      field set below it, so tabs are the honest role — the previous control was a
//      radio group wearing a raised thumb that overhangs its track.

import { GitHubIcon, FolderIcon } from "~/lib/icons";

import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

export type ProjectSource = "local" | "github";

export function ProjectSourceSegmentedPicker(props: {
  readonly value: ProjectSource;
  readonly disabled: boolean;
  readonly githubAvailable: boolean;
  readonly onValueChange: (value: ProjectSource) => void;
  readonly className?: string;
}) {
  return (
    <Tabs
      className={props.className}
      onValueChange={(next) => {
        if (next === "local" || next === "github") props.onValueChange(next);
      }}
      value={props.value}
    >
      <TabsList className="w-full" variant="segmented">
        <TabsTrigger disabled={props.disabled} value="local">
          <FolderIcon aria-hidden="true" />
          Folder
        </TabsTrigger>
        <TabsTrigger
          disabled={props.disabled || !props.githubAvailable}
          title={
            props.githubAvailable ? undefined : "Update the Mimir server to add GitHub projects."
          }
          value="github"
        >
          <GitHubIcon aria-hidden="true" />
          GitHub
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
