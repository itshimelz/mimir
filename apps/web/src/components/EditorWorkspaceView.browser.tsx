// FILE: EditorWorkspaceView.browser.tsx
// Purpose: Preserve explicit Markdown view choices across editor navigation, and guard the
//          Study/Studio surface switch (header toggle, left column, artifact preview).
// Layer: Component browser regressions

import "../index.css";

import type { NativeApi } from "@synara/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { page } from "vitest/browser";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render } from "vitest-browser-react";

import { EditorWorkspaceView } from "./EditorWorkspaceView";
import { SidebarProvider } from "./ui/sidebar";
import {
  buildThemeCssVariables,
  DEFAULT_THEME_STATE,
  resolveThemePack,
} from "../theme/theme.logic";
import { setCodeThemeId } from "../hooks/useTheme";
import { getAppTypographyScale } from "../lib/appTypography";

const WORKSPACE_ROOT = "/Users/tester/project";
let previousApi: PropertyDescriptor | undefined;
let previousAppearance: Map<string, string | null>;

beforeEach(() => {
  previousAppearance = new Map(
    ["style", "class", "data-window-material", "data-window-translucency"].map((attribute) => [
      attribute,
      document.documentElement.getAttribute(attribute),
    ]),
  );
  previousApi = Object.getOwnPropertyDescriptor(window, "nativeApi");
  Object.defineProperty(window, "nativeApi", {
    configurable: true,
    value: {
      projects: {
        readFile: vi.fn(async ({ relativePath }: { relativePath: string }) => ({
          relativePath,
          contents: "# Markdown document\n",
          truncated: false,
          version: `sha256:${"1".repeat(64)}`,
          encoding: "utf8",
          lineEnding: "lf",
        })),
        searchEntries: vi.fn(async () => ({ entries: [], truncated: false })),
        listDirectories: vi.fn(async () => ({ directories: [] })),
      },
      git: { readWorkingTreeDiff: vi.fn(async () => ({ patch: "", truncated: false })) },
    } as unknown as NativeApi,
  });
});

afterEach(async () => {
  await cleanup();
  for (const [attribute, value] of previousAppearance) {
    if (value === null) document.documentElement.removeAttribute(attribute);
    else document.documentElement.setAttribute(attribute, value);
  }
  if (previousApi) Object.defineProperty(window, "nativeApi", previousApi);
  else Reflect.deleteProperty(window, "nativeApi");
  // Every stored preference this view reads has to be cleared between tests. The surface
  // selector and the two pane-width keys are all persisted, so a case that collapses the chat
  // rail or drags the seam would otherwise leave the next case rendering a layout it did not
  // ask for.
  window.localStorage.removeItem("synara.editor.surface");
  window.localStorage.removeItem("synara.editor.chatPaneVisible");
  window.localStorage.removeItem("synara.editor.chatPaneWidth");
});

type StudioOutput = NonNullable<
  React.ComponentProps<typeof EditorWorkspaceView>["studioOutputs"]
>[number];

const LESSON: StudioOutput = {
  name: "2026-07-08_cell-division_lesson.md",
  relativePath: "Outbox/Lessons/2026-07-08_cell-division_lesson.md",
  fullPath: `${WORKSPACE_ROOT}/Outbox/Lessons/2026-07-08_cell-division_lesson.md`,
  modifiedAt: "2026-07-08T10:00:00.000Z",
};

function makeView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    centerMode: "file" | "diff" | "fileEdit" = "file",
    filePath = "README.md",
    workspaceRoot = WORKSPACE_ROOT,
    studioOutputs: ReadonlyArray<StudioOutput> = [LESSON],
  ) => (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <EditorWorkspaceView
          workspaceRoot={workspaceRoot}
          projectName="project"
          selectedFilePath={filePath}
          expandedDirectories={new Set()}
          centerMode={centerMode}
          diffFiles={[]}
          selectedDiffFilePath={null}
          diffPanel={<div>Diff pane</div>}
          chatPanel={<div>Chat pane</div>}
          onSelectFile={vi.fn()}
          onSelectDiffFile={vi.fn()}
          onToggleDirectory={vi.fn()}
          onCenterModeChange={vi.fn()}
          editFilePath={centerMode === "fileEdit" ? filePath : null}
          editDiffBaseRev={null}
          onEditFile={vi.fn()}
          onCloseEdit={vi.fn()}
          studioOutputs={studioOutputs}
        />
      </SidebarProvider>
    </QueryClientProvider>
  );
}

