// FILE: CoursePickerLanding.tsx
// Purpose: Student landing for choosing an active course workspace or opening a new course folder.
// Layer: Web UI component
// Architecture: Single-workspace course model in Mimir.

import type { ProjectId } from "@synara/contracts";
import { useState } from "react";

import { CreateCourseDialog } from "~/components/CreateCourseDialog";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { useCourseWorkspaceStore } from "~/courseWorkspaceStore";
import {
  BookOpenIcon,
  ChevronRightIcon,
  FolderAddIcon,
  FolderIcon,
  SparkleIcon,
} from "~/lib/icons";
import { readNativeApi } from "~/nativeApi";
import { useStore } from "~/store";
import { type Project } from "~/types";

export function CoursePickerLanding(props: {
  readonly onCourseSelected?: (courseId: ProjectId) => void;
}) {
  const projects = useStore((state) => state.projects);
  const setActiveCourseId = useCourseWorkspaceStore((state) => state.setActiveCourseId);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectCourse = (courseId: ProjectId) => {
    const api = readNativeApi();
    // Self-heal course workspace subdirectories in background
    void api?.course?.prepareWorkspace({ projectId: courseId, role: "student" }).catch(() => {});
    setActiveCourseId(courseId);
    props.onCourseSelected?.(courseId);
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
                onClick={() => setCreateDialogOpen(true)}
                className="gap-1.5"
              >
                <FolderAddIcon className="size-4" />
                <span>New Course</span>
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
                onClick={() => setCreateDialogOpen(true)}
                className="gap-2"
              >
                <FolderAddIcon className="size-4.5" />
                <span>Open Course Folder</span>
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </div>

      <CreateCourseDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCourseCreated={handleSelectCourse}
      />
    </div>
  );
}
