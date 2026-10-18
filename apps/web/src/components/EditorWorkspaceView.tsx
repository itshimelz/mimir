// FILE: EditorWorkspaceView.tsx
// Purpose: The workspace surface: file explorer, workspace file search, file/diff
//          preview, and chat, split into two product surfaces — Study (the course's
//          own files) and Studio (the artifacts the agent produced). Both share one
//          workspace and one chat rail; only the left column and center swap.
// Layer: Chat route presentation

import type { ProjectId, SpaceIconName, SpaceId, StudioOutputEntry } from "@synara/contracts";
import type { FileDiffMetadata } from "@pierre/diffs/react";
import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { BookOpenIcon, ChatBubbleIcon, SparkleIcon } from "~/lib/icons";
import {
  useDesktopTopBarTrafficLightGutterClassName,
  useDesktopTopBarWindowControlsGutterClassName,
} from "~/hooks/useDesktopTopBarGutter";
import type { ChatFileReference } from "~/lib/chatReferences";
import type { DiffEditBaseRev } from "~/lib/diffEditBaseRev";
import { type EditorCenterMode, type EditorSurface } from "~/lib/editorCenterMode";
import type { FileCommentSelection } from "~/lib/fileComments";
import type { PptxAnnotationDraft, PptxAnnotationSelection } from "~/lib/pptxAnnotations";
import { cn } from "~/lib/utils";
import { useTheme } from "~/hooks/useTheme";
import {
  ChatHeaderIconButton,
  CHAT_SURFACE_HEADER_DIVIDER_CLASS_NAME,
  CHAT_SURFACE_HEADER_HEIGHT_CLASS,
} from "./chat/chatHeaderControls";
import { CHAT_BACKGROUND_CLASS_NAME } from "./chat/composerPickerStyles";
import {
  clampEditorChatPaneWidth,
  EDITOR_CHAT_PANE_DEFAULT_WIDTH,
  resolveEditorPaneBounds,
  shouldAcceptEditorChatPaneWidth,
} from "./EditorWorkspaceView.logic";
import { StudioEmptyState } from "./chat/StudioEmptyState";
import { Button } from "./ui/button";
import { SidebarHeaderNavigationControls } from "./SidebarHeaderNavigationControls";
import { ApplicationMenuBar } from "./ApplicationMenuBar";
import type { ProjectMenuPickerOption } from "./ProjectMenuPicker";
import { SegmentedPicker } from "./SegmentedPicker";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import {
  SIDEBAR_OFFCANVAS_MOTION_CLASS,
  Sidebar,
  SidebarProvider,
  SidebarRail,
  useOptionalSidebar,
} from "./ui/sidebar";
import { WorkspaceFileDiffEditorPane } from "./chat/WorkspaceFileDiffEditorPane";
import { useQueryClient } from "@tanstack/react-query";
import { flushWorkspaceEditors } from "~/lib/workspaceEditorSession";
import { WorkspaceFileEditorPane } from "./chat/WorkspaceFileEditorPane";
import { WorkspaceFilePreview } from "./WorkspaceFilePreview";
import { useEditorSurfaceStore } from "~/editorSurfaceStore";

const EDITOR_CHAT_PANE_STORAGE_KEY = "synara.editor.chatPaneWidth";
const EDITOR_CHAT_PANE_VISIBLE_STORAGE_KEY = "synara.editor.chatPaneVisible";

