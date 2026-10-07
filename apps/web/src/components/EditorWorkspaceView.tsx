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
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import {
  ChatBubbleIcon,
  FoldersIcon,
  PanelLeftIcon,
  SparkleIcon,
} from "~/lib/icons";
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
  ChatHeaderButton,
  ChatHeaderIconButton,
  CHAT_SURFACE_HEADER_DIVIDER_CLASS_NAME,
  CHAT_SURFACE_HEADER_HEIGHT_CLASS,
} from "./chat/chatHeaderControls";
import { StudioEmptyState } from "./chat/StudioEmptyState";
import { Button } from "@/components/m3e/button";
import type { ProjectMenuPickerOption } from "./ProjectMenuPicker";
import { SegmentedPicker } from "./SegmentedPicker";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { useOptionalSidebar } from "./ui/sidebar";
import { WorkspaceFileDiffEditorPane } from "./chat/WorkspaceFileDiffEditorPane";
import { useQueryClient } from "@tanstack/react-query";
import { flushWorkspaceEditors } from "~/lib/workspaceEditorSession";
import { WorkspaceFileEditorPane } from "./chat/WorkspaceFileEditorPane";
import { WorkspaceFilePreview } from "./WorkspaceFilePreview";

const EDITOR_CHAT_PANE_STORAGE_KEY = "synara.editor.chatPaneWidth";
const EDITOR_CHAT_PANE_VISIBLE_STORAGE_KEY = "synara.editor.chatPaneVisible";
const EDITOR_SURFACE_STORAGE_KEY = "synara.editor.surface";
const EDITOR_CHAT_PANE_DEFAULT_WIDTH = 384;
const EDITOR_CHAT_PANE_MIN_WIDTH = 280;
const EDITOR_CHAT_PANE_MAX_WIDTH = 960;
const EDITOR_CHAT_PANE_KEYBOARD_STEP = 24;

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
  onSelectFile: (path: string) => void;
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

function clampEditorChatPaneWidth(width: number, maxAvailable?: number): number {
  const max = Math.min(
    EDITOR_CHAT_PANE_MAX_WIDTH,
    maxAvailable ? Math.max(EDITOR_CHAT_PANE_MIN_WIDTH, maxAvailable - 320) : EDITOR_CHAT_PANE_MAX_WIDTH,
  );
  return Math.min(
    max,
    Math.max(EDITOR_CHAT_PANE_MIN_WIDTH, Math.round(width)),
  );
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

function readStoredEditorSurface(): EditorSurface {
  if (typeof window === "undefined") {
    return "study";
  }
  try {
    return window.localStorage.getItem(EDITOR_SURFACE_STORAGE_KEY) === "studio"
      ? "studio"
      : "study";
  } catch {
    return "study";
  }
}

function storeEditorSurface(surface: EditorSurface): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(EDITOR_SURFACE_STORAGE_KEY, surface);
  } catch {
    // Best-effort preference persistence only.
  }
}

interface EditorChatPaneResizeState {
  pointerId: number;
  startX: number;
  startWidth: number;
  pendingWidth: number;
  rafId: number | null;
  restoreBodyCursor: string;
  restoreBodyUserSelect: string;
  onPointerMove: (event: PointerEvent) => void;
  onPointerEnd: (event: PointerEvent) => void;
}

export interface EditorLeaveGuard {
  guardLeavingEdit: (run: () => void) => void;
}