const source = () => page.getByRole("radio", { name: "Source", exact: true });
const preview = () => page.getByRole("radio", { name: "Preview", exact: true });

it.each(["light", "dark"] as const)(
  "keeps editor controls and surfaces themed in %s at 18px",
  async (theme) => {
    const root = document.documentElement;
    const originalPack = resolveThemePack(DEFAULT_THEME_STATE, theme);
    const scale = getAppTypographyScale(18);
    root.classList.toggle("dark", theme === "dark");
    for (const [key, value] of Object.entries(scale)) {
      const token = key
        .replace(/Px$/, "")
        .replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      root.style.setProperty(`--app-font-size-${token}`, `${value}px`);
    }
    const view = makeView();
    const screen = await render(view());
    await expect.element(preview()).toHaveAttribute("aria-checked", "true");
    for (const scope of ["window", "sidebar", "none"] as const) {
      const build = buildThemeCssVariables(
        { ...originalPack, theme: { ...originalPack.theme, opaqueWindows: scope === "none" } },
        theme,
        {
          electron: true,
          isMac: true,
          translucency: { opacity: 0.8, blur: 20, sidebarOnly: scope === "sidebar" },
        },
      );
      for (const [name, value] of Object.entries(build.variables))
        root.style.setProperty(name, value);
      root.setAttribute("data-window-material", build.material);
      root.setAttribute("data-window-translucency", build.translucencyScope);
      const workspace = page
        .getByRole("tablist", { name: "Explorer view" })
        .element()
        .closest<HTMLElement>("[data-editor-workspace]")!;
      const surfaces = [workspace, ...workspace.querySelectorAll("aside")];
      for (const surface of surfaces) {
        const clear = getComputedStyle(surface).backgroundColor === "rgba(0, 0, 0, 0)";
        expect(clear, `${scope} ${surface.tagName}`).toBe(scope === "window");
      }
      expect(
        getComputedStyle(page.getByText("project", { exact: true }).first().element()).fontSize,
      ).toBe(`${scale.uiLgPx}px`);
      await source().click();
      await screen.rerender(view("diff"));
      await expect.element(source()).not.toBeInTheDocument();
      await screen.rerender(view());
      await expect.element(source()).toHaveAttribute("aria-checked", "true");
      await page.getByRole("tab", { name: "Search", exact: true }).click();
      await page.getByPlaceholder("Search files...").fill("settings");
      await expect.element(page.getByPlaceholder("Search files...")).toHaveValue("settings");
      await page.getByRole("button", { name: "Files", exact: true }).click();
      await expect.element(source()).toHaveAttribute("aria-checked", "true");
    }
  },
);

// The seam between the center workspace and the chat rail. Sized from measured boxes
// rather than class names, because the whole point of these cases is that the divider is
// visible, sits ON the boundary, and drives the layout — none of which a snapshot shows.
const seam = () => document.querySelector<HTMLButtonElement>('button[data-slot="sidebar-rail"]')!;
const chatPanel = () => document.querySelector<HTMLElement>('[data-slot="sidebar-container"]')!;
const centerPane = () => document.querySelector<HTMLElement>("[data-editor-workspace] main")!;

// The pane bounds, imported rather than re-declared so a change to the policy moves this
// test with it instead of quietly passing against stale numbers.
import {
  EDITOR_CENTER_PANE_MAX_WIDTH,
  EDITOR_CENTER_PANE_MIN_WIDTH,
  EDITOR_CHAT_PANE_MAX_WIDTH,
  EDITOR_CHAT_PANE_MIN_WIDTH,
} from "./EditorWorkspaceView.logic";

