import { expect, test } from "@playwright/test";
import { assertNoOverflow, preparePage, VIEWPORTS } from "../test-helpers";

test.describe("homepage functional flow", () => {
  test("keeps one clear hero, aligned CTAs, and a prominent product screenshot", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await preparePage(page, "light");

    await expect(page.locator("h1")).toHaveText("The desktop-first agentic co-learner");
    await expect(page.getByText("09 supported", { exact: true })).toHaveCount(0);

    const actions = page.locator("[data-home-actions]");
    // Download and GitHub are hidden as Mimir is in pre-release
    await expect(actions.getByRole("link", { name: "Star on GitHub" })).toHaveCount(0);
    await expect(actions.getByRole("link", { name: /Download for|Download Mimir/ })).toHaveCount(0);

    const explore = actions.getByRole("link", { name: "Explore Co-Learning Loop" });
    const arch = actions.getByRole("link", { name: "Workspace Architecture" });
    await expect(explore).toHaveAttribute("href", "#workflow");
    await expect(arch).toHaveAttribute("href", "#providers");

    const [exploreBox, archBox] = await Promise.all([explore.boundingBox(), arch.boundingBox()]);
    expect(exploreBox).not.toBeNull();
    expect(archBox).not.toBeNull();
    // Both action buttons share the same row in the hero.
    expect(Math.abs(exploreBox!.y - archBox!.y)).toBeLessThanOrEqual(4);

    const preview = page.locator("[data-hero-preview]");
    await expect(preview).toBeVisible();
    const previewBox = await preview.boundingBox();
    expect(previewBox).not.toBeNull();
    expect(previewBox!.width).toBeGreaterThan(1100);
    expect(previewBox!.y).toBeLessThan(750);
  });

  test("keeps the quiet section rail out of narrower layouts", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await preparePage(page, "light");
    const rail = page.getByRole("navigation", { name: "Homepage sections" });
    await expect(rail).toBeVisible();
    await expect(rail.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "aria-current",
      "location",
    );

    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(rail).toBeHidden();
  });

  test("supports mobile navigation, FAQ disclosure, theme, and reduced motion", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await preparePage(page, "light");
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("button", { name: "Close navigation" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();

    const faq = page.getByRole("button", { name: /What is Mimir/ }).first();
    await faq.press("Enter");
    await expect(faq).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator('[role="region"]').first()).toBeVisible();

    await page.getByRole("button", { name: "Switch to dark mode" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
      true,
    );
    await assertNoOverflow(page);
  });

  for (const [width, height] of VIEWPORTS) {
    test(`keeps landmarks and images stable at ${width}×${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await preparePage(page, width < 500 ? "dark" : "light");
      await expect(page.getByRole("main")).toHaveCount(1);
      await assertNoOverflow(page);
      expect(
        await page.evaluate(() =>
          [...document.images].every(
            (image) =>
              image.complete && image.naturalWidth > 0 && image.width > 0 && image.height > 0,
          ),
        ),
      ).toBe(true);
    });
  }

  test("prevents visiting hidden routes during pre-release by redirecting to homepage", async ({
    page,
  }) => {
    await preparePage(page, "light");
    for (const hiddenPath of ["/install", "/docs", "/changelog", "/sponsor", "/sponsors"]) {
      await page.goto(hiddenPath, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL("/");
      await expect(page.locator("h1")).toHaveText("The desktop-first agentic co-learner");
    }
  });
});
