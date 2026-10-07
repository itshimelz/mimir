import type { KeyboardEvent, ReactNode } from "react";

import { GitHubIcon, FolderIcon } from "~/lib/icons";
import { cn } from "~/lib/utils";

import { Button } from "./ui/button";
import { dialogFieldLabelClassName } from "./ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";

export const PROJECT_DIALOG_FIELD_CONTROL_CLASS_NAME =
  // Height and corner only: the outline and its focus/invalid colours come from the
  // InputGroup shell, so a grouped field cannot drift from a bare one.
  "h-9 rounded-lg";

export function CreateGitHubProjectFields(props: {
  readonly repositoryInputId: string;
  readonly destinationParentInputId: string;
  readonly directoryNameInputId: string;
  readonly errorId: string;
  readonly repositoryInput: string;
  readonly destinationParent: string;
  readonly directoryName: string;
  readonly finalClonePath: string;
  readonly formError: string | null;
  readonly provisionProgress: string | null;
  readonly isElectron: boolean;
  readonly isPickingFolder: boolean;
  readonly submitting: boolean;
  readonly onRepositoryChange: (value: string) => void;
  readonly onDestinationParentChange: (value: string) => void;
  readonly onDirectoryNameChange: (value: string) => void;
  readonly onBrowse: () => void;
  readonly onSubmitKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-foreground/10 bg-foreground/[0.025] px-3.5 py-3">
        <p className="text-ui font-medium text-foreground">What you need</p>
        <ol className="mt-2.5 space-y-2">
          <GitHubRequirement index={1} title="Repository">
            Paste an <span className="font-medium text-foreground">owner/repository</span> name or
            its GitHub URL.
          </GitHubRequirement>
          <GitHubRequirement index={2} title="Destination">
            Choose the parent folder where Mimir should create the checkout.
          </GitHubRequirement>
          <GitHubRequirement index={3} title="Private access">
            Public repositories work immediately. For private repositories, run{" "}
            <code className="font-mono text-foreground">gh auth login</code> or configure Git
            credentials.
          </GitHubRequirement>
        </ol>
      </div>

      <div className="space-y-2">
        <label htmlFor={props.repositoryInputId} className={cn("block", dialogFieldLabelClassName)}>
          Repository
        </label>
        <InputGroup className={PROJECT_DIALOG_FIELD_CONTROL_CLASS_NAME}>
          <InputGroupAddon className="w-10 self-stretch border-e border-m3-outline-variant ps-0">
            <GitHubIcon className="size-4 text-m3-on-surface-variant" aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            id={props.repositoryInputId}
            value={props.repositoryInput}
            aria-invalid={props.formError ? true : undefined}
            {...(props.formError ? { "aria-describedby": props.errorId } : {})}
            placeholder="owner/repository or GitHub URL"
            autoComplete="off"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            onChange={(event) => props.onRepositoryChange(event.target.value)}
            onKeyDown={props.onSubmitKeyDown}
          />
        </InputGroup>
      </div>

      <div className="space-y-2">
        <label
          htmlFor={props.destinationParentInputId}
          className={cn("block", dialogFieldLabelClassName)}
        >
          Clone into
        </label>
        <div className="flex items-center gap-2">
          <InputGroup className={cn(PROJECT_DIALOG_FIELD_CONTROL_CLASS_NAME, "min-w-0 flex-1")}>
            <InputGroupAddon className="w-10 self-stretch border-e border-m3-outline-variant ps-0">
              <FolderIcon className="size-4 text-m3-on-surface-variant" aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id={props.destinationParentInputId}
              value={props.destinationParent}
              placeholder="/parent/folder"
              autoComplete="off"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              onChange={(event) => props.onDestinationParentChange(event.target.value)}
              onKeyDown={props.onSubmitKeyDown}
            />
          </InputGroup>
          <Button
            type="button"
            variant="outline"
            className={cn(PROJECT_DIALOG_FIELD_CONTROL_CLASS_NAME, "shrink-0 px-3")}
            disabled={props.isPickingFolder || props.submitting}
            onClick={props.onBrowse}
          >
            Browse
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor={props.directoryNameInputId}
          className={cn("block", dialogFieldLabelClassName)}
        >
          Folder name
        </label>
        <InputGroup className={PROJECT_DIALOG_FIELD_CONTROL_CLASS_NAME}>
          <InputGroupInput
            id={props.directoryNameInputId}
            value={props.directoryName}
            placeholder="repository"
            autoComplete="off"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            onChange={(event) => props.onDirectoryNameChange(event.target.value)}
            onKeyDown={props.onSubmitKeyDown}
          />
        </InputGroup>
        {props.finalClonePath ? (
          <p className="truncate text-ui-xs text-m3-on-surface-variant">
            Final location: {props.finalClonePath}
          </p>
        ) : null}
      </div>

      {props.provisionProgress ? (
        <p role="status" className="text-ui-xs text-m3-on-surface-variant">
          {props.provisionProgress}
        </p>
      ) : null}
    </div>
  );
}

function GitHubRequirement(props: {
  readonly index: number;
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <li className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-2 text-ui-xs leading-4 text-muted-foreground">
      <span
        aria-hidden
        className="mt-px flex size-4 items-center justify-center rounded-full bg-foreground/7 text-ui-2xs font-semibold text-foreground/70"
      >
        {props.index}
      </span>
      <span>
        <span className="font-medium text-foreground">{props.title}.</span> {props.children}
      </span>
    </li>
  );
}
