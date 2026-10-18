// FILE: StudioWorkspaceView.tsx
// Purpose: Tri-Pane Study Studio canvas (Pillar 3: Study Studio, Cmd+3).
//          Pane A: Source Reader & Multi-Modal Player (~45%)
//          Pane B: Living Synthesis Canvas & Problem Scratchpad (~30%)
//          Pane C: Contextual Socratic Companion (~25%, collapsible to 50/50 dual canvas).
// Layer: Web UI component

import { useState, useCallback, useMemo, type ReactNode } from "react";
import type { Project } from "~/types";
import type { ThreadId } from "@synara/contracts";
import {
  BookOpenIcon,
  BrainIcon,
  ChatBubbleIcon,
  CheckIcon,
  ChevronDownIcon,
  FolderIcon,
  PageTextIcon,
  PlayIcon,
  SparkleIcon,
  XIcon,
} from "~/lib/icons";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { WorkspaceFilePreview } from "./WorkspaceFilePreview";
import { WorkspaceFileEditorPane } from "./chat/WorkspaceFileEditorPane";
import { useTheme } from "~/hooks/useTheme";
import { appendComposerPromptText, type ChatFileReference } from "~/lib/chatReferences";
import type { FileCommentSelection } from "~/lib/fileComments";
import type { PptxAnnotationDraft, PptxAnnotationSelection } from "~/lib/pptxAnnotations";
import { buildStepVerificationPrompt, formatSourceCitationPill } from "./StudioWorkspaceView.logic";

export interface StudioWorkspaceViewProps {
  readonly workspaceRoot: string | null;
  readonly course: Project | null;
  readonly threadId?: ThreadId | undefined;
  readonly chatPanel?: ReactNode | undefined;
  readonly initialSourceFile?: string | null | undefined;
  readonly sourceFiles?: readonly string[] | undefined;
  readonly onSelectSourceFile?: ((file: string | null) => void) | undefined;
  readonly onReferenceInChat?: ((reference: ChatFileReference) => void) | undefined;
  readonly onAskWhyInChat?: ((reference: ChatFileReference) => void) | undefined;
  readonly onCommentInChat?: ((comment: FileCommentSelection) => void) | undefined;
  readonly pptxAnnotations?: ReadonlyArray<PptxAnnotationDraft> | undefined;
  readonly onPptxCommentInChat?: ((annotation: PptxAnnotationSelection) => void) | undefined;
  readonly onStartStudySession?: ((initialPrompt?: string) => void) | undefined;
}