// The rail is `absolute inset-y-0`, so its box is a full-height strip whose horizontal
// center is the boundary. The painted line is that box's `::before`.
const seamLine = () => getComputedStyle(seam(), "::before");

// The rail is `sm:flex` and the pane row is `lg:flex-row`, and the whole seam is desktop-only
// (below `md` the chat rail renders as an off-canvas sheet). The harness default viewport is
// phone-sized, so every seam case has to widen it or it measures a layout that does not exist.
const SEAM_VIEWPORT = { width: 1440, height: 900 };
async function renderAtSeamViewport(view = makeView()()) {
  await page.viewport(SEAM_VIEWPORT.width, SEAM_VIEWPORT.height);
  return render(view);
}

/** Pointer drag from the seam's current center to `targetClientX`. */
async function dragSeamTo(targetClientX: number) {
  const rail = seam();
  const box = rail.getBoundingClientRect();
  const from = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  rail.dispatchEvent(
    new PointerEvent("pointerdown", {
      clientX: from.x,
      clientY: from.y,
      pointerId: 1,
      button: 0,
      bubbles: true,
    }),
  );
  rail.dispatchEvent(
    new PointerEvent("pointermove", {
      clientX: targetClientX,
      clientY: from.y,
      pointerId: 1,
      bubbles: true,
    }),
  );
  // The rail throttles the layout write to a rAF; let it land before reading boxes.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  rail.dispatchEvent(
    new PointerEvent("pointerup", {
      clientX: targetClientX,
      clientY: from.y,
      pointerId: 1,
      button: 0,
      bubbles: true,
    }),
  );
}

