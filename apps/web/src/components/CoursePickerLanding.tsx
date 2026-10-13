// FILE: CoursePickerLanding.tsx
// Purpose: Student landing for choosing an active course workspace or opening a new course folder.
// Layer: Web UI component
// Architecture: Single-workspace course model in Mimir.

import type { ProjectId } from "@synara/contracts";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { useCourseWorkspaceStore } from "~/courseWorkspaceStore";
import { isElectron } from "~/env";
import {
  BookOpenIcon,
  ChevronRightIcon,
  FolderAddIcon,
  FolderIcon,
  SparkleIcon,
} from "~/lib/icons";
import { createOrRecoverProjectFromPath } from "~/lib/projectCreation";
import { expandProjectHomePath } from "~/lib/projectPaths";
import { readNativeApi } from "~/nativeApi";
import { useStore } from "~/store";
import { type Project } from "~/types";
import { useWorkspacePathsStore } from "~/workspacePathsStore";

export function CoursePickerLanding(props: {
  readonly onCourseSelected?: (courseId: ProjectId) => void;
}) {
  const projects = useStore((state) => state.projects);
  const syncServerShellSnapshot = useStore((state) => state.syncServerShellSnapshot);
  const homeDir = useWorkspacePathsStore((state) => state.homeDir);
  const setActiveCourseId = useCourseWorkspaceStore((state) => state.setActiveCourseId);

  const [isOpeningFolder, setIsOpeningFolder] = useState(false);
  const [manualPath, setManualPath] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectCourse = (courseId: ProjectId) => {
    setActiveCourseId(courseId);
    props.onCourseSelected?.(courseId);
  };

  const handleOpenFolder = async () => {
    setErrorMessage(null);
    const api = readNativeApi();

    if (isElectron && api?.dialogs?.pickFolder) {
      try {
        setIsOpeningFolder(true);
        const pickedPath = await api.dialogs.pickFolder();
        if (!pickedPath) {
          setIsOpeningFolder(false);
          return;
        }
        await addCourseFromPath(pickedPath);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to open folder");
      } finally {
        setIsOpeningFolder(false);
      }
    } else {
      setShowManualInput((prev) => !prev);
    }
  };

  const addCourseFromPath = async (rawPath: string) => {
    const api = readNativeApi();
    if (!api) {
      setErrorMessage("Desktop API is not connected");
      return;
    }
    const expanded = expandProjectHomePath(rawPath.trim(), homeDir);
    if (!expanded) {
      setErrorMessage("Please enter a valid course folder path");
      return;
    }

    setIsOpeningFolder(true);
    setErrorMessage(null);
    try {
      const result = await createOrRecoverProjectFromPath({
        api,
        workspaceRoot: expanded,
        spaceId: null,
        loadSnapshot: () => api.orchestration.getShellSnapshot().catch(() => null),
      });

      if (result.snapshot) {
        syncServerShellSnapshot(result.snapshot);
      }

      setActiveCourseId(result.projectId);
      props.onCourseSelected?.(result.projectId);
      setManualPath("");
      setShowManualInput(false);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to create course workspace");
    } finally {
      setIsOpeningFolder(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPath.trim()) return;
    void addCourseFromPath(manualPath);
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-6 md:p-12">
      <div className="flex w-full max-w-2xl flex-col gap-8">
        {/* Header Hero */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-sm/5">
            <BookOpenIcon className="size-7" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="font-heading font-semibold text-2xl tracking-tight text-foreground">
              Course Workspaces
            </h1>
            <p className="text-muted-foreground text-ui max-w-md">
              Select an active course workspace or open a folder to start learning with your Mimir
              co-learner.
            </p>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-ui text-destructive">
            {errorMessage}
          </div>
        )}

        {/* Existing Courses List or Empty State */}
        {projects.length > 0 ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-ui-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your Courses ({projects.length})
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenFolder}
                disabled={isOpeningFolder}
                className="gap-1.5"
              >
                <FolderAddIcon className="size-4" />
                <span>Open Folder</span>
              </Button>
            </div>

            <div className="grid gap-3">
              {projects.map((course: Project) => (
                <Card
                  key={course.id}
                  variant="plain"
                  interactive={true}
                  onClick={() => handleSelectCourse(course.id)}
                  className="flex flex-row items-center justify-between p-4 transition-colors hover:border-primary/40 hover:bg-card/80"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/40 text-foreground/80">
                      <FolderIcon className="size-5" />
                    </div>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-ui-lg font-medium text-foreground">
                        {course.name}
                      </span>
                      <span className="truncate font-mono text-ui-xs text-muted-foreground">
                        {course.cwd}
                      </span>
                    </div>
                  </div>
                  <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Empty className="border border-border/80 rounded-xl bg-card/40 p-8">
            <EmptyMedia variant="icon">
              <BookOpenIcon className="size-5" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No courses yet</EmptyTitle>
              <EmptyDescription>
                Open any folder containing your course notes, slides, or syllabus to turn it into an
                intelligent workspace.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="default"
                size="default"
                onClick={handleOpenFolder}
                disabled={isOpeningFolder}
                className="gap-2"
              >
                <FolderAddIcon className="size-4.5" />
                <span>Open Course Folder</span>
              </Button>
            </EmptyContent>
          </Empty>
        )}

        {/* Web manual path input fallback */}
        {showManualInput && (
          <form
            onSubmit={handleManualSubmit}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex flex-col gap-1">
              <span className="text-ui font-medium text-foreground">Course Directory Path</span>
              <span className="text-ui-xs text-muted-foreground">
                Enter the absolute or home-relative path (e.g. ~/Courses/CS101)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={manualPath}
                onChange={(e) => setManualPath(e.target.value)}
                placeholder="~/Courses/MyCourse"
                className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-ui font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                autoFocus
              />
              <Button type="submit" variant="default" size="sm" disabled={isOpeningFolder}>
                {isOpeningFolder ? "Opening…" : "Add Course"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowManualInput(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