interface EditorWorkspaceViewProps {
  workspaceRoot: string | null;
  projectName: string | null;
  currentProjectId?: ProjectId | null;
  projectOptions?: ReadonlyArray<ProjectMenuPickerOption>;
  /** The Space (course) this workspace belongs to; shown above the project row. */
  spaceId?: SpaceId | null;
  spaceName?: string | null;
  spaceIcon?: SpaceIconName;
  onSelectSpace?: (spaceId: SpaceId | null) => void;
  selectedFilePath: string | null;
  expandedDirectories: ReadonlySet<string>;
  centerMode: EditorCenterMode;
  diffFiles: ReadonlyArray<FileDiffMetadata>;
  diffFilesLoading?: boolean;
  selectedDiffFilePath: string | null;
  diffOptionsControl?: ReactNode;
  diffPanel: ReactNode;
  chatPanel: ReactNode;
  onSelectFile: (path: string | null) => void;
  onSelectDiffFile: (path: string) => void;
  onToggleDirectory: (path: string) => void;
  editFilePath: string | null;
  editDiffBasePath?: string | null;
  editDiffBaseRev: DiffEditBaseRev | null;
  onCenterModeChange: (mode: EditorCenterMode) => void;
  onEditFile: (filePath: string) => void;
  onCloseEdit: () => void;
  /**
   * Lets the owner route its own editor-replacing actions (chat file links,
   * diff toggles) through the same dirty/saving guard as in-view exits.
   */
  leaveGuardRef?: RefObject<EditorLeaveGuard | null> | undefined;
  onReferenceInChat?: (reference: ChatFileReference) => void;
  onAskWhyInChat?: (reference: ChatFileReference) => void;
  onCommentInChat?: (comment: FileCommentSelection) => void;
  pptxAnnotations?: ReadonlyArray<PptxAnnotationDraft>;
  onPptxCommentInChat?: (annotation: PptxAnnotationSelection) => void;
  onSelectStarterPrompt?: (prompt: string) => void;
  onSelectProject?: (projectId: ProjectId) => void;
  /** Agent-produced artifacts backing the Studio surface. Undefined while Studio has no data. */
  studioOutputs?: ReadonlyArray<StudioOutputEntry>;
  studioOutputsLoading?: boolean;
}

function readStoredEditorChatPaneWidth(): number {
  if (typeof window === "undefined") {
    return EDITOR_CHAT_PANE_DEFAULT_WIDTH;
  }

  try {
    const rawValue = window.localStorage.getItem(EDITOR_CHAT_PANE_STORAGE_KEY);
    const parsed = rawValue === null ? Number.NaN : Number.parseFloat(rawValue);
    return Number.isFinite(parsed)
      ? clampEditorChatPaneWidth(parsed)
      : EDITOR_CHAT_PANE_DEFAULT_WIDTH;
  } catch {
    return EDITOR_CHAT_PANE_DEFAULT_WIDTH;
  }
}

function storeEditorChatPaneWidth(width: number): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      EDITOR_CHAT_PANE_STORAGE_KEY,
      String(clampEditorChatPaneWidth(width)),
    );
  } catch {
    // Best-effort preference persistence only.
  }
}

function readStoredEditorVisibility(key: string): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  try {
    return window.localStorage.getItem(key) !== "false";
  } catch {
    return true;
  }
}

function storeEditorVisibility(key: string, visible: boolean): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(key, String(visible));
  } catch {
    // Best-effort preference persistence only.
  }
}

export interface EditorLeaveGuard {
  guardLeavingEdit: (run: () => void) => void;
}

/**
 * The seam between the center workspace and the chat rail.
 *
 * `SidebarRail` supplies the 16px hit area and the pointer drag; this only paints it. The
 * shared rail's own `after` line is transparent at rest (a hit area, not a divider).
 *
 * The line sits one pixel INSIDE the panel's leading edge rather than centered on it. The
 * provider above is paint-contained, which clips everything at its own left edge, so a line
 * centered on the boundary loses its outer half to the clip and the panel's leading edge
 * draws nothing at all. One pixel in, the hairline paints whole and the 3px hover/drag
 * accent still has all three pixels to spend.
 *
 * The resting weight is the shared `--seam-line`, the same outer-content-edge value the
 * sidebar↔route divider uses, and not `--app-surface-divider`: that internal-divider token
 * is thinned to a fraction of `--color-border` and disappeared entirely at this edge,
 * which is why the rail read as a flat continuation of the workspace. The line widens to a
 * 3px accent only while the seam is hoverable or grabbed. The `data-resizing` variants
 * matter because a drag outruns the 16px hit area immediately — without them the highlight
 * would blink off on the first pointer move.
 */