export function StudioWorkspaceView(props: StudioWorkspaceViewProps) {
  const {
    workspaceRoot,
    course,
    threadId,
    chatPanel,
    initialSourceFile,
    sourceFiles = [],
    onSelectSourceFile,
    onReferenceInChat,
    onAskWhyInChat,
    onCommentInChat,
    pptxAnnotations,
    onPptxCommentInChat,
    onStartStudySession,
  } = props;

  const { resolvedTheme } = useTheme();

  // 1. Pane A: Active Source Document
  const [internalSelectedSourceFile, setInternalSelectedSourceFile] = useState<string | null>(
    () => {
      if (initialSourceFile) return initialSourceFile;
      const firstDoc = sourceFiles.find((f) => /\.(pdf|pptx|docx|md|txt)$/i.test(f));
      return firstDoc ?? null;
    },
  );

  const selectedSourceFile =
    initialSourceFile !== undefined ? initialSourceFile : internalSelectedSourceFile;

  const handleSelectFile = useCallback(
    (file: string | null) => {
      setInternalSelectedSourceFile(file);
      onSelectSourceFile?.(file);
    },
    [onSelectSourceFile],
  );

  // 2. Pane B: Living Synthesis Canvas vs Problem Scratchpad
  const [synthesisMode, setSynthesisMode] = useState<"notes" | "scratchpad">("notes");
  const [scratchpadText, setScratchpadText] = useState("");
  const [scratchpadSubmittedStep, setScratchpadSubmittedStep] = useState<string | null>(null);

  // Default active note path: Outbox/Notes/Synthesis_Notes.md
  const activeNotePath = useMemo(() => {
    const existingNote = sourceFiles.find((f) => /synthesis|notes/i.test(f) && f.endsWith(".md"));
    return existingNote ?? "Outbox/Notes/Synthesis_Notes.md";
  }, [sourceFiles]);

  // 3. Pane C: Socratic Companion Visibility (collapsible to 50/50 dual canvas)
  const [chatPaneVisible, setChatPaneVisible] = useState(true);
  const [marginMasteryVisible, setMarginMasteryVisible] = useState(true);

  // Citation pill injector: appends [Source: ...] to scratchpad or note
  const handleInsertCitation = useCallback(() => {
    if (!selectedSourceFile) return;
    const citation = formatSourceCitationPill(
      selectedSourceFile.split("/").pop() ?? selectedSourceFile,
    );
    if (synthesisMode === "scratchpad") {
      setScratchpadText((prev) => (prev ? `${prev}\n\n${citation}` : citation));
    } else if (threadId) {
      appendComposerPromptText(threadId, citation);
    }
  }, [selectedSourceFile, synthesisMode, threadId]);

  // Problem Verifier: Send current step to Socratic tutor for line-by-line verification
  const handleVerifyCurrentStep = useCallback(() => {
    if (!scratchpadText.trim()) return;
    const fileName = selectedSourceFile?.split("/").pop();
    const prompt = buildStepVerificationPrompt(scratchpadText, fileName);
    setScratchpadSubmittedStep(scratchpadText.trim());

    if (threadId) {
      appendComposerPromptText(threadId, prompt);
      if (!chatPaneVisible) {
        setChatPaneVisible(true);
      }
    } else if (onStartStudySession) {
      onStartStudySession(prompt);
    }
  }, [chatPaneVisible, onStartStudySession, scratchpadText, selectedSourceFile, threadId]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col app-content-surface text-foreground overflow-hidden">
      {/* Studio Top Control Strip */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/40 px-3 py-2 bg-background/80 backdrop-blur-xs">
        {/* Left: Course & Source Switcher */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 font-semibold text-ui text-foreground shrink-0">
            <SparkleIcon className="size-4 text-primary" />
            <span className="hidden sm:inline">Study Studio</span>
          </div>

          <span className="text-muted-foreground/60">•</span>

          {/* Quick Source File Switcher Dropdown */}
          <div className="relative flex items-center">
            {sourceFiles.length > 0 ? (
              <select
                aria-label="Select source file"
                value={selectedSourceFile ?? ""}
                onChange={(e) => handleSelectFile(e.target.value || null)}
                className="appearance-none rounded-md border border-border/40 bg-muted/30 ps-2.5 pe-7 py-1 text-ui-xs font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer max-w-[200px] sm:max-w-[280px] truncate"
              >
                <option value="">Choose Source Document...</option>
                {sourceFiles.map((file) => {
                  const label = file.split("/").pop() ?? file;
                  return (
                    <option key={file} value={file}>
                      {label}
                    </option>
                  );
                })}
              </select>
            ) : (
              <span className="text-ui-xs text-muted-foreground truncate">
                {course?.name ?? "No Course Open"}
              </span>
            )}
            <ChevronDownIcon className="pointer-events-none absolute end-2 size-3 text-muted-foreground" />
          </div>
        </div>

        {/* Right: Studio Surface & Companion Toggles */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setMarginMasteryVisible((prev) => !prev)}
            className={cn(
              "text-ui-xs gap-1.5",
              marginMasteryVisible ? "text-primary hover:bg-primary/10" : "text-muted-foreground",
            )}
            title="Toggle Margin Mastery Gutter"
          >
            <BookOpenIcon className="size-3.5" />
            <span className="hidden md:inline">Mastery Gutter</span>
          </Button>

          <Button
            variant={chatPaneVisible ? "secondary" : "outlined"}
            size="xs"
            onClick={() => setChatPaneVisible((prev) => !prev)}
            className="gap-1.5 text-ui-xs font-medium"
            title={
              chatPaneVisible
                ? "Collapse Socratic companion (50/50 dual canvas)"
                : "Show Socratic companion"
            }
          >
            <BrainIcon className="size-3.5 text-primary" />
            <span className="hidden sm:inline">Socratic Tutor</span>
          </Button>
        </div>
      </div>

      {/* Main Tri-Pane Viewport */}
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {/* PANE A: Primary Source Reader (~45% width, expands to ~50% when companion collapsed) */}
        <div
          data-pane="source-reader"
          className="flex min-h-0 min-w-[280px] flex-[4.5] flex-col border-r border-border/40 overflow-hidden bg-background relative"
        >
          {/* Pane A Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-border/30 px-3 py-1.5 bg-muted/15">
            <div className="flex items-center gap-1.5 text-ui-xs font-semibold text-foreground truncate">
              <BookOpenIcon className="size-3.5 text-primary shrink-0" />
              <span className="truncate">
                {selectedSourceFile ? selectedSourceFile.split("/").pop() : "Source Reader"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {selectedSourceFile ? (
                <Button
                  variant="ghost"
                  size="chip"
                  onClick={handleInsertCitation}
                  className="text-ui-2xs text-primary hover:bg-primary/10 px-2 py-0.5 rounded-sm"
                  title="Copy citation pill to note"
                >
                  Cite Page
                </Button>
              ) : null}
            </div>
          </div>

          {/* Pane A Content Area */}
          <div className="flex min-h-0 flex-1 overflow-hidden relative">
            {/* Left Margin Mastery Indicator Track */}
            {marginMasteryVisible && selectedSourceFile ? (
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

            {/* Document Viewer */}
            {selectedSourceFile ? (
              <div className="flex min-h-0 min-w-0 flex-1">
                <WorkspaceFilePreview
                  workspaceRoot={workspaceRoot}
                  filePath={selectedSourceFile}
                  markdownPreviewEnabled
                  onReferenceInChat={onReferenceInChat}
                  onAskWhyInChat={onAskWhyInChat}
                  onCommentInChat={onCommentInChat}
                  pptxAnnotations={pptxAnnotations}
                  onPptxCommentInChat={onPptxCommentInChat}
                  onClose={() => handleSelectFile(null)}
                />
              </div>
            ) : (
              <Empty className="h-full flex-1 p-6">
                <EmptyMedia variant="icon">
                  <BookOpenIcon className="size-6 text-primary" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle className="text-ui font-semibold">No Document Selected</EmptyTitle>
                  <EmptyDescription className="text-ui-xs">
                    Choose lecture slides or readings from the dropdown above to begin co-reading.
                  </EmptyDescription>
                </EmptyHeader>
                {sourceFiles.length > 0 ? (
                  <div className="mt-4 flex flex-col gap-1.5 w-full max-w-sm">
                    <span className="text-ui-2xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                      Available Course Materials
                    </span>
                    {sourceFiles.slice(0, 5).map((file) => (
                      <button
                        key={file}
                        type="button"
                        onClick={() => handleSelectFile(file)}
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

        {/* PANE B: Living Synthesis Canvas & Problem Scratchpad (~30% width, expands to ~50% when companion collapsed) */}
        <div
          data-pane="synthesis-canvas"
          className="flex min-h-0 min-w-[280px] flex-[3.5] flex-col border-r border-border/40 overflow-hidden bg-background"
        >
          {/* Pane B Header: Mode Switcher */}
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
                <TabsTrigger value="scratchpad" className="px-2.5 py-0.5 gap-1.5 text-ui-xs">
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
                title="Verify your derivation line-by-line without spoiling the solution (Cmd+Enter)"
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
                {workspaceRoot ? (
                  <WorkspaceFileEditorPane
                    workspaceRoot={workspaceRoot}
                    filePath={activeNotePath}
                    resolvedTheme={resolvedTheme}
                    onClose={() => setSynthesisMode("scratchpad")}
                  />
                ) : (
                  <Empty className="h-full flex-1 p-6">
                    <EmptyHeader>
                      <EmptyTitle className="text-ui font-semibold">No Note Workspace</EmptyTitle>
                      <EmptyDescription className="text-ui-xs">
                        Open a course to start authoring synthesis notes.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </div>
            ) : (
              /* Problem-Solving Scratchpad */
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
                      Work through math or problem steps line-by-line. Mimir checks logic without
                      giving away the answer.
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Derivation Textarea */}
                <div className="flex flex-col flex-1 min-h-[180px]">
                  <Textarea
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

                {/* Progressive Hint Ladder Banner */}
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
                      {selectedSourceFile ?? "course materials"}.
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* PANE C: Contextual Socratic Companion (~25% width, collapsible) */}
        {chatPaneVisible ? (
          <div
            data-pane="socratic-companion"
            className="flex min-h-0 min-w-[280px] w-[340px] xl:w-[380px] shrink-0 flex-col overflow-hidden bg-background"
          >
            {/* Pane C Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border/30 px-3 py-1.5 bg-muted/15">
              <div className="flex items-center gap-1.5 font-semibold text-ui-xs text-foreground">
                <BrainIcon className="size-3.5 text-primary shrink-0" />
                <span>Socratic Companion</span>
                <Badge variant="outline" size="sm" className="text-ui-2xs">
                  Active
                </Badge>
              </div>

              <Button
                variant="ghost"
                size="chip"
                onClick={() => setChatPaneVisible(false)}
                className="text-muted-foreground hover:text-foreground h-auto p-1"
                title="Collapse companion (Cmd+\)"
              >
                <XIcon className="size-3.5" />
              </Button>
            </div>

            {/* Pane C Body: Real Chat Panel */}
            <div className="flex min-h-0 flex-1 overflow-hidden">
              {chatPanel ? (
                chatPanel
              ) : (
                <Empty className="h-full flex-1 p-6">
                  <EmptyMedia variant="icon">
                    <BrainIcon className="size-6 text-primary" />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle className="text-ui font-semibold">Socratic Tutor Ready</EmptyTitle>
                    <EmptyDescription className="text-ui-xs">
                      Ask questions, verify homework steps, or start a teach-back challenge.
                    </EmptyDescription>
                  </EmptyHeader>
                  <div className="mt-4 flex flex-col gap-2 w-full max-w-xs">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start text-ui-xs text-left"
                      onClick={() =>
                        onStartStudySession?.(
                          `Quiz me on the core concepts in ${selectedSourceFile ?? "this module"}. Guide me Socratically without spoiling answers.`,
                        )
                      }
                    >
                      <SparkleIcon className="size-3 text-primary shrink-0 me-1.5" />
                      <span>Quiz Me Socratically</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start text-ui-xs text-left"
                      onClick={() =>
                        onStartStudySession?.(
                          `I want to explain a concept in my own words using the Feynman technique. Ask me what I want to teach you.`,
                        )
                      }
                    >
                      <BrainIcon className="size-3 text-primary shrink-0 me-1.5" />
                      <span>Feynman Teach-Back</span>
                    </Button>
                  </div>
                </Empty>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default StudioWorkspaceView;
