// FILE: SegmentedPicker.browser.tsx
// Purpose: Guard the raised-thumb geometry against the track's own width. The chip used to be
//          derived as `(track width - padding) / segment count`, which is only correct when every
//          cell is the same width. The header track is `w-max`, so its cells are sized by their
//          own labels and "Studio" is wider than "Study" — the chip came out ~11px wider than the
//          selected cell and bled across the divider into the neighbouring segment.
// Layer: Component browser regressions
// Depends on: SegmentedPicker and real layout metrics.

import "../index.css";

import { page, userEvent } from "vitest/browser";
import { expect, it } from "vitest";
import { useState } from "react";
import { cleanup, render } from "vitest-browser-react";

import { SegmentedPicker } from "./SegmentedPicker";

/** Sub-pixel slack for accumulated fractional layout widths. */
const TOLERANCE_PX = 0.6;

interface Box {
  readonly left: number;
  readonly right: number;
  readonly width: number;
}

function boxOf(element: Element): Box {
  const { left, right, width } = element.getBoundingClientRect();
  return { left, right, width };
}

async function renderPicker(
  value: "study" | "studio",
  variant: "compact" | "header" = "header",
  labels: readonly [string, string] = ["Study", "Studio"],
) {
  await cleanup();
  await render(
    <div className="w-[420px] p-3">
      <SegmentedPicker
        ariaLabel="Surface"
        {...(variant === "header" ? { variant } : {})}
        value={value}
        onValueChange={() => {}}
        options={[
          { value: "study", label: labels[0], icon: <span>i</span> },
          { value: "studio", label: labels[1], icon: <span>i</span> },
        ]}
      />
    </div>,
  );
  const group = page.getByRole("radiogroup", { name: "Surface" }).element();
  const cells = [...group.querySelectorAll('button[role="radio"]')];
  const thumb = group.querySelector("[data-segmented-thumb]");
  const activeIndex = value === "study" ? 0 : 1;
  return {
    track: boxOf(group),
    cell: boxOf(cells[activeIndex]!),
    chip: thumb ? boxOf(thumb) : null,
    // The icon + label row is what the user reads, so its centre is what must line up.
    labelRow: boxOf(cells[activeIndex]!.firstElementChild!),
    activeIndex,
    cells,
  };
}

/** A picker that actually moves its selection, so the chip has to re-seat on change. */
function SwitchablePicker() {
  const [value, setValue] = useState<"study" | "studio">("study");
  return (
    <div className="w-[420px] p-3">
      <SegmentedPicker
        ariaLabel="Surface"
        variant="header"
        value={value}
        onValueChange={setValue}
        options={[
          { value: "study", label: "Study", icon: <span>i</span> },
          { value: "studio", label: "Studio", icon: <span>i</span> },
        ]}
      />
    </div>
  );
}

it("seats the chip on its own cell instead of spilling into the neighbour", async () => {
  // Unequal labels are the regression: the old percentage math assumed equal cells.
  for (const value of ["study", "studio"] as const) {
    const { cell, chip, activeIndex } = await renderPicker(value);
    expect(chip, "the chip should render once measured").not.toBeNull();

    if (activeIndex === 0) {
      // The chip ends exactly on the divider, never past it.
      expect(chip!.right).toBeCloseTo(cell.right, 1);
    } else {
      expect(chip!.left).toBeCloseTo(cell.left, 1);
    }

    // And it covers its own cell, so no sliver of bare track shows inside the selection.
    const overlap = activeIndex === 0 ? cell.right - chip!.left : chip!.right - cell.left;
    expect(overlap).toBeGreaterThan(cell.width - TOLERANCE_PX);
  }
});

it("overhangs the track symmetrically at whichever end is selected", async () => {
  const first = await renderPicker("study");
  const last = await renderPicker("studio");
  expect(first.chip!.left - first.track.left).toBeCloseTo(
    -(last.chip!.right - last.track.right),
    1,
  );
  // The overhang is a deliberate part of the raised-chip look, so pin its size too.
  expect(first.track.left - first.chip!.left).toBeCloseTo(5, 1);
});

it("centres the icon and label on the chip rather than on the cell", async () => {
  for (const value of ["study", "studio"] as const) {
    const { chip, labelRow } = await renderPicker(value);
    const labelCentre = (labelRow.left + labelRow.right) / 2;
    const chipCentre = (chip!.left + chip!.right) / 2;
    expect(Math.abs(labelCentre - chipCentre)).toBeLessThan(TOLERANCE_PX);
  }
});

it("re-seats the chip when the selection moves", async () => {
  // The chip is measured in an effect keyed on the selection, so a switch has to re-measure
  // rather than leave the chip behind on the segment it started on.
  await cleanup();
  await render(<SwitchablePicker />);
  const studio = page.getByRole("radio", { name: "Studio", exact: true }).element();
  const group = page.getByRole("radiogroup", { name: "Surface" }).element();
  const chipBox = () => {
    const thumb = group.querySelector("[data-segmented-thumb]");
    return thumb ? boxOf(thumb) : null;
  };

  await userEvent.click(studio);
  await expect
    .element(page.getByRole("radio", { name: "Studio", exact: true }))
    .toHaveAttribute("aria-checked", "true");
  const studioCell = boxOf(studio);
  // The chip slides, so poll for it to settle rather than sampling mid-transition.
  await expect.poll(() => chipBox()?.left ?? Number.NaN).toBeCloseTo(studioCell.left, 1);
  const chip = chipBox();
  expect(chip, "the chip should follow the selection").not.toBeNull();
  // It is the trailing chip now, so it overhangs the track's right edge rather than its left.
  expect(chip!.right).toBeGreaterThan(studioCell.right);
});

it("keeps equal-width tracks correct", async () => {
  // The compact track gives every cell `flex-1`, so it is the case the old math was right about.
  // It must not regress now that the chip is measured.
  for (const value of ["study", "studio"] as const) {
    const { cell, chip, activeIndex } = await renderPicker(value, "compact");
    if (activeIndex === 0) expect(chip!.right).toBeCloseTo(cell.right, 1);
    else expect(chip!.left).toBeCloseTo(cell.left, 1);
  }
});

it("stays seated when the neighbouring label is far wider", async () => {
  // A lopsided pair is the worst case for equal-share math: the first cell is much wider than the
  // second, so any percentage-derived chip lands visibly off its own segment.
  const { cell, chip, activeIndex } = await renderPicker("studio", "header", [
    "A much longer first label",
    "B",
  ]);
  expect(activeIndex).toBe(1);
  expect(chip).not.toBeNull();
  expect(chip!.left).toBeCloseTo(cell.left, 1);
});
