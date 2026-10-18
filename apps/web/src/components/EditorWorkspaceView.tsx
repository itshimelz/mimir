// FILE: EditorWorkspaceView.tsx
// Purpose: The workspace surface: file explorer, workspace file search, file/diff
//          preview, and chat, split into two product surfaces — Study (the course's
//          own files) and Studio (the artifacts the agent produced). Both share one
//          workspace and one chat rail; only the left column and center swap.
// Layer: Chat route presentation

import type {
  ProjectId,
  SpaceIconName,
  SpaceId,
  StudioOutputEntry,
  ThreadId,
} from "@synara/contracts";
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

import {
  BookOpenIcon,
  BrainIcon,
  ChatBubbleIcon,
  CheckIcon,
  ChevronDownIcon,
  PageTextIcon,
  PlayIcon,
  SparkleIcon,
  XIcon,
} from "~/lib/icons";
import { Badge } from "./ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "./ui/empty";
import { Textarea } from "./ui/textarea";
import { appendComposerPromptText } from "~/lib/chatReferences";
import { buildStepVerificationPrompt, formatSourceCitationPill } from "./EditorWorkspaceView.logic";
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
  threadId?: ThreadId | undefined;
  initialSurface?: EditorSurface | undefined;
  sourceFiles?: readonly string[] | undefined;
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

  useEffect(() => {
    if (props.initialSurface && props.initialSurface !== surface) {
      setSurface(props.initialSurface);
    }
  }, [props.initialSurface, setSurface, surface]);

  // Tri-Pane Study Studio state:
  const [synthesisMode, setSynthesisMode] = useState<"notes" | "scratchpad">("notes");
  const [scratchpadText, setScratchpadText] = useState("");
  const [scratchpadSubmittedStep, setScratchpadSubmittedStep] = useState<string | null>(null);
  const [marginMasteryVisible, setMarginMasteryVisible] = useState(true);

  // Available course materials (from sourceFiles or studioOutputs)
  const allSourceDocs = useMemo(() => {
    const fromFiles = props.sourceFiles ?? [];
    const fromOutputs = props.studioOutputs?.map((e) => e.relativePath) ?? [];
    const combined = Array.from(new Set([...fromFiles, ...fromOutputs]));
    return combined.filter((f) => /\.(pdf|pptx|docx|md|txt)$/i.test(f));
  }, [props.sourceFiles, props.studioOutputs]);

  const [internalSelectedDoc, setInternalSelectedDoc] = useState<string | null>(null);
  const activeSourceDoc =
    props.selectedFilePath ??
    selectedStudioOutput?.relativePath ??
    internalSelectedDoc ??
    allSourceDocs[0] ??
    null;

  const handleSelectSourceDoc = useCallback(
    (file: string | null) => {
      setInternalSelectedDoc(file);
      props.onSelectFile(file);
    },
    [props.onSelectFile],
  );

  const activeNotePath = useMemo(() => {
    const list = props.sourceFiles ?? [];
    const existing = list.find((f) => /synthesis|notes/i.test(f) && f.endsWith(".md"));
    return existing ?? "Outbox/Notes/Synthesis_Notes.md";
  }, [props.sourceFiles]);

  const handleInsertCitation = useCallback(() => {
    if (!activeSourceDoc) return;
    const citation = formatSourceCitationPill(activeSourceDoc.split("/").pop() ?? activeSourceDoc);
    if (synthesisMode === "scratchpad") {
      setScratchpadText((prev) => (prev ? `${prev}\n\n${citation}` : citation));
    } else if (props.threadId) {
      appendComposerPromptText(props.threadId, citation);
    }
  }, [activeSourceDoc, props.threadId, synthesisMode]);

  const handleVerifyCurrentStep = useCallback(() => {
    if (!scratchpadText.trim()) return;
    const fileName = activeSourceDoc?.split("/").pop();
    const prompt = buildStepVerificationPrompt(scratchpadText, fileName);
    setScratchpadSubmittedStep(scratchpadText.trim());

    if (props.threadId) {
      appendComposerPromptText(props.threadId, prompt);
      if (!chatPaneVisible) {
        setChatPaneVisible(true);
        storeEditorVisibility(EDITOR_CHAT_PANE_VISIBLE_STORAGE_KEY, true);
      }
    }
  }, [activeSourceDoc, chatPaneVisible, props.threadId, scratchpadText]);

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

        {/* Center: Segmented Surface Picker (Study vs Studio) + Quick Document Switcher */}
        <div className="pointer-events-none absolute inset-x-0 flex items-center justify-center">
          <div className="pointer-events-auto flex items-center gap-2">
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
                    title="Studio — Tri-Pane co-reading and synthesis studio"
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

            {surface === "studio" && allSourceDocs.length > 0 ? (
              <div className="relative hidden md:flex items-center">
                <select
                  aria-label="Select source document"
                  value={activeSourceDoc ?? ""}
                  onChange={(e) => handleSelectSourceDoc(e.target.value || null)}
                  className="appearance-none rounded-md border border-border/40 bg-muted/30 ps-2.5 pe-6 py-1 text-ui-xs font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer max-w-[160px] sm:max-w-[220px] truncate"
                >
                  <option value="">Choose Document...</option>
                  {allSourceDocs.map((file) => (
                    <option key={file} value={file}>
                      {file.split("/").pop()}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute end-1.5 size-3 text-muted-foreground" />
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Column: Mastery Gutter toggle & Socratic Tutor toggle */}
        <div className="relative z-10 flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          {surface === "studio" ? (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setMarginMasteryVisible((prev) => !prev)}
              aria-pressed={marginMasteryVisible}
              aria-label="Toggle Margin Mastery Gutter"
              className={cn(
                "text-ui-xs gap-1.5",
                marginMasteryVisible ? "text-primary hover:bg-primary/10" : "text-muted-foreground",
              )}
              title="Toggle Margin Mastery Gutter"
            >
              <BookOpenIcon className="size-3.5" />
              <span className="hidden md:inline">Mastery Gutter</span>
            </Button>
          ) : null}

          <Button
            variant={chatPaneVisible ? "secondary" : "outlined"}
            size="xs"
            aria-pressed={chatPaneVisible}
            aria-label={chatPaneVisible ? "Hide tutor chat" : "Show tutor chat"}
            title={chatPaneVisible ? "Hide tutor chat" : "Show tutor chat"}
            onClick={toggleChatPaneVisible}
            className={cn(
              "gap-1.5 text-ui-xs font-medium",
              chatPaneVisible && "bg-primary/10 text-primary border-primary/25",
            )}
          >
            <BrainIcon className="size-3.5" />
            <span className="hidden sm:inline">
              {surface === "studio" ? "Socratic Tutor" : "Study Chat"}
            </span>
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
            {surface === "studio" ? (
              <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden flex-col md:flex-row">
                {/* PANE A: Primary Source Reader (~55% of center area) */}
                <div
                  data-pane="source-reader"
                  className="flex min-h-0 min-w-[280px] flex-[5.5] flex-col border-b md:border-b-0 md:border-r border-border/40 overflow-hidden bg-background relative"
                >
                  {/* Pane A Header */}
                  <div className="flex shrink-0 items-center justify-between border-b border-border/30 px-3 py-1.5 bg-muted/15">
                    <div className="flex items-center gap-1.5 text-ui-xs font-semibold text-foreground truncate">
                      <BookOpenIcon className="size-3.5 text-primary shrink-0" />
                      <span className="truncate">
                        {activeSourceDoc ? activeSourceDoc.split("/").pop() : "Source Reader"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {activeSourceDoc ? (
                        <Button
                          variant="ghost"
                          size="chip"
                          onClick={handleInsertCitation}
                          aria-label="Copy citation pill to note or composer"
                          className="text-ui-2xs text-primary hover:bg-primary/10 px-2 py-0.5 rounded-sm"
                          title="Copy citation pill to note or composer"
                        >
                          Cite Page
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {/* Pane A Content Area */}
                  <div className="flex min-h-0 flex-1 overflow-hidden relative">
                    {marginMasteryVisible && activeSourceDoc ? (
                      <div
                        aria-label="Mastery Status Gutter"
                        className="w-2.5 shrink-0 border-r border-border/20 bg-muted/10 flex flex-col items-center py-3 gap-3"
                        title="Margin Mastery Track: Concept stability and recall retention"
                      >
                        <div
                          className="w-1.5 h-12 rounded-full bg-emerald-500/80"
                          title="High Retention (R > 90%)"
                        />
                        <div
                          className="w-1.5 h-16 rounded-full bg-emerald-500/80"
                          title="High Retention (R > 90%)"
                        />
                        <div
                          className="w-1.5 h-10 rounded-full bg-amber-500/80"
                          title="Review Recommended (R ~ 80%)"
                        />
                        <div
                          className="w-1.5 h-14 rounded-full bg-emerald-500/80"
                          title="High Retention (R > 90%)"
                        />
                      </div>
                    ) : null}

                    {activeSourceDoc ? (
                      <div className="flex min-h-0 min-w-0 flex-1">
                        <WorkspaceFilePreview
                          workspaceRoot={props.workspaceRoot}
                          filePath={activeSourceDoc}
                          markdownPreviewEnabled
                          onReferenceInChat={props.onReferenceInChat}
                          onAskWhyInChat={props.onAskWhyInChat}
                          onCommentInChat={props.onCommentInChat}
                          pptxAnnotations={props.pptxAnnotations}
                          onPptxCommentInChat={props.onPptxCommentInChat}
                          onClose={() => handleSelectSourceDoc(null)}
                        />
                      </div>
                    ) : (
                      <Empty className="h-full flex-1 p-6">
                        <EmptyMedia variant="icon">
                          <BookOpenIcon className="size-6 text-primary" />
                        </EmptyMedia>
                        <EmptyHeader>
                          <EmptyTitle className="text-ui font-semibold">
                            No Document Selected
                          </EmptyTitle>
                          <EmptyDescription className="text-ui-xs">
                            Select lecture slides or reading materials to begin co-reading.
                          </EmptyDescription>
                        </EmptyHeader>
                        {allSourceDocs.length > 0 ? (
                          <div className="mt-4 flex flex-col gap-1.5 w-full max-w-sm">
                            <span className="text-ui-2xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                              Available Course Materials
                            </span>
                            {allSourceDocs.slice(0, 5).map((file) => (
                              <button
                                key={file}
                                type="button"
                                onClick={() => handleSelectSourceDoc(file)}
                                className="flex items-center justify-between rounded-md border border-border/40 bg-muted/20 px-2.5 py-1.5 text-left text-ui-xs hover:bg-muted/50 transition-colors"
                              >
                                <span className="truncate">{file.split("/").pop()}</span>
                                <PlayIcon className="size-3 text-muted-foreground shrink-0 ms-1" />
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </Empty>
                    )}
                  </div>
                </div>

                {/* PANE B: Living Synthesis Canvas & Problem Scratchpad (~45% of center area) */}
                <div
                  data-pane="synthesis-canvas"
                  className="flex min-h-0 min-w-[280px] flex-[4.5] flex-col overflow-hidden bg-background"
                >
                  {/* Pane B Header */}
                  <div className="flex shrink-0 items-center justify-between border-b border-border/30 px-3 py-1.5 bg-muted/15">
                    <Tabs
                      value={synthesisMode}
                      onValueChange={(val) => setSynthesisMode(val as "notes" | "scratchpad")}
                      className="shrink-0"
                    >
                      <TabsList variant="segmented" className="h-7 p-0.5">
                        <TabsTrigger value="notes" className="px-2.5 py-0.5 gap-1.5 text-ui-xs">
                          <PageTextIcon className="size-3 text-primary" />
                          <span>Synthesis Notes</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="scratchpad"
                          className="px-2.5 py-0.5 gap-1.5 text-ui-xs"
                        >
                          <SparkleIcon className="size-3 text-primary" />
                          <span>Problem Scratchpad</span>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    {synthesisMode === "scratchpad" ? (
                      <Button
                        size="xs"
                        onClick={handleVerifyCurrentStep}
                        disabled={!scratchpadText.trim()}
                        className="gap-1.5 text-ui-xs font-medium shadow-xs"
                        title="Verify derivation line-by-line without spoiling the solution (Cmd+Enter)"
                      >
                        <CheckIcon className="size-3" />
                        <span>Check Step</span>
                      </Button>
                    ) : null}
                  </div>

                  {/* Pane B Content Area */}
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    {synthesisMode === "notes" ? (
                      <div className="flex min-h-0 min-w-0 flex-1">
                        {props.workspaceRoot ? (
                          <WorkspaceFileEditorPane
                            workspaceRoot={props.workspaceRoot}
                            filePath={activeNotePath}
                            resolvedTheme={editorResolvedTheme}
                            onClose={() => setSynthesisMode("scratchpad")}
                          />
                        ) : (
                          <Empty className="h-full flex-1 p-6">
                            <EmptyHeader>
                              <EmptyTitle className="text-ui font-semibold">
                                No Note Workspace
                              </EmptyTitle>
                              <EmptyDescription className="text-ui-xs">
                                Open a course to start authoring synthesis notes.
                              </EmptyDescription>
                            </EmptyHeader>
                          </Empty>
                        )}
                      </div>
                    ) : (
                      /* Problem-Solving Derivation Scratchpad */
                      <div className="flex min-h-0 flex-1 flex-col p-3 gap-3 overflow-y-auto">
                        <Card variant="plain" size="sm" className="gap-2">
                          <CardHeader>
                            <div className="flex items-center gap-1.5 font-medium text-foreground">
                              <SparkleIcon className="size-3.5 text-primary shrink-0" />
                              <CardTitle className="text-ui-xs font-semibold">
                                Anti-Spoiler Derivation
                              </CardTitle>
                            </div>
                            <CardAction>
                              <Badge variant="outline" size="sm">
                                Step-Checked
                              </Badge>
                            </CardAction>
                            <CardDescription className="text-ui-2xs text-muted-foreground">
                              Work through math or problem steps line-by-line. Mimir checks logic
                              without giving away the answer.
                            </CardDescription>
                          </CardHeader>
                        </Card>

                        <div className="flex flex-col flex-1 min-h-[180px]">
                          <Textarea
                            aria-label="Problem-solving derivation scratchpad"
                            className="flex-1 resize-none rounded-md border border-border/50 bg-muted/20 p-3 text-ui-sm font-mono text-foreground focus-visible:ring-1 focus-visible:ring-primary"
                            value={scratchpadText}
                            onChange={(e) => setScratchpadText(e.target.value)}
                            placeholder="Type your derivation steps here...&#10;&#10;Step 1: Write down the governing equation...&#10;Step 2: Substitute given initial conditions...&#10;&#10;Press 'Check Step' (Cmd+Enter) to verify."
                            onKeyDown={(e) => {
                              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                                e.preventDefault();
                                handleVerifyCurrentStep();
                              }
                            }}
                          />
                        </div>

                        {scratchpadSubmittedStep ? (
                          <div className="rounded-md border border-primary/30 bg-primary/5 p-2.5 text-ui-xs text-foreground flex flex-col gap-1.5">
                            <div className="flex items-center justify-between font-semibold text-primary">
                              <span>Step Submitted for Verification</span>
                              <Badge variant="secondary" size="sm">
                                Tier 1 Nudge
                              </Badge>
                            </div>
                            <p className="text-ui-2xs text-muted-foreground">
                              The Socratic Companion is evaluating your derivation against{" "}
                              {activeSourceDoc ?? "course materials"}.
                            </p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
