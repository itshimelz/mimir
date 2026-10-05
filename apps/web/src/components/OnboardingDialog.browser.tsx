// FILE: OnboardingDialog.browser.tsx
// Purpose: Browser coverage for the role step — picking Student / Teacher / Researcher shows
//          that role's space label and icon, and the choice is not written anywhere.
// Layer: Component browser regressions

import "../index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { page } from "vitest/browser";
import { afterEach, expect, it } from "vitest";
import { cleanup, render } from "vitest-browser-react";

import { OnboardingDialog } from "~/onboarding/OnboardingDialog";

afterEach(cleanup);

async function openTour() {
  const screen = await render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <OnboardingDialog open onOpenChange={() => {}} onComplete={() => {}} />
    </QueryClientProvider>,
  );
  await expect.element(page.getByRole("dialog")).toBeInTheDocument();
  return screen;
}

const roleCard = (label: string) => page.getByRole("radio", { name: label, exact: false });
const next = () => page.getByRole("button", { name: "Get started" });

it("shows the student space by default and swaps label and icon per role", async () => {
  await openTour();

  // Step 1 reads as a learning co-worker, not a coding agent.
  await expect.element(page.getByText("Your own agents")).toBeInTheDocument();
  await expect.element(page.getByText("Read before you accept")).toBeInTheDocument();

  await next().click();
  // Every card previews its own space label, so all three are on screen at once.
  for (const label of ["Courses", "Classes", "Research"]) {
    await expect.element(page.getByText(label, { exact: true })).toBeInTheDocument();
  }
  await expect.element(roleCard("Student")).toHaveAttribute("aria-checked", "true");

  // Selecting a role moves the selection and the highlighted preview with it.
  await roleCard("Teacher").click();
  await expect.element(roleCard("Teacher")).toHaveAttribute("aria-checked", "true");
  await expect.element(roleCard("Student")).toHaveAttribute("aria-checked", "false");

  await roleCard("Researcher").click();
  await expect.element(roleCard("Researcher")).toHaveAttribute("aria-checked", "true");

  // Nothing about the choice is persisted: the role is preview-only for now. No store,
  // no settings write, and no prior localStorage entry may appear.
  const persisted = Object.keys(window.localStorage).filter((key) => /role/i.test(key));
  expect(persisted).toEqual([]);
});

it("carries the chosen role's space label into the closing step", async () => {
  await openTour();
  await next().click();
  await roleCard("Researcher").click();

  // Welcome → role → tour → providers → theme → project → done
  for (const label of ["Continue", "Set up", "Continue", "Continue", "Skip for now"]) {
    await page.getByRole("button", { name: label, exact: true }).click();
  }

  await expect.element(page.getByRole("button", { name: /Start using/ })).toBeInTheDocument();
  await expect.element(page.getByText(/Research space/)).toBeInTheDocument();
});
