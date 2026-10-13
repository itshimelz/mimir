// FILE: CourseStudyFlow.browser.tsx
// Purpose: Browser component test for Guided Study Actions and custom topic modal flow.
// Layer: Web browser test

import "../index.css";

import { page } from "vitest/browser";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "vitest-browser-react";

import { CourseWorkspaceHome } from "./CourseWorkspaceHome";
import { type Project } from "~/types";

const mockCourse: Project = {
  id: "course-study-test" as never,
  kind: "project",
  name: "Data Structures & Algorithms",
  remoteName: "CS201",
  folderName: "CS201",
  localName: null,
  cwd: "/Users/student/Courses/CS201",
  defaultModelSelection: null,
  expanded: true,
  isPinned: false,
  spaceId: null,
  scripts: [],
  additionalFolders: [],
  createdAt: "2026-10-13T00:00:00.000Z",
  updatedAt: "2026-10-13T00:00:00.000Z",
};

describe("CourseStudyFlow", () => {
  afterEach(cleanup);

  it("launches default Socratic prompt when card is clicked directly", async () => {
    const onStartStudySession = vi.fn();

    await render(
      <CourseWorkspaceHome course={mockCourse} onStartStudySession={onStartStudySession} />,
    );

    await page.getByText("Explain a Concept", { exact: true }).click();

    expect(onStartStudySession).toHaveBeenCalledWith(
      "Explain this concept step-by-step. Use analogies, and pause after the first key concept to ask a quick check-in question to test my understanding.",
    );
  });

  it("opens topic dialog when 'Specify topic...' is clicked and submits interpolated prompt", async () => {
    const onStartStudySession = vi.fn();

    await render(
      <CourseWorkspaceHome course={mockCourse} onStartStudySession={onStartStudySession} />,
    );

    const btn = page.getByRole("button", { name: "Specify topic for Explain a Concept" });
    await btn.click();

    const topicInput = page.getByRole("textbox", {
      name: "Topic or Focus Area (optional)",
    });
    await topicInput.fill("Dijkstra's Algorithm");

    const submitBtn = page.getByRole("button", { name: "Start Session" });
    (submitBtn.element() as HTMLButtonElement)?.click();

    expect(onStartStudySession).toHaveBeenCalledWith(
      'Explain the concept of "Dijkstra\'s Algorithm" step-by-step. Use analogies, and pause after the first key concept to ask a quick check-in question to test my understanding.',
    );
  });

  it("opens practice quiz dialog and submits custom quiz topic", async () => {
    const onStartStudySession = vi.fn();

    await render(
      <CourseWorkspaceHome course={mockCourse} onStartStudySession={onStartStudySession} />,
    );

    const btn = page.getByRole("button", { name: "Specify topic for Practice Quiz" });
    await btn.click();

    const topicInput = page.getByRole("textbox", {
      name: "Topic or Focus Area (optional)",
    });
    await topicInput.fill("Binary Search Trees");

    const submitBtn = page.getByRole("button", { name: "Start Session" });
    (submitBtn.element() as HTMLButtonElement)?.click();

    expect(onStartStudySession).toHaveBeenCalledWith(
      'Quiz me on "Binary Search Trees" one question at a time. Do not provide the answer upfront. Wait for my response, give constructive feedback, and then ask the next question.',
    );
  });

  it("closes dialog without starting session when Cancel is clicked", async () => {
    const onStartStudySession = vi.fn();

    await render(
      <CourseWorkspaceHome course={mockCourse} onStartStudySession={onStartStudySession} />,
    );

    const btn = page.getByRole("button", { name: "Specify topic for Explain a Concept" });
    await btn.click();

    const cancelBtn = page.getByRole("button", { name: "Cancel" });
    (cancelBtn.element() as HTMLButtonElement)?.click();

    expect(onStartStudySession).not.toHaveBeenCalled();
  });
});
