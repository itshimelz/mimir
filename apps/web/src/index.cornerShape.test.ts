import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The radius scale collapsed once already: every tier was `calc(var(--radius) * 0.8)`,
// so `rounded-md` through `rounded-4xl` all rendered 8px and a `rounded-2xl` dialog
// was indistinguishable from a button. Nested surfaces need R_outer = R_inner + padding,
// which only holds while the tiers are distinct. These assertions fail on any return to
// that state.
const STYLESHEET = readFileSync(join(import.meta.dirname, "index.css"), "utf8");

const RADIUS_TOKENS = [
  "--radius-xs",
  "--radius-sm",
  "--radius-md",
  "--radius-lg",
  "--radius-xl",
  "--radius-2xl",
  "--radius-3xl",
  "--radius-4xl",
] as const;

const EXPECTED_RADIUS_REM = {
  "--radius-xs": "0.25rem",
  "--radius-sm": "0.375rem",
  "--radius-md": "0.5rem",
  "--radius-lg": "0.625rem",
  "--radius-xl": "0.75rem",
  "--radius-2xl": "1rem",
  "--radius-3xl": "1.25rem",
  "--radius-4xl": "1.5rem",
} as const;

function tokenBlock(): string {
  const start = STYLESHEET.indexOf("@theme inline");
  expect(start, "index.css should declare an @theme inline block").toBeGreaterThan(-1);
  return STYLESHEET.slice(start);
}

describe("corner geometry", () => {
  it("declares a distinct value for every radius tier", () => {
    const block = tokenBlock();
    const values = RADIUS_TOKENS.map((token) => {
      const match = block.match(new RegExp(`${token}:\\s*([^;]+);`));
      expect(match, `${token} should be declared in the @theme inline block`).toBeTruthy();
      return { token, value: (match?.[1] ?? "").trim() };
    });

    const wrong = values.filter(({ token, value }) => value !== EXPECTED_RADIUS_REM[token]);
    expect(
      wrong,
      `Radius tiers drifted from the concentric scale:\n${wrong
        .map(({ token, value }) => `  ${token}: ${value}`)
        .join("\n")}`,
    ).toEqual([]);

    // A tier that reuses another tier's value is the exact defect this guards.
    const px = values.map(({ token, value }) => ({
      token,
      px: Number.parseFloat(value) * 16,
    }));
    for (let i = 1; i < px.length; i += 1) {
      expect(
        px[i]!.px,
        `${px[i]!.token} (${px[i]!.px}px) must exceed ${px[i - 1]!.token} (${px[i - 1]!.px}px)`,
      ).toBeGreaterThan(px[i - 1]!.px);
    }
  });

  it("reads corner shape from one inherited variable, defaulting to round", () => {
    expect(STYLESHEET).toMatch(/corner-shape:\s*var\(--app-corner-shape,\s*round\)/);
    // Nothing may set corner-shape directly outside the variable contract, or the
    // per-radius guard stops being the single source of truth. Values are matched to
    // the end of the line so an `@supports (corner-shape: …)` condition is not a
    // declaration.
    const declarations = [...STYLESHEET.matchAll(/(?<![\w-])corner-shape:[ \t]*([^\n;{}]+);/g)].map(
      (match) => match[1]!.trim(),
    );
    const direct = declarations.filter(
      (value) => value !== "round" && !value.startsWith("var(--app-corner-shape"),
    );
    expect(
      direct,
      `Set --app-corner-shape instead of corner-shape directly:\n${direct.join("\n")}`,
    ).toEqual([]);
  });

  it("opts the corner-radius tiers in and resets the full-round tiers", () => {
    expect(STYLESHEET).toMatch(/--app-corner-superellipse:\s*superellipse\(1\.5\)/);

    const superellipseOptIn = STYLESHEET.match(
      /--app-corner-shape:\s*var\(--app-corner-superellipse\)/,
    );
    expect(
      superellipseOptIn,
      "a block should set --app-corner-shape from the superellipse",
    ).toBeTruthy();

    // The guard that keeps 50%/9999px circles and pills circular. Without it a
    // `rounded-full` nested inside a `rounded-2xl` inherits the superellipse and
    // renders as a diamond.
    const reset = STYLESHEET.match(
      /:is\(\.rounded-full,\s*\.rounded-none\)\s*\{\s*--app-corner-shape:\s*round;/,
    );
    expect(
      reset,
      "rounded-full / rounded-none must reset --app-corner-shape to round",
    ).toBeTruthy();
  });

  it("uses one Blink corner implementation per runtime", () => {
    // Electron's legacy property and the standard one are the same Blink feature;
    // applying both at once would double-smooth.
    expect(STYLESHEET).toMatch(/-electron-corner-smoothing:\s*system-ui/);
    const electronGuarded = STYLESHEET.match(
      /:root\[data-runtime="electron"\][^{]*\{[^}]*-electron-corner-smoothing/,
    );
    expect(
      electronGuarded,
      "-electron-corner-smoothing should stay scoped to Electron",
    ).toBeTruthy();
  });
});