it("paints a resting divider centered on the center/chat boundary", async () => {
  await renderAtSeamViewport();
  await expect.element(page.getByRole("button", { name: "Resize Sidebar" })).toBeInTheDocument();

  const boundary = centerPane().getBoundingClientRect().right;
  const railBox = seam().getBoundingClientRect();
  // The hit area straddles the boundary, so its center must land on it.
  expect(Math.abs(railBox.left + railBox.width / 2 - boundary)).toBeLessThanOrEqual(1);

  const line = seamLine();
  expect(line.width).not.toBe("0px");
  expect(line.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  // A hairline at rest, not the 3px grab affordance.
  expect(parseFloat(line.width)).toBeLessThanOrEqual(1.5);
});

it("widens the divider on hover and while dragging", async () => {
  await renderAtSeamViewport();
  const restingWidth = parseFloat(seamLine().width);

  await page.getByRole("button", { name: "Resize Sidebar" }).hover();
  await expect.poll(() => parseFloat(seamLine().width)).toBeGreaterThan(restingWidth);

  // Pointer capture means the drag can outrun the 16px hit area; `data-resizing` is what
  // keeps the highlight lit, so assert on the attribute rather than on :hover.
  const rail = seam();
  const box = rail.getBoundingClientRect();
  rail.dispatchEvent(
    new PointerEvent("pointerdown", {
      clientX: box.left + box.width / 2,
      clientY: box.top + box.height / 2,
      pointerId: 1,
      button: 0,
      bubbles: true,
    }),
  );
  await expect
    .element(page.getByRole("button", { name: "Resize Sidebar" }))
    .toHaveAttribute("data-resizing", "true");

  rail.dispatchEvent(
    new PointerEvent("pointerup", {
      clientX: box.left + box.width / 2,
      clientY: box.top + box.height / 2,
      pointerId: 1,
      button: 0,
      bubbles: true,
    }),
  );
  await expect
    .element(page.getByRole("button", { name: "Resize Sidebar" }))
    .not.toHaveAttribute("data-resizing");
});

it("resizes both the chat rail and the center pane from one drag", async () => {
  await renderAtSeamViewport();
  const chatBefore = chatPanel().getBoundingClientRect().width;
  const centerBefore = centerPane().getBoundingClientRect().width;
  const boundaryBefore = centerPane().getBoundingClientRect().right;

  // Drag the seam left: the chat rail must grow.
  await dragSeamTo(seam().getBoundingClientRect().left - 120);

  const chatAfter = chatPanel().getBoundingClientRect().width;
  const centerAfter = centerPane().getBoundingClientRect().width;
  expect(chatAfter).toBeGreaterThan(chatBefore);
  // The center absorbs the difference, so the two always tile the row exactly.
  expect(centerAfter).toBeLessThan(centerBefore);
  expect(Math.abs(centerAfter + chatAfter - (centerBefore + chatBefore))).toBeLessThanOrEqual(1);
  // And the seam itself moved, rather than the panes resizing under a static handle.
  expect(centerPane().getBoundingClientRect().right).toBeLessThan(boundaryBefore);
});

it("persists the dragged width and restores it on remount", async () => {
  const storageKey = "synara.editor.chatPaneWidth";
  const view = makeView();
  const screen = await renderAtSeamViewport(view());
  const chatBefore = chatPanel().getBoundingClientRect().width;

  await dragSeamTo(seam().getBoundingClientRect().left - 100);

  const stored = Number(window.localStorage.getItem(storageKey));
  expect(stored).toBeGreaterThan(chatBefore);

  // The width is a stored preference, so it survives leaving the view entirely.
  await screen.unmount();
  await renderAtSeamViewport(view());
  expect(Math.abs(chatPanel().getBoundingClientRect().width - stored)).toBeLessThanOrEqual(1);
});

it("hides the divider while the chat rail is collapsed", async () => {
  await renderAtSeamViewport();
  await page.getByRole("button", { name: "Hide chat panel" }).click();

  // The rail stays mounted (pointer-events: none) but must not draw on the window edge.
  await expect.poll(() => getComputedStyle(seam(), "::before").display).toBe("none");
});

// The two panes' width bounds, asserted from measured boxes. The drag cases above only prove
// the seam responds; these prove it stops at the right places and never opens a gap.
it("stops the drag at the rail's minimum and maximum width", async () => {
  await renderAtSeamViewport();
  const chatBefore = chatPanel().getBoundingClientRect().width;

  // Far past the ceiling: the rail clamps to its own max, not to the pointer.
  await dragSeamTo(seam().getBoundingClientRect().left - 4000);
  expect(Math.round(chatPanel().getBoundingClientRect().width)).toBeLessThanOrEqual(
    Math.round(EDITOR_CHAT_PANE_MAX_WIDTH) + 1,
  );

  // Far past the floor in the other direction.
  await dragSeamTo(seam().getBoundingClientRect().right + 4000);
  expect(chatPanel().getBoundingClientRect().width).toBeGreaterThanOrEqual(
    EDITOR_CHAT_PANE_MIN_WIDTH - 1,
  );

  // Whatever it clamped to, the row is still fully tiled — no gap, no overlap.
  const center = centerPane().getBoundingClientRect();
  const chat = chatPanel().getBoundingClientRect();
  expect(Math.abs(chat.left - center.right)).toBeLessThanOrEqual(1);
  expect(chatBefore).toBeGreaterThan(0);
});

it("refuses to starve the center pane below its minimum", async () => {
  await renderAtSeamViewport();

  // Drag well past the point where the center would hit its floor.
  await dragSeamTo(seam().getBoundingClientRect().left - 4000);

  const center = centerPane().getBoundingClientRect();
  expect(center.width).toBeGreaterThanOrEqual(EDITOR_CENTER_PANE_MIN_WIDTH - 1);
  // The panes still meet exactly.
  expect(Math.abs(chatPanel().getBoundingClientRect().left - center.right)).toBeLessThanOrEqual(1);
});

it("keeps the center pane from stretching past its ceiling on a wide window", async () => {
  // Wider than centerMax + chatMax, so the center's ceiling is the binding constraint here.
  await page.viewport(EDITOR_CENTER_PANE_MAX_WIDTH + EDITOR_CHAT_PANE_MAX_WIDTH + 600, 900);
  await render(makeView()());
  // Collapse the rail: the center pane is then the only thing in the row, and `flex-1` alone
  // would hand it the whole window.
  await page.getByRole("button", { name: "Hide chat panel" }).click();

  const center = centerPane().getBoundingClientRect();
  expect(center.width).toBeLessThanOrEqual(EDITOR_CENTER_PANE_MAX_WIDTH + 1);
  expect(center.width).toBeGreaterThanOrEqual(EDITOR_CENTER_PANE_MIN_WIDTH - 1);
});

it("re-clamps a width stored on a wide monitor when the window is narrower", async () => {
  // A width saved on a large display would otherwise open a rail that crowds out the center.
  window.localStorage.setItem("synara.editor.chatPaneWidth", String(EDITOR_CHAT_PANE_MAX_WIDTH));
  try {
    await renderAtSeamViewport();

    const center = centerPane().getBoundingClientRect();
    const chat = chatPanel().getBoundingClientRect();
    // Either the row had room for the stored width, or it was pulled back to fit the center.
    expect(chat.width).toBeLessThanOrEqual(EDITOR_CHAT_PANE_MAX_WIDTH + 1);
    if (center.width < EDITOR_CENTER_PANE_MIN_WIDTH) {
      // Only legal on a row too narrow for both floors, which the test viewport is not.
      throw new Error("center pane was starved on a row wide enough for both floors");
    }
  } finally {
    window.localStorage.removeItem("synara.editor.chatPaneWidth");
  }
});

it("keeps independent choices for multiple files and workspaces", async () => {
  const view = makeView();
  const screen = await render(view());
  await source().click();
  await screen.rerender(view("file", "docs/guide.markdown"));
  await expect.element(preview()).toHaveAttribute("aria-checked", "true");
  await source().click();
  await screen.rerender(view());
  await expect.element(source()).toHaveAttribute("aria-checked", "true");
  await preview().click();
  await screen.rerender(view("file", "docs/guide.markdown"));
  await expect.element(source()).toHaveAttribute("aria-checked", "true");
  await screen.rerender(view("file", "docs/guide.markdown", "/Users/tester/other"));
  await expect.element(preview()).toHaveAttribute("aria-checked", "true");
  await screen.rerender(view("file", "docs/guide.markdown"));
  await expect.element(source()).toHaveAttribute("aria-checked", "true");
});

it("keeps non-Markdown files in Source without a Markdown toggle", async () => {
  const screen = await render(makeView()("file", "src/app.ts"));
  await expect.element(source()).not.toBeInTheDocument();
  await expect.element(preview()).not.toBeInTheDocument();
  await screen.unmount();
});

it("switches between the Study and Studio surfaces from the header", async () => {
  const view = makeView();
  const screen = await render(view());

  // Study is the default surface: the course file tree and its explorer view.
  const explorerTabs = page.getByRole("tablist", { name: "Explorer view", exact: true });
  await expect
    .element(page.getByRole("radio", { name: "Study", exact: true }))
    .toHaveAttribute("aria-checked", "true");
  await expect.element(explorerTabs).toBeInTheDocument();

  await page.getByRole("radio", { name: "Studio", exact: true }).click();
  await expect.element(page.getByTestId("studio-artifacts-sidebar")).toBeInTheDocument();
  // Studio's left column is the artifact list, so the Study explorer tabs step aside.
  await expect.element(explorerTabs).not.toBeInTheDocument();

  await page.getByRole("radio", { name: "Study", exact: true }).click();
  await expect.element(page.getByTestId("studio-artifacts-sidebar")).not.toBeInTheDocument();
  await expect.element(explorerTabs).toBeInTheDocument();

  // The choice is a stored preference, so it survives leaving the view entirely.
  expect(window.localStorage.getItem("synara.editor.surface")).toBe("study");
  await screen.unmount();
});

it("widens the agent rail instead of leaving the workspace", async () => {
  // The rail already holds the conversation, so the header control is a focus action rather
  // than a view switch: there is no way to navigate away from the workspace by clicking it.
  await render(makeView()());

  const widen = page.getByRole("button", { name: "Widen" });
  await expect.element(widen).toBeInTheDocument();

  // Asserted on the stored preference rather than a measured box: the rail is a fixed-width
  // column only at `lg` and above, and this suite runs narrow, so the box would not move even
  // though the width did.
  const widthBefore = Number(window.localStorage.getItem("synara.editor.chatPaneWidth"));
  await widen.click();
  const widthAfter = Number(window.localStorage.getItem("synara.editor.chatPaneWidth"));
  expect(widthAfter).toBeGreaterThan(widthBefore);

  // No "switch to chat view" affordance remains in the workspace header.
  expect(page.getByRole("button", { name: "Switch to chat view" }).elements()).toHaveLength(0);
});

it("never clips a surface label, at the largest text scale", async () => {
  // The switch used to be a fixed `w-[9.5rem]`, so a longer label or a larger text scale was
  // truncated inside its own cell. It is `w-max` now; assert that with real layout metrics at
  // the top of the typography range rather than trusting the class names.
  const root = document.documentElement;
  const previousScale = root.getAttribute("style");
  const scale = getAppTypographyScale(22);
  for (const [key, value] of Object.entries(scale)) {
    const token = key.replace(/Px$/, "").replace(/[C-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    root.style.setProperty(`--app-font-size-${token}`, `${value}px`);
  }
  try {
    await render(makeView()());

    for (const label of ["Study", "Studio"]) {
      const radio = page.getByRole("radio", { name: label, exact: true });
      // Inside the radio: the label row holds an optional icon span, then the text span.
      const text = radio.element().querySelector("span > span:last-child")!;
      expect(text.textContent).toBe(label);
      expect(text.scrollWidth, `${label} is horizontally clipped`).toBeLessThanOrEqual(
        text.clientWidth,
      );
      const track = radio.element().parentElement!;
      expect(track.scrollWidth, `${label} track overflows its own box`).toBeLessThanOrEqual(
        track.clientWidth,
      );
    }

    // The switch is centred in the header, so it must sit between the two side columns
    // rather than flush against either of them.
    const group = page.getByRole("radiogroup", { name: "Surface" });
    const header = group.element().parentElement!.parentElement!;
    const centre =
      (group.element().getBoundingClientRect().left +
        group.element().getBoundingClientRect().right) /
      2;
    expect(
      Math.abs(
        centre - (header.getBoundingClientRect().left + header.getBoundingClientRect().right) / 2,
      ),
    ).toBeLessThan(2);

    await page.getByRole("radio", { name: "Studio", exact: true }).click();
    await expect.element(page.getByTestId("studio-artifacts-sidebar")).toBeInTheDocument();
  } finally {
    if (previousScale === null) root.removeAttribute("style");
    else root.setAttribute("style", previousScale);
  }
});

it("groups Studio artifacts by their Outbox category and previews the selected one", async () => {
  window.localStorage.setItem("synara.editor.surface", "studio");
  try {
    const screen = await render(makeView()());
    await expect
      .element(page.getByRole("radio", { name: "Studio", exact: true }))
      .toHaveAttribute("aria-checked", "true");
    await expect.element(page.getByText("Lessons", { exact: true })).toBeInTheDocument();

    // Nothing is previewed until the student picks an artifact.
    await expect.element(page.getByText("Select an artifact to review it.")).toBeInTheDocument();

    const artifactRow = page.getByRole("button", { name: /Cell division lesson/ });
    await artifactRow.click();
    // Selecting an artifact previews it in the center through the same viewer Study uses,
    // and marks the row so the student can see what they are looking at.
    await expect
      .element(page.getByText("Select an artifact to review it."))
      .not.toBeInTheDocument();
    await expect.element(artifactRow).toHaveAttribute("aria-pressed", "true");

    await screen.unmount();
  } finally {
    window.localStorage.removeItem("synara.editor.surface");
  }
});

it("shows space-scoped artifacts across categories and never flashes a spinner over them", async () => {
  // The artifact column now lists everything a course has produced, across every
  // conversation in it, so the entries here stand in for a space-scoped response: several
  // categories, and a list that must stay visible while it refetches.
  try {
    const view = makeView();
    const screen = await render(
      view("file", "README.md", WORKSPACE_ROOT, [
        LESSON,
        {
          name: "2026-07-08_quiz_cells.md",
          relativePath: "Outbox/Quizzes/2026-07-08_quiz_cells.md",
          fullPath: `${WORKSPACE_ROOT}/Outbox/Quizzes/2026-07-08_quiz_cells.md`,
          modifiedAt: "2026-07-08T11:00:00.000Z",
        },
      ]),
    );
    // Switched by click rather than by seeding localStorage, so the assertion does not
    // depend on the stored-preference read happening before first paint.
    await page.getByRole("radio", { name: "Studio", exact: true }).click();

    // Both course categories the agent is taught to use.
    await expect.element(page.getByText("Lessons", { exact: true })).toBeInTheDocument();
    await expect.element(page.getByText("Quizzes", { exact: true })).toBeInTheDocument();
    await expect.element(page.getByRole("button", { name: /Cell division lesson/ })).toBeVisible();
    await expect.element(page.getByRole("button", { name: /Quiz cells/ })).toBeVisible();

    // A space with genuinely nothing yet says so, and does not claim to be loading.
    await screen.rerender(view("file", "README.md", WORKSPACE_ROOT, []));
    await expect.element(page.getByText(/Nothing here yet/)).toBeInTheDocument();
    await expect.element(page.getByText("Loading your work…")).not.toBeInTheDocument();

    await screen.unmount();
  } finally {
    window.localStorage.removeItem("synara.editor.surface");
  }
});

it("renders M3E segmented tab in Mimir theme and switches surfaces", async () => {
  setCodeThemeId("dark", "synara");
  setCodeThemeId("light", "synara");
  try {
    const view = makeView();
    const screen = await render(view("file", "README.md", WORKSPACE_ROOT, [LESSON]));

    // In Mimir theme, M3E segmented tab uses role="tablist" and role="tab"
    const tablist = page.getByRole("tablist", { name: "Surface" });
    await expect.element(tablist).toBeInTheDocument();

    const studyTab = page.getByRole("tab", { name: "Study" });
    const studioTab = page.getByRole("tab", { name: "Studio" });
    await expect.element(studyTab).toHaveAttribute("aria-selected", "true");
    await expect.element(studioTab).toHaveAttribute("aria-selected", "false");

    // The list is 36px tall (h-9) with 32px pill indicator inside the 44px header
    const listEl = tablist.element();
    const header = listEl.closest<HTMLElement>(".h-\\[44px\\]")!;
    expect(Math.round(header.getBoundingClientRect().height)).toBe(44);
    expect(Math.round(listEl.getBoundingClientRect().height)).toBe(36);
    // Does not overflow the 44px header
    expect(listEl.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      header.getBoundingClientRect().top,
    );
    expect(listEl.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      header.getBoundingClientRect().bottom,
    );

    await studioTab.click();
    await expect.element(studioTab).toHaveAttribute("aria-selected", "true");
    await expect.element(page.getByTestId("studio-artifacts-sidebar")).toBeInTheDocument();

    await screen.unmount();
  } finally {
    setCodeThemeId("dark", "codex");
    setCodeThemeId("light", "codex");
  }
});

it("shows only project name with M3E button and hides full workspace path in Mimir theme", async () => {
  setCodeThemeId("dark", "synara");
  setCodeThemeId("light", "synara");
  try {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <EditorWorkspaceView
            workspaceRoot={WORKSPACE_ROOT}
            projectName="project"
            selectedFilePath="README.md"
            expandedDirectories={new Set()}
            centerMode="file"
            diffFiles={[]}
            selectedDiffFilePath={null}
            diffPanel={<div>Diff pane</div>}
            chatPanel={<div>Chat pane</div>}
            onSelectFile={vi.fn()}
            onSelectDiffFile={vi.fn()}
            onToggleDirectory={vi.fn()}
            onCenterModeChange={vi.fn()}
            editFilePath={null}
            editDiffBaseRev={null}
            onEditFile={vi.fn()}
            onCloseEdit={vi.fn()}
            onSelectProject={vi.fn()}
            projectOptions={[{ id: "p1" as any, name: "project" }]}
          />
        </SidebarProvider>
      </QueryClientProvider>,
    );

    // Full path is hidden in Mimir theme
    const workspace = page
      .getByRole("tablist", { name: "Surface" })
      .element()
      .closest<HTMLElement>("[data-editor-workspace]")!;
    expect(workspace.textContent).not.toContain(WORKSPACE_ROOT);
    expect(workspace.textContent).toContain("project");

    // Project button has M3E button attributes and displays project name
    const projectBtn = page.getByRole("button", { name: "project" });
    await expect.element(projectBtn).toBeInTheDocument();
    await expect.element(projectBtn).toHaveAttribute("data-variant", "ghost");

    // Right-side actions also use M3E button
    const hideChatBtn = page.getByRole("button", { name: "Hide chat panel" });
    await expect.element(hideChatBtn).toBeInTheDocument();
    await expect.element(hideChatBtn).toHaveAttribute("data-slot", "button");
    await expect.element(hideChatBtn).toHaveAttribute("data-variant", "outlined");

    await screen.unmount();
  } finally {
    setCodeThemeId("dark", "codex");
    setCodeThemeId("light", "codex");
  }
});

// The Phase 2 acceptance criterion: promoting the workspace must not cost the student their
// way out of it. Editor-rail mode suppresses the chat header's Environment/Hub/Library
// toggles (ChatView.tsx:3004 and :6391-6393), so the editor header's own switcher is the only
// place left to change workspace. It groups by Space, which is also the only way to reach a
// course other than the one you are already in. Without this test the picker could vanish
// behind a header edit and the loss would be silent — no crash, just no way back.
it("keeps project and workspace switching reachable from the editor header", async () => {
  const onSelectProject = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <EditorWorkspaceView
          workspaceRoot={WORKSPACE_ROOT}
          projectName="Biology 101"
          currentProjectId={"p-bio" as never}
          selectedFilePath="README.md"
          expandedDirectories={new Set()}
          centerMode="file"
          diffFiles={[]}
          selectedDiffFilePath={null}
          diffPanel={<div>Diff pane</div>}
          chatPanel={<div>Chat pane</div>}
          onSelectFile={vi.fn()}
          onSelectDiffFile={vi.fn()}
          onToggleDirectory={vi.fn()}
          onCenterModeChange={vi.fn()}
          editFilePath={null}
          editDiffBaseRev={null}
          onEditFile={vi.fn()}
          onCloseEdit={vi.fn()}
          onSelectProject={onSelectProject}
          projectOptions={[
            // `spaceId`/`spaceName` are carried on the option itself, so the grouping is
            // deterministic here and does not depend on the projects/spaces store snapshot.
            {
              id: "p-bio" as never,
              name: "Biology 101",
              spaceId: "s-term1" as never,
              spaceName: "Term 1",
            },
            {
              id: "p-calc" as never,
              name: "Calculus",
              spaceId: "s-term1" as never,
              spaceName: "Term 1",
            },
            {
              id: "p-lit" as never,
              name: "Literature",
              spaceId: "s-term2" as never,
              spaceName: "Term 2",
            },
          ]}
        />
      </SidebarProvider>
    </QueryClientProvider>,
  );

  const trigger = page.getByRole("button", { name: "Switch project" });
  await expect.element(trigger).toBeInTheDocument();
  await trigger.click();

  // Both courses are listed under their Space, which is how a student leaves this course.
  await expect.element(page.getByRole("menuitemradio", { name: "Literature" })).toBeInTheDocument();

  const literature = page.getByRole("menuitemradio", { name: "Literature" });
  await literature.click();
  expect(onSelectProject).toHaveBeenCalledWith("p-lit");

  await screen.unmount();
});
