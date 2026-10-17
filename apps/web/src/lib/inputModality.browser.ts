import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installInputModalityTracker } from "./inputModality";

function modality() {
  return document.documentElement.getAttribute("data-input-modality");
}

function press(init: KeyboardEventInit) {
  window.dispatchEvent(new KeyboardEvent("keydown", init));
}

function click() {
  window.dispatchEvent(new Event("pointerdown"));
}

describe("installInputModalityTracker", () => {
  let dispose: () => void;

  beforeEach(() => {
    document.documentElement.removeAttribute("data-input-modality");
    dispose = installInputModalityTracker();
  });

  afterEach(() => {
    dispose();
    document.documentElement.removeAttribute("data-input-modality");
    vi.restoreAllMocks();
  });

  it("starts in pointer mode", () => {
    expect(modality()).toBe("pointer");
  });

  it("switches to keyboard on an unmodified key press", () => {
    press({ key: "Tab" });
    expect(modality()).toBe("keyboard");
  });

  it.each([
    ["meta", { key: "k", metaKey: true }],
    ["ctrl", { key: "p", ctrlKey: true }],
    ["alt", { key: "ArrowUp", altKey: true }],
  ])("ignores the %s modifier", (_label, init) => {
    // A shortcut the user typed is keyboard intent, not a pointer interaction.
    press(init);
    expect(modality()).toBe("pointer");
  });

  it("switches back on pointer interaction", () => {
    press({ key: "Tab" });
    click();
    expect(modality()).toBe("pointer");
  });

  it("does not rewrite an unchanged modality", () => {
    const spy = vi.spyOn(document.documentElement, "setAttribute");
    click();
    click();
    expect(spy).not.toHaveBeenCalledWith("data-input-modality", "pointer");
  });

  it("stops listening after dispose", () => {
    dispose();
    press({ key: "Tab" });
    expect(modality()).toBe("pointer");
  });

  it("leaves an existing modality in place when installed again", () => {
    document.documentElement.setAttribute("data-input-modality", "keyboard");
    dispose();
    dispose = installInputModalityTracker();
    expect(modality()).toBe("keyboard");
  });
});
