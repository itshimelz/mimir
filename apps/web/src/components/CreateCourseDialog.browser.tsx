// FILE: CreateCourseDialog.browser.tsx
// Purpose: Browser component test for CreateCourseDialog.
// Layer: Web browser test

import "../index.css";

import { page } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { CreateCourseDialog } from "./CreateCourseDialog";

describe("CreateCourseDialog", () => {
  it("renders dialog with folder and name inputs and properly positioned actions", async () => {
    const onOpenChange = vi.fn();

    await render(<CreateCourseDialog open={true} onOpenChange={onOpenChange} />);

    expect(page.getByText("New Course Workspace").element()).toBeTruthy();
    expect(page.getByText("Connect a folder for your course.").element()).toBeTruthy();
    expect(page.getByLabelText("Course Folder").element()).toBeTruthy();
    expect(page.getByLabelText("Course Name").element()).toBeTruthy();

    const cancelButton = page.getByRole("button", { name: "Cancel" });
    expect(cancelButton.element()).toBeTruthy();

    const submitButton = page.getByRole("button", { name: "Open Course" });
    expect(submitButton.element()).toBeTruthy();

    await cancelButton.click();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
