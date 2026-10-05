// FILE: StudioArtifactsSidebar.tsx
// Purpose: The Studio surface's left column — the agent-produced artifacts for this workspace,
//          grouped by their Outbox category, replacing the course file tree while the Studio
//          surface is active.
// Layer: Editor workspace sidebar
// Exports: StudioArtifactsSidebar
// Depends on: studio.listThreadOutputs WS method + shell.showInFolder.
// Why: Studio is the agent's output surface, so its left column lists what the agent produced
//      rather than what the student brought. The workspace and the chat rail are unchanged
//      across both surfaces; only this column and the center swap.

import type { StudioOutputEntry } from "@synara/contracts";
import { isSupportedLocalImagePath } from "@synara/shared/localPreviewFiles";

import { formatRelativeTime } from "~/lib/relativeTime";
import { groupStudioOutputsByCategory, studioOutputCategory } from "~/lib/studioOutputCategory";
import { humanizeStudioOutputName } from "~/lib/studioOutputDisplay";
import { cn } from "~/lib/utils";
import { useWorkspaceFileOpener } from "~/lib/workspaceFileOpener";
import { readNativeApi } from "~/nativeApi";

import { EXPLORER_ROW_PROPS, useExplorerListNavigation } from "./explorerListNavigation";
import { FileEntryIcon } from "./FileEntryIcon";
import { PanelStateMessage } from "./PanelStateMessage";
import { fileRowClassName } from "./fileRowStyles";
import { EXPLORER_SIDEBAR_CONTAINER_CLASS } from "./workspaceExplorer";

function revealEntryInFinder(entry: StudioOutputEntry) {
  const api = readNativeApi();
  void api?.shell.showInFolder(entry.fullPath).catch(() => {});
}

function StudioArtifactIcon({ entry }: { entry: StudioOutputEntry }) {
  // Images skip the extension colour (bright green) and use the row's foreground so
  // they sit flush with the rest of the sidebar, matching the explorer rows.
  const isImage = isSupportedLocalImagePath(entry.name);
  return (
    <FileEntryIcon
      pathValue={entry.name}
      kind="file"
      mimeType={null}
      {...(isImage ? { colorMode: "inherit" as const } : {})}
      className={cn(
        "size-3.5 shrink-0 opacity-75",
        isImage && "text-[var(--color-text-foreground)]",
      )}
    />
  );
}

export function StudioArtifactsSidebar(props: {
  entries: ReadonlyArray<StudioOutputEntry>;
  isLoading: boolean;
  selectedOutputPath: string | null;
  containerClassName?: string;
  onSelectOutput: (entry: StudioOutputEntry) => void;
}) {
  const fileOpener = useWorkspaceFileOpener();
  // Arrow-key roving focus across the artifact rows, matching the explorer and search lists.
  const handleListKeyDown = useExplorerListNavigation();
  const containerClassName = props.containerClassName ?? EXPLORER_SIDEBAR_CONTAINER_CLASS;

  const groups = groupStudioOutputsByCategory(props.entries, (entry) =>
    studioOutputCategory(entry.relativePath),
  );

  // Clicking previews the artifact in the center pane, which is the Studio surface's
  // whole point — routing through the dock opener as well would open the same file twice.
  // Meta/ctrl-click reveals it in the Finder instead, matching the explorer rows.
  const openEntry = (entry: StudioOutputEntry, forceFinderReveal: boolean) => {
    if (forceFinderReveal) {
      revealEntryInFinder(entry);
      return;
    }
    props.onSelectOutput(entry);
  };

  // Only a first load shows a spinner. A refetch of an already-populated list must not
  // replace the student's artifacts with a loading state — they may be reading one.
  if (props.isLoading && groups.length === 0) {
    return (
      <aside className={containerClassName} data-testid="studio-artifacts-sidebar">
        <PanelStateMessage density="compact">Loading your work…</PanelStateMessage>
      </aside>
    );
  }

  if (groups.length === 0) {
    // Reached only once the query has actually resolved: the loading branch above owns the
    // pending case, so this message cannot claim "nothing here yet" about work that has
    // simply not arrived from the server yet.
    return (
      <aside className={containerClassName} data-testid="studio-artifacts-sidebar">
        <PanelStateMessage density="compact">
          Nothing here yet. Ask for a lesson, a quiz, or a revision sheet and it lands here.
        </PanelStateMessage>
      </aside>
    );
  }

  return (
    <aside
      className={containerClassName}
      data-testid="studio-artifacts-sidebar"
      onKeyDown={handleListKeyDown}
    >
      <div className="min-h-0 flex-1 overflow-y-auto py-1.5">
        {groups.map((group) => (
          <section key={group.category}>
            <h3 className="px-3 pb-1 pt-2 text-ui-xs font-medium text-muted-foreground/70">
              {group.category}
            </h3>
            {group.entries.map((entry) => {
              const selected = entry.fullPath === props.selectedOutputPath;
              return (
                <button
                  key={entry.fullPath}
                  type="button"
                  {...EXPLORER_ROW_PROPS}
                  className={fileRowClassName(selected, "h-7 pr-2")}
                  title={entry.relativePath}
                  aria-pressed={selected}
                  onClick={(event) => openEntry(entry, event.metaKey || event.ctrlKey)}
                  onMouseEnter={() => fileOpener?.prefetchFile?.(entry.fullPath)}
                >
                  <StudioArtifactIcon entry={entry} />
                  <span className={cn("min-w-0 flex-1 truncate", selected && "text-foreground")}>
                    {humanizeStudioOutputName(entry.name)}
                  </span>
                  <span className="shrink-0 text-ui-xs tabular-nums text-muted-foreground/50">
                    {formatRelativeTime(entry.modifiedAt)}
                  </span>
                </button>
              );
            })}
          </section>
        ))}
      </div>
    </aside>
  );
}
