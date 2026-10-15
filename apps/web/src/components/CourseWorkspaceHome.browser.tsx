// FILE: CourseWorkspaceHome.browser.tsx
// Purpose: Browser component test for CourseWorkspaceHome dashboard.
// Layer: Web browser test

import "../index.css";

import { page } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { CourseWorkspaceHome } from "./CourseWorkspaceHome";
import { type Project } from "~/types";

const mockCourse: Project = {
  id: "course-123" as never,
  kind: "project",
  name: "Introduction to Computer Science",
  remoteName: "CS101",
  folderName: "CS101",
  localName: null,
  cwd: "/Users/student/Courses/CS101",
  defaultModelSelection: null,
  expanded: true,
  isPinned: false,
  spaceId: null,
  scripts: [],
  additionalFolders: [],
  createdAt: "2026-10-13T00:00:00.000Z",
  updatedAt: "2026-10-13T00:00:00.000Z",
};

describe("CourseWorkspaceHome", () => {
  it("renders course title, folder, and guided study action cards", async () => {
    const onStartStudySession = vi.fn();
    const onSwitchCourse = vi.fn();
    const onOpenEditor = vi.fn();

    await render(
      <CourseWorkspaceHome
        course={mockCourse}
        onStartStudySession={onStartStudySession}
        onSwitchCourse={onSwitchCourse}
        onOpenEditor={onOpenEditor}
      />,
    );

    // Verify course header info
    expect(page.getByText("Introduction to Computer Science").element()).toBeTruthy();
    expect(page.getByText("/Users/student/Courses/CS101").element()).toBeTruthy();

    // Verify Guided Study Action cards
    expect(page.getByText("Explain a Concept", { exact: true }).element()).toBeTruthy();
    expect(page.getByText("Review Materials in Inbox", { exact: true }).element()).toBeTruthy();
    expect(page.getByText("Practice Quiz", { exact: true }).element()).toBeTruthy();
    expect(page.getByText("Break Down Assignment", { exact: true }).element()).toBeTruthy();

    // Verify Inbox and Outbox sections
    expect(page.getByText("Course Inbox", { exact: true }).element()).toBeTruthy();
    expect(page.getByText("Study Deliverables", { exact: true }).element()).toBeTruthy();
  });

  it("triggers onStartStudySession with specific prompt when guided study action clicked", async () => {
    const onStartStudySession = vi.fn();

    await render(
      <CourseWorkspaceHome course={mockCourse} onStartStudySession={onStartStudySession} />,
    );

    // Click "Practice Quiz"
    await page.getByText("Practice Quiz", { exact: true }).click();

    expect(onStartStudySession).toHaveBeenCalledWith(
      expect.stringContaining("Quiz me on this topic one question at a time"),
    );
  });

  it("triggers onStartStudySession without prompt when hero start session clicked", async () => {
    const onStartStudySession = vi.fn();

    await render(
      <CourseWorkspaceHome course={mockCourse} onStartStudySession={onStartStudySession} />,
    );

    // Click "Start Study Session" hero button
    await page.getByRole("button", { name: "Start Study Session" }).click();

    expect(onStartStudySession).toHaveBeenCalledWith();
  });

  it("calls onSwitchCourse and onOpenEditor when top action buttons are clicked", async () => {
    const onStartStudySession = vi.fn();
    const onSwitchCourse = vi.fn();
    const onOpenEditor = vi.fn();

    await render(
      <CourseWorkspaceHome
        course={mockCourse}
        onStartStudySession={onStartStudySession}
        onSwitchCourse={onSwitchCourse}
        onOpenEditor={onOpenEditor}
      />,
    );

    await page.getByRole("button", { name: "Switch Course" }).click();
    expect(onSwitchCourse).toHaveBeenCalledTimes(1);

    await page.getByRole("button", { name: "Course Files" }).first().click();
    expect(onOpenEditor).toHaveBeenCalledTimes(1);
  });
});