export function EditorWorkspaceView(props: EditorWorkspaceViewProps) {
  // The editor header sits flush against the window's left edge whenever the
  // global sidebar is collapsed, so it has to clear the macOS traffic lights the
  // same way every other chat-surface header does.
  const trafficLightGutterClassName = useDesktopTopBarTrafficLightGutterClassName();
  const optionalSidebar = useOptionalSidebar();
  const { activeTheme, resolvedTheme: editorResolvedTheme } = useTheme();
  const isMimirTheme = activeTheme?.codeThemeId === "synara";
  const [chatPaneWidth, setChatPaneWidth] = useState(readStoredEditorChatPaneWidth);
  const chatPaneResizeStateRef = useRef<EditorChatPaneResizeState | null>(null);
  const [chatPaneVisible, setChatPaneVisible] = useState(() =>
    readStoredEditorVisibility(EDITOR_CHAT_PANE_VISIBLE_STORAGE_KEY),
  );
  // Study is the course surface (explore/read/write the course's own files); Studio is the
  // agent surface (artifacts and lessons it produced). Both share this workspace and the
  // chat rail, so the switch is local state rather than a route.
  const [surface, setSurface] = useState<EditorSurface>(readStoredEditorSurface);
  // Which artifact the student is reviewing in Studio. Local to the shell because the
  // preview itself is opened by the owner through `onSelectStudioOutput`.
  const [selectedStudioOutputPath, setSelectedStudioOutputPath] = useState<string | null>(null);
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
  const desktopTopBarWindowControlsGutterClassName =
    useDesktopTopBarWindowControlsGutterClassName();

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
      storeEditorSurface(next);
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

  const stopChatPaneResize = () => {
    const resizeState = chatPaneResizeStateRef.current;
    if (!resizeState || typeof window === "undefined") {
      return;
    }

    if (resizeState.rafId !== null) {
      window.cancelAnimationFrame(resizeState.rafId);
      resizeState.rafId = null;
    }

    window.removeEventListener("pointermove", resizeState.onPointerMove);
    window.removeEventListener("pointerup", resizeState.onPointerEnd);
    window.removeEventListener("pointercancel", resizeState.onPointerEnd);
    document.body.style.cursor = resizeState.restoreBodyCursor;
    document.body.style.userSelect = resizeState.restoreBodyUserSelect;
    setChatPaneWidth(resizeState.pendingWidth);
    storeEditorChatPaneWidth(resizeState.pendingWidth);
    chatPaneResizeStateRef.current = null;
  };

  useEffect(() => stopChatPaneResize, [stopChatPaneResize]);

  const handleChatPaneResizePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || typeof window === "undefined") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    stopChatPaneResize();

    const parentWrapper = event.currentTarget.parentElement;
    const maxAvailable = parentWrapper?.clientWidth;

    const resizeState: EditorChatPaneResizeState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: chatPaneWidth,
      pendingWidth: chatPaneWidth,
      rafId: null,
      restoreBodyCursor: document.body.style.cursor,
      restoreBodyUserSelect: document.body.style.userSelect,
      onPointerMove: () => undefined,
      onPointerEnd: () => undefined,
    };

    resizeState.onPointerMove = (moveEvent) => {
      if (moveEvent.pointerId !== resizeState.pointerId) {
        return;
      }

      resizeState.pendingWidth = clampEditorChatPaneWidth(
        resizeState.startWidth + resizeState.startX - moveEvent.clientX,
        maxAvailable,
      );

      if (resizeState.rafId !== null) {
        return;
      }

      resizeState.rafId = window.requestAnimationFrame(() => {
        resizeState.rafId = null;
        setChatPaneWidth(resizeState.pendingWidth);
      });
    };

    resizeState.onPointerEnd = (endEvent) => {
      if (endEvent.pointerId !== resizeState.pointerId) {
        return;
      }
      stopChatPaneResize();
    };

    chatPaneResizeStateRef.current = resizeState;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", resizeState.onPointerMove);
    window.addEventListener("pointerup", resizeState.onPointerEnd);
    window.addEventListener("pointercancel", resizeState.onPointerEnd);
  };

  const handleChatPaneResizeDoubleClick = () => {
    setChatPaneWidth(EDITOR_CHAT_PANE_DEFAULT_WIDTH);
    storeEditorChatPaneWidth(EDITOR_CHAT_PANE_DEFAULT_WIDTH);
  };

  const handleChatPaneResizeKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    let nextWidth: number | null = null;

    if (event.key === "ArrowLeft") {
      nextWidth = chatPaneWidth + EDITOR_CHAT_PANE_KEYBOARD_STEP;
    } else if (event.key === "ArrowRight") {
      nextWidth = chatPaneWidth - EDITOR_CHAT_PANE_KEYBOARD_STEP;
    } else if (event.key === "Home") {
      nextWidth = EDITOR_CHAT_PANE_MIN_WIDTH;
    } else if (event.key === "End") {
      nextWidth = EDITOR_CHAT_PANE_MAX_WIDTH;
    }

    if (nextWidth === null) {
      return;
    }

    event.preventDefault();
    const clampedWidth = clampEditorChatPaneWidth(nextWidth);
    setChatPaneWidth(clampedWidth);
    storeEditorChatPaneWidth(clampedWidth);
  };

  return (
    <div
      data-editor-workspace
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col app-content-surface text-foreground"
    >
      <div
        className={cn(
          "flex shrink-0 items-center px-2 sm:px-3",
          CHAT_SURFACE_HEADER_HEIGHT_CLASS,
          CHAT_SURFACE_HEADER_DIVIDER_CLASS_NAME,
          desktopTopBarWindowControlsGutterClassName,
        )}
      >
        {/* Three columns (`1fr auto 1fr`) so the surface switch is optically centred and both
            side columns truncate symmetrically. Absolutely positioning it instead would let
            it collide with a long workspace name or the chat controls on a narrow window. */}
        <div className="grid w-full min-w-0 grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className={cn("flex min-w-0 items-center gap-1.5", trafficLightGutterClassName)}>
            {optionalSidebar ? (
              <ChatHeaderIconButton
                type="button"
                tone="plain"
                label={optionalSidebar.open ? "Collapse sidebar" : "Expand sidebar"}
                title={optionalSidebar.open ? "Collapse sidebar" : "Expand sidebar"}
                className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={optionalSidebar.toggleSidebar}
              >
                <PanelLeftIcon className="size-4" />
              </ChatHeaderIconButton>
            ) : null}
          </div>
          {isMimirTheme ? (
            <Tabs
              value={surface}
              onValueChange={(val) => handleSelectSurface(val as EditorSurface)}
              className="shrink-0 justify-self-center"
            >
              <TabsList variant="segmented" aria-label="Surface" className="h-9 p-0.5">
                <TabsTrigger
                  value="study"
                  title="Study — the course's own files"
                  className="px-3.5"
                >
                  <FoldersIcon className="size-4" />
                  <span>Study</span>
                </TabsTrigger>
                <TabsTrigger
                  value="studio"
                  title="Studio — what the agent produced"
                  className="px-3.5"
                >
                  <SparkleIcon className="size-4" />
                  <span>Studio</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : (
            <SegmentedPicker
              // The header track is `w-max`, so the switch sizes to its own content and never
              // clips a label at any text scale. `justify-self-center` keeps it optically
              // centred in the grid's middle column.
              className="shrink-0 justify-self-center"
              ariaLabel="Surface"
              variant="header"
              value={surface}
              onValueChange={handleSelectSurface}
              options={[
                {
                  value: "study",
                  label: "Study",
                  icon: <FoldersIcon />,
                  title: "Study — the course's own files",
                },
                {
                  value: "studio",
                  label: "Studio",
                  icon: <SparkleIcon />,
                  title: "Studio — what the agent produced",
                },
              ]}
            />
          )}
          <div className="flex min-w-0 items-center justify-end gap-2">
            {isMimirTheme ? (
              <Button
                variant={chatPaneVisible ? "tonal" : "outlined"}
                size="xs"
                aria-pressed={chatPaneVisible}
                title={chatPaneVisible ? "Hide chat panel" : "Show chat panel"}
                className="h-8 gap-1.5 px-3"
                onClick={toggleChatPaneVisible}
              >
                <ChatBubbleIcon className="size-3.5" />
                <span className="truncate font-medium">
                  {chatPaneVisible ? "Close Chat" : "Chat"}
                </span>
              </Button>
            ) : (
              <ChatHeaderButton
                type="button"
                tone={chatPaneVisible ? "surface" : "outline"}
                aria-pressed={chatPaneVisible}
                title={chatPaneVisible ? "Hide chat panel" : "Show chat panel"}
                className="gap-1.5"
                onClick={toggleChatPaneVisible}
              >
                <ChatBubbleIcon className="size-3.5" />
                <span className="truncate font-normal">{chatPaneVisible ? "Hide Chat" : "Chat"}</span>
              </ChatHeaderButton>
            )}
          </div>
        </div>
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <main className="flex min-h-[16rem] min-w-0 flex-1 border-b border-border/65 lg:h-full lg:border-b-0">
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
                    />
                  </div>
                ) : null}
              </>
            )}
          </main>
          <div
            role="separator"
            aria-label="Resize chat panel"
            aria-orientation="vertical"
            aria-valuemin={EDITOR_CHAT_PANE_MIN_WIDTH}
            aria-valuemax={EDITOR_CHAT_PANE_MAX_WIDTH}
            aria-valuenow={chatPaneWidth}
            tabIndex={0}
            title="Drag to resize chat panel"
            className={cn(
              "group relative z-10 w-3 -translate-x-1/2 shrink-0 cursor-col-resize outline-none",
              chatPaneVisible ? "hidden lg:block" : "hidden",
            )}
            onPointerDown={handleChatPaneResizePointerDown}
            onDoubleClick={handleChatPaneResizeDoubleClick}
            onKeyDown={handleChatPaneResizeKeyDown}
          >
            <span
              className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[var(--app-surface-divider)] transition-colors group-hover:bg-[var(--color-text-accent)] group-focus-visible:bg-[var(--color-text-accent)]"
              aria-hidden="true"
            />
          </div>
          {/* Hidden (not unmounted) so the chat runtime and composer focus
              state survive toggling the pane. */}
          <aside
            className={cn(
              "min-h-[18rem] w-full shrink-0 app-content-surface lg:h-full lg:w-[var(--editor-chat-pane-width)]",
              chatPaneVisible ? "flex" : "hidden",
            )}
            style={
              {
                "--editor-chat-pane-width": `${chatPaneWidth}px`,
              } as CSSProperties
            }
          >
            {props.chatPanel}
          </aside>
        </div>
      </div>
    </div>
  );
}

export default EditorWorkspaceView;
