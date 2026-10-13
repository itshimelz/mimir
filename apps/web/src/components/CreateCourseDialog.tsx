// FILE: CreateCourseDialog.tsx
// Purpose: Minimal, elegant dialog for creating or linking a course workspace in Mimir.
// Layer: Web UI component
// Architecture: Single-workspace course model in Mimir.

import type { ProjectId } from "@synara/contracts";
import { useEffect, useId, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { useCourseWorkspaceStore } from "~/courseWorkspaceStore";
import { isElectron } from "~/env";
import { BookOpenIcon, FolderIcon, SparkleIcon } from "~/lib/icons";
import { createOrRecoverProjectFromPath } from "~/lib/projectCreation";
import { expandProjectHomePath } from "~/lib/projectPaths";
import { readNativeApi } from "~/nativeApi";
import { useStore } from "~/store";
import { useWorkspacePathsStore } from "~/workspacePathsStore";

export interface CreateCourseDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onCourseCreated?: (courseId: ProjectId) => void;
}

export function CreateCourseDialog(props: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onCourseCreated?: (courseId: ProjectId) => void;
}) {
  const { open, onOpenChange, onCourseCreated } = props;
  const homeDir = useWorkspacePathsStore((state) => state.homeDir);
  const syncServerShellSnapshot = useStore((state) => state.syncServerShellSnapshot);
  const setActiveCourseId = useCourseWorkspaceStore((state) => state.setActiveCourseId);

  const [folderPath, setFolderPath] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseNameManuallyEdited, setCourseNameManuallyEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fieldId = useId();
  const folderInputId = `${fieldId}-folder`;
  const nameInputId = `${fieldId}-name`;

  useEffect(() => {
    if (!open) {
      setFolderPath("");
      setCourseName("");
      setCourseNameManuallyEdited(false);
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [open]);

  const handleFolderPathChange = (newPath: string) => {
    setFolderPath(newPath);
    if (!courseNameManuallyEdited) {
      const parts = newPath.trim().split(/[/\\]/).filter(Boolean);
      const suggested = parts.length > 0 ? (parts[parts.length - 1] ?? "") : "";
      setCourseName(suggested);
    }
  };

  const handleBrowseFolder = async () => {
    const api = readNativeApi();
    if (isElectron && api?.dialogs?.pickFolder) {
      try {
        const picked = await api.dialogs.pickFolder();
        if (picked) {
          handleFolderPathChange(picked);
        }
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to open folder picker");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const api = readNativeApi();
    if (!api) {
      setErrorMessage("Desktop API is not connected");
      return;
    }

    const trimmedPath = folderPath.trim();
    if (!trimmedPath) {
      setErrorMessage("Please enter or select a course folder path");
      return;
    }

    const expanded = expandProjectHomePath(trimmedPath, homeDir);
    if (!expanded) {
      setErrorMessage("Please provide a valid path");
      return;
    }

    setIsSubmitting(true);
    try {
      const courseTitle = courseName.trim();
      const result = await createOrRecoverProjectFromPath({
        api,
        workspaceRoot: expanded,
        ...(courseTitle ? { title: courseTitle } : {}),
        createIfMissing: true,
        spaceId: null,
        loadSnapshot: () => api.orchestration.getShellSnapshot().catch(() => null),
      });

      if (result.snapshot) {
        syncServerShellSnapshot(result.snapshot);
      }

      // Automatically scaffold course layout & instructions
      await api.course.prepareWorkspace({
        projectId: result.projectId,
        role: "student",
      });

      setActiveCourseId(result.projectId);
      onCourseCreated?.(result.projectId);
      onOpenChange(false);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to create course workspace");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-2 text-primary">
            <BookOpenIcon className="size-5" />
            <DialogTitle>New Course Workspace</DialogTitle>
          </div>
          <DialogDescription className="text-ui-sm text-muted-foreground mt-1.5 leading-relaxed">
            Connect a folder for your course. Mimir will organize your study materials in{" "}
            <code className="text-ui-xs font-mono bg-muted px-1.5 py-0.5 rounded">Inbox/</code> and
            generated deliverables in{" "}
            <code className="text-ui-xs font-mono bg-muted px-1.5 py-0.5 rounded">Outbox/</code>.
          </DialogDescription>
        </DialogHeader>

        <DialogPanel className="px-6 py-2">
          <form id="create-course-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            {errorMessage && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-ui-xs text-destructive">
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor={folderInputId} className="text-ui-xs font-medium text-foreground">
                Course Folder
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id={folderInputId}
                  value={folderPath}
                  onChange={(e) => handleFolderPathChange(e.target.value)}
                  placeholder="e.g. ~/Courses/CS101"
                  autoFocus
                  className="flex-1 text-ui"
                />
                {isElectron && (
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    onClick={handleBrowseFolder}
                    className="shrink-0 gap-1.5"
                  >
                    <FolderIcon className="size-4" />
                    <span>Browse</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor={nameInputId} className="text-ui-xs font-medium text-foreground">
                Course Name
              </label>
              <Input
                id={nameInputId}
                value={courseName}
                onChange={(e) => {
                  setCourseName(e.target.value);
                  setCourseNameManuallyEdited(true);
                }}
                placeholder="e.g. Computer Science 101"
                className="text-ui"
              />
            </div>
          </form>
        </DialogPanel>

        <DialogFooter className="px-6 pb-6 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            form="create-course-form"
            type="submit"
            variant="default"
            disabled={isSubmitting}
            className="gap-1.5"
          >
            <SparkleIcon className="size-4" />
            <span>{isSubmitting ? "Preparing..." : "Open Course"}</span>
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
