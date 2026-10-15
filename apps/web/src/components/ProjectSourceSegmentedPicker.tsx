// FILE: ProjectSourceSegmentedPicker.tsx
// Purpose: Switches between local-folder and GitHub project setup.
// Layer: Web UI dialog control
// Exports: ProjectSourceSegmentedPicker, ProjectSource
// Why: Tabs describe the two mutually exclusive project-source forms directly.

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