function EditorWorkspaceSeamRail() {
  return (
    <SidebarRail
      className={cn(
        "before:absolute before:inset-y-0 before:left-[calc(50%+1px)] before:w-px",
        "before:bg-[var(--seam-line)]",
        "before:transition-[width,background-color] before:duration-150 before:ease-out",
        "hover:before:w-[3px] hover:before:bg-foreground/45",
        "data-[resizing]:before:w-[3px] data-[resizing]:before:bg-foreground/45",
        // The rail stays mounted (pointer-events: none) while the chat pane is collapsed,
        // where it would otherwise draw a line on the window edge.
        "group-data-[collapsible=offcanvas]:group-data-[state=collapsed]:before:hidden",
      )}
    />
  );
}

export function EditorWorkspaceView(props: EditorWorkspaceViewProps) {
  // The editor header sits flush against the window's left edge whenever the
  // global sidebar is collapsed, so it has to clear the macOS traffic lights the
  // same way every other chat-surface header does.
  const trafficLightGutterClassName = useDesktopTopBarTrafficLightGutterClassName();
  const { activeTheme, resolvedTheme: editorResolvedTheme } = useTheme();
  const isMimirTheme = activeTheme?.codeThemeId === "synara";
  const [chatPaneWidth, setChatPaneWidth] = useState(readStoredEditorChatPaneWidth);
  const [chatPaneVisible, setChatPaneVisible] = useState(() =>
    readStoredEditorVisibility(EDITOR_CHAT_PANE_VISIBLE_STORAGE_KEY),
  );
  // Study is the course surface (explore/read/write the course's own files); Studio is the
  // agent surface (artifacts and lessons it produced). Shared in useEditorSurfaceStore so the
  // left sidebar and this center view stay in sync.
  const surface = useEditorSurfaceStore((state) => state.surface);
  const setSurface = useEditorSurfaceStore((state) => state.setSurface);
  const selectedStudioOutputPath = useEditorSurfaceStore((state) => state.selectedStudioOutputPath);
  const setSelectedStudioOutputPath = useEditorSurfaceStore(
    (state) => state.setSelectedStudioOutputPath,
  );
  const selectedStudioOutput =
    props.studioOutputs?.find((entry) => entry.fullPath === selectedStudioOutputPath) ?? null;
  // The file preview unmounts in Diff/Edit mode. Keep explicit Markdown choices
  // in the editor shell, scoped to the workspace and file for this session.
  const [markdownPreviewModes, setMarkdownPreviewModes] = useState<ReadonlyMap<string, boolean>>(
    () => new Map(),
  );
  const markdownPreviewKey = `${props.workspaceRoot ?? ""}\0${props.selectedFilePath ?? ""}`;
  const handleMarkdownPreviewChange = (rendered: boolean) => {
    setMarkdownPreviewModes((current) => new Map(current).set(markdownPreviewKey, rendered));
  };

  // When workspaceRoot changes (e.g. workspace/course switched), clear any selected file from the old root
  const previousWorkspaceRootRef = useRef(props.workspaceRoot);
  useEffect(() => {
    if (
      previousWorkspaceRootRef.current !== null &&
      props.workspaceRoot !== null &&
      previousWorkspaceRootRef.current !== props.workspaceRoot
    ) {
      props.onSelectFile(null);
    }
    previousWorkspaceRootRef.current = props.workspaceRoot;
  }, [props.workspaceRoot, props.onSelectFile]);

  const desktopTopBarWindowControlsGutterClassName =
    useDesktopTopBarWindowControlsGutterClassName();

  // Both panes are width-bounded, and the two bounds are coupled: the rail's ceiling is a
  // function of the row width (see resolveEditorPaneBounds), so it has to be recomputed from
  // the live row box rather than read once. A ResizeObserver covers the window resize and the
  // rail being dragged; the stored width is re-clamped against the new row so a pane saved on
  // a wide monitor cannot open wider than the current window allows.
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [rowWidth, setRowWidth] = useState(0);
  useEffect(() => {
    const row = rowRef.current;
    if (!row) {
      return;
    }
    const measure = () => {
      const next = row.clientWidth;
      setRowWidth((current) => (Math.abs(current - next) < 1 ? current : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, []);

  const paneBounds = useMemo(() => resolveEditorPaneBounds(rowWidth), [rowWidth]);
  // The stored preference is the user's chosen width; the floor/ceiling only ever move it
  // toward a width this window can actually show.
  const effectiveChatPaneWidth = useMemo(
    () => clampEditorChatPaneWidth(chatPaneWidth, rowWidth || undefined),
    [chatPaneWidth, rowWidth],
  );

  const queryClient = useQueryClient();
  const leaveRequestRef = useRef(0);
  const guardLeavingEdit = useCallback(
    (run: () => void) => {
      const request = ++leaveRequestRef.current;
      void flushWorkspaceEditors(queryClient, props.workspaceRoot).then((saved) => {
        if (saved && request === leaveRequestRef.current) run();
      });
    },
    [queryClient, props.workspaceRoot],
  );
  useImperativeHandle(props.leaveGuardRef, () => ({ guardLeavingEdit }), [guardLeavingEdit]);
  // Leaving a dirty editor for the other surface would strand the buffer in the pane the
  // student just left, so the surface switch runs through the same flush as every other
  // editor-replacing action.
  const handleSelectSurface = (next: EditorSurface) => {
    if (next === surface) {
      return;
    }
    guardLeavingEdit(() => {
      setSurface(next);
      setSelectedStudioOutputPath(null);
    });
  };
  const toggleChatPaneVisible = () => {
    setChatPaneVisible((previous) => {
      const next = !previous;
      storeEditorVisibility(EDITOR_CHAT_PANE_VISIBLE_STORAGE_KEY, next);
      return next;
    });
  };

  const sidebar = useOptionalSidebar();
  const sidebarOpen = sidebar?.open ?? false;

  return (
    <div
      data-editor-workspace
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col app-content-surface text-foreground"
    >
      <div
        className={cn(
          "app-top-bar relative flex shrink-0 items-center justify-between px-2 sm:px-3",
          CHAT_SURFACE_HEADER_HEIGHT_CLASS,
          CHAT_SURFACE_HEADER_DIVIDER_CLASS_NAME,
          desktopTopBarWindowControlsGutterClassName,
        )}
      >
        {/* Left Column: Navigation controls when sidebar collapsed */}
        <div
          className={cn(
            "relative z-10 flex min-w-0 max-w-[calc(50%-110px)] items-center gap-2",
            trafficLightGutterClassName,
          )}
        >
          {sidebar ? (
            <SidebarHeaderNavigationControls collapsedGapClassName="-me-2 sm:-me-3" />
          ) : null}
          {!sidebarOpen ? <ApplicationMenuBar className="ms-1 shrink-0" /> : null}
        </div>

        {/* Center: Segmented Surface Picker (Study vs Studio), placed exactly in the middle of the topbar */}
        <div className="pointer-events-none absolute inset-x-0 flex items-center justify-center">
          <div className="pointer-events-auto">
            {isMimirTheme ? (
              <Tabs
                value={surface}
                onValueChange={(val) => handleSelectSurface(val as EditorSurface)}
                className="shrink-0"
              >
                <TabsList variant="segmented" aria-label="Surface" className="h-9 p-0.5">
                  <TabsTrigger
                    value="study"
                    title="Study — course notes, slides & materials"
                    className="px-3 gap-1.5 text-ui-xs"
                  >
                    <BookOpenIcon className="size-3.5" />
                    <span>Study</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="studio"
                    title="Studio — deliverables produced by Mimir"
                    className="px-3 gap-1.5 text-ui-xs"
                  >
                    <SparkleIcon className="size-3.5" />
                    <span>Studio</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            ) : (
              <SegmentedPicker
                className="w-[9.5rem] shrink-0"
                ariaLabel="Surface"
                value={surface}
                onValueChange={handleSelectSurface}
                options={[
                  { value: "study", label: "Study" },
                  { value: "studio", label: "Studio" },
                ]}
              />
            )}
          </div>
        </div>

        {/* Right Column: Single Study Chat toggle button */}
        <div className="relative z-10 flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          <Button
            variant={chatPaneVisible ? "secondary" : "outlined"}
            size="xs"
            aria-pressed={chatPaneVisible}
            aria-label={chatPaneVisible ? "Hide study chat" : "Show study chat"}
            title={chatPaneVisible ? "Hide study chat" : "Show study chat"}
            onClick={toggleChatPaneVisible}
            className={cn(
              "gap-1.5 text-ui-xs font-medium",
              chatPaneVisible && "bg-primary/10 text-primary border-primary/25",
            )}
          >
            <ChatBubbleIcon className="size-3.5" />
            <span className="hidden sm:inline">Study Chat</span>
          </Button>
        </div>
      </div>
      <div ref={rowRef} className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:flex-row">
          {/* The center pane carries its own floor in CSS as well as in the drag
              contract: `flex-1` alone lets it collapse to nothing when the rail is dragged to
              its own maximum. When the rail is collapsed off-canvas, `flex-1` lets the preview
              stretch to the full width of the workspace. */}
          <main
            className="flex min-h-[16rem] min-w-0 flex-1 border-b border-border/65 lg:h-full lg:border-b-0"
            style={
              {
                minWidth: paneBounds.centerMinWidth,
              } as CSSProperties
            }
          >
            {/* Studio reviews what the agent produced, in the same viewer Study uses.
                `StudioOutputEntry.relativePath` is resolved against the thread's own
                workspace root (apps/server/src/studioOutputs.ts:393), so the course
                workspace is the correct containment root here. */}
            {surface === "studio" ? (
              selectedStudioOutput ? (
                <div className="flex min-h-0 min-w-0 flex-1">
                  <WorkspaceFilePreview
                    workspaceRoot={props.workspaceRoot}
                    filePath={selectedStudioOutput.relativePath}
                    markdownPreviewEnabled
                    onReferenceInChat={props.onReferenceInChat}
                    onAskWhyInChat={props.onAskWhyInChat}
                    onClose={() => setSelectedStudioOutputPath(null)}
                  />
                </div>
              ) : (
                <StudioEmptyState
                  spaceIcon={props.spaceIcon}
                  spaceName={props.spaceName}
                  hasOutputs={(props.studioOutputs?.length ?? 0) > 0}
                  onSelectStarterPrompt={props.onSelectStarterPrompt}
                  onOpenChat={() => setChatPaneVisible(true)}
                />
              )
            ) : (
              <>
                {/* Keep the diff panel mounted while browsing files: unmounting it
                drops the parsed patch, diff worker pool, and query subscriptions,
                which made every Files -> Diff switch a cold multi-second reload. */}
                <div
                  className={cn("min-h-0 min-w-0 flex-1", props.centerMode !== "diff" && "hidden")}
                >
                  {props.diffPanel}
                </div>
                {props.centerMode === "fileEdit" && props.editFilePath !== null ? (
                  <div className="flex min-h-0 min-w-0 flex-1">
                    <WorkspaceFileEditorPane
                      workspaceRoot={props.workspaceRoot}
                      filePath={props.editFilePath}
                      resolvedTheme={editorResolvedTheme}
                      onClose={props.onCloseEdit}
                    />
                  </div>
                ) : props.centerMode === "diffEdit" && props.editFilePath !== null ? (
                  <div className="flex min-h-0 min-w-0 flex-1">
                    <WorkspaceFileDiffEditorPane
                      workspaceRoot={props.workspaceRoot}
                      filePath={props.editFilePath}
                      basePath={props.editDiffBasePath ?? null}
                      baseRev={props.editDiffBaseRev ?? { rev: "HEAD" }}
                      resolvedTheme={editorResolvedTheme}
                      onClose={props.onCloseEdit}
                    />
                  </div>
                ) : props.centerMode === "file" ? (
                  <div className="flex min-h-0 min-w-0 flex-1">
                    <WorkspaceFilePreview
                      workspaceRoot={props.workspaceRoot}
                      filePath={props.selectedFilePath}
                      markdownPreviewEnabled={markdownPreviewModes.get(markdownPreviewKey) ?? true}
                      onMarkdownPreviewChange={handleMarkdownPreviewChange}
                      onReferenceInChat={props.onReferenceInChat}
                      onAskWhyInChat={props.onAskWhyInChat}
                      onCommentInChat={props.onCommentInChat}
                      pptxAnnotations={props.pptxAnnotations}
                      onPptxCommentInChat={props.onPptxCommentInChat}
                      onEditFile={props.onEditFile}
                      onClose={() => props.onSelectFile(null)}
                    />
                  </div>
                ) : null}
              </>
            )}
          </main>
          {/* Right dock panel: ONLY the chat in editor view.

              `data-sidebar-block-inset` marks this rail as the one whose provider IS the
              containing block for its `fixed` panel (it carries `contain: paint`), so the
              panel is already flush with the rail block's inset. The rail-layout rule that
              offsets the RightDock by the shell gap has to skip it: the extra offset used to
              pull this panel 3px out of its own provider, and those 3px are exactly what the
              provider's paint containment clipped — taking the panel's leading seam with them
              and leaving the rail flush with the workspace.

              No `border-l` here — the seam belongs to {@link EditorWorkspaceSeamRail}, which
              can also widen it on hover and drag. */}
          <SidebarProvider
            defaultOpen={true}
            open={chatPaneVisible}
            onOpenChange={(open) => {
              setChatPaneVisible(open);
              storeEditorVisibility(EDITOR_CHAT_PANE_VISIBLE_STORAGE_KEY, open);
            }}
            className="relative h-full w-auto min-h-0 flex-none bg-transparent [contain:paint]"
            style={
              {
                "--sidebar-width": `${effectiveChatPaneWidth}px`,
              } as CSSProperties
            }
          >
            <Sidebar
              side="right"
              collapsible="offcanvas"
              data-sidebar-block-inset=""
              className={cn("text-foreground !h-full", SIDEBAR_OFFCANVAS_MOTION_CLASS)}
              innerClassName={CHAT_BACKGROUND_CLASS_NAME}
              gapClassName={SIDEBAR_OFFCANVAS_MOTION_CLASS}
              transparentSurface
              rail={<EditorWorkspaceSeamRail />}
              resizable={{
                minWidth: paneBounds.chatMinWidth,
                maxWidth: paneBounds.chatMaxWidth,
                // The rail's own ceiling already accounts for the center's floor, but a drag
                // is applied before the layout settles, so the same contract is enforced here
                // to stop the center being pushed under its minimum mid-gesture.
                shouldAcceptWidth: ({ nextWidth, wrapper }) =>
                  shouldAcceptEditorChatPaneWidth({
                    nextWidth,
                    rowWidth: wrapper.clientWidth,
                  }),
                storageKey: EDITOR_CHAT_PANE_STORAGE_KEY,
                onResize: (width) => {
                  setChatPaneWidth(width);
                  storeEditorChatPaneWidth(width);
                },
              }}
            >
              <div
                data-right-dock-content
                className="relative flex h-full min-h-0 w-full flex-1 overflow-hidden"
              >
                {props.chatPanel}
              </div>
            </Sidebar>
          </SidebarProvider>
        </div>
      </div>
    </div>
  );
}

export default EditorWorkspaceView;
