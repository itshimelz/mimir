# DeepSeek UI Primitives: Corner Geometry, Elevation, Focus, Scrollbars

Status: planned · Source: `mimir_deepseek_ui_audit_report.md` · Branch: `feat/study-studio-views`

## TL;DR

The audit's ten defects all reproduce on this branch. We adopt the DeepSeek
Harness **mechanisms** — universal continuous corner curvature, a progressive
concentric radius scale, layout-neutral `0.5px` hairline elevation,
input-modality-gated focus rings, `5px` context-rebinding scrollbars, a
switch-thumb contrast token — expressed in Mimir's
existing `--app-*` / `--color-*` token system instead of DeepSeek's `--dsw-*`
namespace, so every theme pack in `theme.logic.ts` keeps working.

Decisions taken (owner-confirmed): app-wide radius reset across all eight
tiers, full `1px` → `0.5px` elevation conversion in this pass, additive
typography delta that keeps every tier scaling with the Settings font size.

## Progress

| Phase                                  | State                                                                                                                                                                                    |
| :------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — Radius scale and corner geometry   | **done.** Scale restored, `--app-corner-shape` contract in place, capsules and pills real, `index.cornerShape.test.ts` pins it                                                           |
| 2 — `0.5px` hairline elevation         | **done.** One stroke colour for the whole app, `--default-border-width: 0.5px` drives every Tailwind border, elevation tiers added, all 27 `-1px` hacks and 7 `before:` overlays removed |
| 3 — Modality, scrollbars, switch thumb | **done.** Tracker installed before first render, focus contract gated, `5px` scrollbars, switch thumb token                                                                              |
| 4 — Typography and form font           | **done**, except the shimmer, which is deliberately out of scope (see Phase 4)                                                                                                           |
| 5 — Pre-paint bootstrap                | **done**, reduced to the colour scheme only                                                                                                                                              |

## Audit verification against this branch

| #   | Defect                                                                                        | Verified at                                          | Reproduces |
| :-- | :-------------------------------------------------------------------------------------------- | :--------------------------------------------------- | :--------- |
| 1   | `--radius-md`…`--radius-4xl` all collapse to `calc(var(--radius) * 0.8)` = 8px                | `apps/web/src/index.css:87-92`                       | yes        |
| 2   | `corner-shape` is opt-in via `.squircle`, `superellipse(2)`, excluded in Electron             | `index.css:3330-3345`                                | yes        |
| 3   | `shape="capsule"` renders `rounded-md`; `dialog.tsx` footer selector tests for `rounded-full` | `button.tsx:33,114`; `dialog.tsx:56-58`              | yes        |
| 4   | `BUTTON_GROUP_SURFACE_CLASS_NAME` is `rounded-md` despite its "full pill" doc comment         | `button-group.tsx:23,40`                             | yes        |
| 5   | `StatusChip variant="pill"` is `rounded-md` despite its "capsule" doc comment                 | `status-chip.tsx:40`                                 | yes        |
| 6   | Global `10px` WebKit scrollbars coexist with Base UI `6px` thumbs                             | `index.css:848-874`; `scroll-area.tsx:55-68`         | yes        |
| 7   | Unconditional `focus-visible:ring-2`; no pointer/keyboard modality tracking                   | `button.tsx:23`, `card.tsx:17`, `scroll-area.tsx:26` | yes        |
| 8   | Switch thumb uses `bg-background` (`#0e0e0e` inside a `#222222` track)                        | `switch.tsx:15-16`                                   | yes        |
| 9   | `.shimmer` duty-cycles at `steps(40, end)` = 20fps                                            | `index.css:2733`                                     | yes        |
| 10  | Global `textarea, input { font-family: var(--font-mono-family) }`                             | `index.css:810-814`                                  | yes        |

Live listeners used to size the work:

- **15 files / 27 lines** carry `-1px` border compensation
  (`px-[calc(--spacing(3)-1px)]`, `before:rounded-[calc(var(--radius-lg)-1px)]`).
- **7 files** paint a fake inner border with a `before:absolute before:inset-0`
  overlay: `composerPickerStyles.ts`, `empty.tsx`, `toast.tsx`, `command.tsx`,
  `popover.tsx`, `autocomplete.tsx`, `SidebarSearchPalette.tsx`.
- **244** call sites use `rounded-full` (drives the corner guard design below).
- Electron is **43.4.1** (Chromium 144) — `corner-shape: superellipse()` is native.

## Mechanism design: what differs from the report, and why

### Corner smoothing is driven by a custom property, not a `*` rule plus a guard list

The report sets `corner-shape: superellipse(1.5)` on `*, *::before, *::after`
and then asks every pill to opt back out with `corner-shape: round`. With 244
`rounded-full` sites that list rots immediately, and because `corner-shape`
participates in the cascade a `.rounded-full` **nested inside** a
`.rounded-2xl` still inherits the superellipse and deforms.

Instead, one inherited custom property carries the intent, and the radius
utilities set it on themselves:

```css
/* Every element reads the same inherited variable. `round` is the safe default,
   so anything we did not classify keeps today's circular arcs. */
*,
*::before,
*::after {
  corner-shape: var(--app-corner-shape, round);
}

@supports (corner-shape: superellipse(1.5)) {
  :root {
    --app-corner-superellipse: superellipse(1.5);
  }
  /* The classified corner-radius tiers opt in; the full-round tier resets, so a
     pill nested inside a card is round no matter how deep it sits. */
  :is(
    .rounded-xs,
    .rounded-sm,
    .rounded-md,
    .rounded-lg,
    .rounded-xl,
    .rounded-2xl,
    .rounded-3xl,
    .rounded-4xl
  ) {
    --app-corner-shape: var(--app-corner-superellipse);
  }
  :is(.rounded-full, .rounded-none) {
    --app-corner-shape: round;
  }
}
```

Because custom properties inherit, a descendant's own radius utility always
wins over an ancestor's — the guard is co-located with the radius declaration
instead of duplicated in a selector list. Arbitrary radii
(`rounded-[var(--composer-radius)]`, `rounded-[inherit]`) stay `round` unless
they carry `.squircle`, which becomes a thin alias over the same variable.

Electron keeps the existing split rather than stacking both properties:
`:root[data-runtime="electron"]` sets `-electron-corner-smoothing: system-ui`
on the same element set, and non-Electron gets `corner-shape`. Both are Blink
implementations of the same feature, so exactly one is active per runtime.

### Elevation derives from theme tokens, not fixed rgba

The report's `--dsw-border-l1: color-mix(in srgb, var(--foreground) 8%, …)`
would bypass Mimir's contrast-driven border derivation
(`theme.logic.ts:1276-1278` sets `--color-border`, `--color-border-focus`,
`--color-border-heavy`, `--color-border-light` per theme pack). Our hairline
strokes and shadows resolve through those existing tokens so every
Linear/Vercel/Notion/Raycast pack keeps its intended contrast.

### The typography ladder keeps scaling

The report hardcodes `uiXsPx: 12`, `ui2XsPx: 11`. That breaks the AGENTS.md
rule that UI text follows the size chosen in Settings. We use the same
additive-delta idea — an integer offset from a 14px baseline instead of
per-tier `Math.round` ratios — but every tier stays an offset off the user's
setting.

## Phase 1 — Radius scale and corner geometry

Highest visual payoff, near-zero behavioural risk. Lands first so later
phases are reviewed against the corrected geometry.

| File                                     | Change                                                                                                                                                                                          |
| :--------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.css:85-92`                        | Replace the eight collapsed `--radius-*` tokens with the progressive scale: `xs 4px`, `sm 6px`, `md 8px`, `lg 10px`, `xl 12px`, `2xl 16px`, `3xl 20px`, `4xl 24px`                              |
| `index.css` (new block)                  | `--app-corner-shape` contract + `@supports (corner-shape: superellipse(1.5))` classification described above                                                                                    |
| `index.css:3330-3345`                    | Rewrite `@utility squircle` as an alias that sets `--app-corner-shape: var(--app-corner-superellipse)`; drop the `:not([data-runtime="electron"])` split in favour of the per-engine properties |
| `index.css:523,536,561,570,861,893,2841` | Add `--app-corner-shape: round` to the six raw-CSS circular rules (theme sliders, color-picker hue track/pointer, composer pill — `index.css:3037-3038` already does this and is the precedent) |
| `button.tsx:33,114`                      | `shape.capsule` and the trailing compound variant become `rounded-full corner-round`; `shape.round` gains the guard                                                                             |
| `button-group.tsx:23,40`                 | `BUTTON_GROUP_SURFACE_CLASS_NAME` → `rounded-full corner-round`; child segments `[&_button]:rounded-full corner-round`                                                                          |
| `status-chip.tsx:29,40`                  | `StatusDot` and `StatusChip variant="pill"` → `rounded-full corner-round`                                                                                                                       |
| `input.tsx:64-66`                        | Inherits the capsule fix from `BUTTON_GROUP_SURFACE_CLASS_NAME`; verify the comment still matches                                                                                               |
| `dialog.tsx:56-58`                       | Re-verify `dialogFooterButtonSlotSelector` now excludes real `rounded-full` capsules correctly                                                                                                  |

Concentricity target: `R_outer = R_inner + padding` holds for the
`rounded-xl` menu shell (`12px`) around `rounded-md` rows (`8px`) with `p-1`
(`4px`), and for `rounded-2xl` dialogs (`16px`) around `rounded-lg` panels
(`10px`).

Risk: `md`/`lg` change from `8px`→`8px`/`10px`, so the visible delta is
concentrated in `xl` and above — exactly the floating surfaces that read wrong
today. Still a full-app visual change; needs a pass over the main surfaces.

## Phase 2 — Layout-neutral `0.5px` hairline elevation

Converts layout-consuming `1px` borders into a zero-layout hairline stroke
layered under two soft ambient shadows, then deletes the compensation hacks
it makes unnecessary.

Add to `:root` / `.dark`:

| Token                                                       | Value                                                                |
| :---------------------------------------------------------- | :------------------------------------------------------------------- |
| `--app-elevation-stroke-color`                              | `var(--color-border)` — theme-derived                                |
| `--app-elevation-stroke`                                    | `0 0 0 0.5px var(--app-elevation-stroke-color)`                      |
| `--app-shadow-lv1` / `-lv2` / `-lv3` / `-soft`              | Two-layer low-alpha ambient pairs; dark mode raises alpha, never hue |
| `--app-elevation-panel` / `-prominent` / `-modal` / `-soft` | stroke + the matching shadow pair                                    |
| `--app-menu-surface-fill` / `--app-menu-backdrop-filter`    | translucent menu fill + `blur(20px) saturate(180%)`                  |

Utilities: `app-elevated-panel`, `app-elevated-soft`, `app-elevated-prominent`,
`app-elevated-modal`, `app-menu-surface`. Each declares `border: 0` and composes
`box-shadow` from the _currently bound_ stroke variable rather than the composed
token, so a local rebind (hover, focus, split-pane) takes effect immediately.

Conversion order — one surface family at a time, each independently
revertable:

| Surface family                     | Files                                                                                                                                                                                              | Notes                                                                                                                                  |
| :--------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| Menus, popovers, selects, tooltips | `menu.tsx`, `popover.tsx`, `select.tsx`, `composerPickerStyles.ts`                                                                                                                                 | `select.tsx:194,213` scroll arrows lose their `before:inset-x-px` fake border entirely                                                 |
| Dialogs and command palettes       | `dialog.tsx`, `command.tsx`, `RunningChatsQuitDialog.tsx`                                                                                                                                          | `command.tsx:60` keeps its `before:` fill overlay, drops the inner 1px shadow; `:157` and `:230` lose `clip-path`/`calc(-1px)` corners |
| Cards and toasts                   | `card.tsx`, `toast.tsx`, `empty.tsx`, `autocomplete.tsx`                                                                                                                                           | `empty.tsx:37` and `toast.tsx:817` lose their whole `before:` inner-shadow block                                                       |
| Form controls                      | `button.tsx:104`, `select.tsx:49-52`, `toggle.tsx:20-24`, `textarea.tsx:34-37`, `input-group.tsx:15,34-40`, `combobox.tsx:90,99,332,356`, `autocomplete.tsx:38,47`, `SidebarSearchPalette.tsx:729` | Replace `px-[calc(--spacing(3)-1px)]` with `px-3`, `before:rounded-[calc(var(--radius-lg)-1px)]` with the real radius                  |
| Composer                           | `composerPickerStyles.ts:144,157,163,253`, `composerStackedPanelStyles.ts:17`                                                                                                                      | `--composer-radius` moves to `--radius-xl` so the composer reads as an elevated card                                                   |

Also in scope: `theme.logic.ts:337` `OVERLAY_OPACITY = 100` and
`index.css:3419` `--composer-glass-filter: none` / `:3665` picker backdrop —
revisited once the fill and blur tokens exist, since macOS uses a page cut-out
(`installGlassOverlayCutout`) instead of `backdrop-filter` and must keep
working.

Risk: highest in the plan. Every converted surface loses 1px of layout box, so
padding and child alignment shift by 1px. Verification is visual, per surface
family.

## Phase 3 — Input modality, scrollbars, switch thumb

| File                              | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| :-------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/inputModality.ts` (new)      | `installInputModalityTracker()` maintaining `data-input-modality="pointer\|keyboard"` on `<html>`; ignores modifier chords so `Cmd+K` does not flip modality                                                                                                                                                                                                                                                                                                            |
| `main.tsx`                        | Install the tracker before the first render, next to `revealHubsRailItemOnce()`                                                                                                                                                                                                                                                                                                                                                                                         |
| `index.css`                       | `--app-focus-ring-color` (`#4176e6` light / `#7aaaff` dark), `--app-focus-ring-width: 2px`; `html[data-input-modality="pointer"] body :focus-visible:not(:read-write)` sets the ring colour to `transparent` **without** clearing `box-shadow`, so elevation and active borders survive; `[data-automatic-focus]:focus-visible` suppresses programmatic restores                                                                                                        |
| `scroll-area.tsx:26`              | Drop the viewport `focus-visible:ring-2` so a scrollable pane never grows a viewport-wide ring                                                                                                                                                                                                                                                                                                                                                                          |
| `index.css:848-874` + `3820-3838` | Replace the static `10px` scrollbars with `--app-scrollbar-width: 5px` and rebindable `--app-scrollbar-thumb` / `--app-scrollbar-thumb-hover`; `body` binds base, elevated surfaces (`[data-slot=menu-popup]`, `popover-popup`, `dialog-popup`, `select-popup`, `.app-popup-surface`) rebind to a stronger tier, `[data-slot=sidebar]:not(:hover)` binds `transparent`. Firefox path under `@supports not selector(::-webkit-scrollbar)`, WebKit path under the inverse |
| `scroll-area.tsx:55-68`           | `ScrollBar` thumb width follows `--app-scrollbar-width` instead of a hardcoded `w-1.5`                                                                                                                                                                                                                                                                                                                                                                                  |
| `switch.tsx:15-16`                | `--app-switch-thumb` token: white in light mode, a neutral bluish 400 in dark mode, so an off thumb is always lighter than its track                                                                                                                                                                                                                                                                                                                                    |

## Phase 4 — Typography delta ladder and form font reset

| File                     | Change                                                                                                                                                                                                                                                                                                |
| :----------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `appTypography.ts:31-44` | Replace per-tier `Math.round(base * ratio)` with an integer `delta = base - 14` applied as whole-pixel offsets per tier. Body, `ui-lg`, `ui-sm`, `ui-xs`, `ui-2xs`, meta, timestamp, chat tiers all still move with the setting; only the ratio artefacts (tiers rounding at different bases) go away |
| `index.css:810-814`      | Drop `textarea, input` from the monospace reset so form controls inherit `--font-ui-family`. Audit the call sites that compensated with `.font-system-ui` and remove the now-redundant class                                                                                                          |
| `index.css:2733`         | Not applied — see below                                                                                                                                                                                                                                                                               |

`useAppTypography.ts` keeps its variable list; only the numbers it writes
change.

**The 20fps shimmer stays stepped.** The audit argues the `steps(40, end)` duty
cycle is unnecessary because the composer blur is off. It is not off where the
cost is: `animationTimelineSync.ts` pins the spinners, status labels, and
shimmer to one document-timeline phase specifically to collapse their repaints
over the macOS-vibrancy sidebar, and a Chromium probe already drove that
decision. `MessagesTimeline.tailAnchor.browser.tsx:229` asserts the timing
function is `steps(40)`. Changing this is a performance change with a
measurement behind it, not a primitive fix, and it would desynchronise the
spinner cadence unless the sync is re-tuned in the same pass. Reopen it as its
own change with a fresh trace.

## Phase 5 — Pre-paint bootstrap

Reduced from the report's version, which duplicated theme logic in
`index.html` (hardcoding a `synara:theme` key and an `#181818` fallback) and
would drift from `theme.logic.ts`.

| File         | Change                                                                                                                                                                                                         |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.html` | A synchronous inline `<head>` script that sets `color-scheme` and the `dark` class from the persisted mode only — no surface colour, no font size. Keeps the boot splash from flashing light on a dark install |

Deferred, with reasons:

- Bundling the five Google Fonts offline. The current preloaded,
  `rel`-promoted sheet is already non-blocking by design (see the comment in
  `index.html`); bundling is a real FOUT win but a separate, larger change.
- `bootstrap.ts` awaiting `bootstrapPairingSession()` before importing
  `./main`. Moving that off the critical path is a startup-latency change to
  auth, not a styling change.
- `useChatTranscriptScroll.ts` `ResizeObserver` tail-following and
  `useSmoothStreamedText.ts` 40ms → 16ms emit. Real scroll-physics work with
  its own regression surface; the transcript scroll tests
  (`chat-scroll.test.ts`, `ChatTranscriptPane.test.tsx`) are the gate, and this
  deserves its own change rather than riding along with a styling diff.

## Files touched

New (3): `apps/web/src/lib/inputModality.ts`, `apps/web/src/lib/inputModality.test.ts`,
`apps/web/src/index.cornerShape.test.ts`

Modified — `index.css`, `main.tsx`, `lib/appTypography.ts`,
`components/ui/{button,button-group,input,card,dialog,menu,popover,select,switch,scroll-area,status-chip,command,toast,empty,autocomplete,combobox,textarea,input-group,toggle}.tsx`,
`components/chat/composerPickerStyles.ts`, `components/chat/composerStackedPanelStyles.ts`,
`components/RunningChatsQuitDialog.tsx`, `components/SidebarSearchPalette.tsx`,
`apps/web/index.html`

## Verification

Per phase, smallest relevant checks:

```
bun run fmt:check
bun run lint
bun run typecheck
bun run test -- apps/web          # affected Vitest projects
```

Existing gates that must keep passing unchanged:

- `uiFontSize.test.ts` — no new fixed Tailwind text sizes (Phase 4 rewrites
  `appTypography.ts`; the token contract is unchanged, so the fixed-size count
  must not grow).
- `hasSelectorVariants.test.ts` — Phase 1 and 2 add plain `:is()` selectors and
  no `group-has-*` / `has-*:*:` variants.
- `theme.logic.test.ts` — Phase 2's elevation tokens resolve through
  theme-derived borders, so theme output must be byte-identical.
- `chat-scroll.test.ts`, `ChatTranscriptPane.test.tsx` — untouched in Phases 1-4.

New gates:

- `index.cornerShape.test.ts` — asserts the eight radius tokens are strictly
  increasing, that `rounded-full` and `rounded-none` set `--app-corner-shape:
round`, and that the classified tiers set the superellipse. This is the
  regression guard for the collapse in Phase 1.
- `inputModality.test.ts` — modifier chords do not flip modality; teardown
  removes both listeners.

Manual, because no test covers them:

- Launch the desktop app (Electron 43) and the browser build. Confirm the
  per-engine corner split does not stack and that macOS vibrancy still paints.
- Visual pass per Phase 2 surface family: menus, dialogs/command, cards/toasts,
  form controls, composer. Watch for the 1px layout shift.
- Keyboard-only walk with a screen reader on: switch, tabs, dialogs, sidebar.
  Confirm the pointer suppression never hides a ring a keyboard user needs.
- Scroll a sidebar and an open menu; confirm the `5px` bar appears on hover and
  the sidebar bar disappears when the pointer leaves.

`bun run windows-runtime:check` is not required — no platform or process
boundary moves. `bun run migrations:check` is not required — no schema change.

## M3E removal

`ee9e91172 refactor(web): remove M3E design layer` deleted the Material 3
stylesheet but left its tests behind, so seven files kept asserting a palette
that no longer ships. They were all red. Removed:

| File                                                     | Assertions lost                                                                 |
| :------------------------------------------------------- | :------------------------------------------------------------------------------ |
| `components/ui/m3Interactive.browser.tsx`                | `Button`, `Switch`, `Tabs`, `Toggle` M3 elevation and geometry                  |
| `components/ui/m3Overlays.browser.tsx`                   | `Menu` (incl. `MenuSub` flyout), `Popover`, `Tooltip` M3 scaling and row height |
| `components/ui/m3Primitives.browser.tsx`                 | `Alert`, `Badge`, `Kbd`, `Separator`, `Skeleton` M3 roles                       |
| `components/ui/m3Form.browser.tsx`                       | `Input`, `Checkbox`, `Select` M3 field geometry                                 |
| `components/ProjectSourceSegmentedPicker.m3.browser.tsx` | segmented-picker tab semantics and pill track                                   |
| `components/AppRail.browser.tsx`                         | whole file — both `describe` blocks were M3 rail geometry and M3 role colours   |
| `lib/contextMenuFallback.m3.browser.ts`                  | whole file — asserted an M3 palette the fallback stopped using                  |

`components/settings/SettingsSwitch.browser.tsx` lost only its M3 test (52x32
track, M3 selected pair); its sibling geometry test is not M3-specific and
stays.

What was **not** touched: `apps/marketing/src/components/m3e/` (~20 files) is a
live component library behind the public website — homepage, privacy, sponsor,
sponsors, docs, FAQ, not-found, ChangelogNav, HomepageRail,
MultiProjectShowcase. Different app, different blast radius.

The app-side M3E **style** layer was already fully gone: zero `m3-*` classes
remain in `index.css` and `theme/m3.material.css` no longer exists.

## Implementation notes

Two items came out of the build check in the same pass:

- `.font-system-ui` is now a no-op on form controls — `body` already carries
  `var(--font-ui-family)`, so `input { font-family: inherit }` reaches the same
  stack. The class is left in place: removing it means editing ~100 call sites
  for zero visual change, which is churn without benefit. Drop it whenever those
  components are next touched.
- The xterm terminal drawer had its own `width: 10px !important` scrollbar,
  explicitly commented as "parity with chat". Chat is now `5px`, so the token
  replaced the literal. Third-party widget, so it needs a look in the visual
  pass — a narrower scroll column in the terminal is a usability call, not just
  a style one.

## Open items

- The five theme packs in `theme.logic.ts:207-234` derive borders but not
  shadows. Phase 2 introduces the first real shadow ladder; whether packs
  should be able to tune it is a design-system call we have answered "no" for
  now (one ladder, theme-neutral alpha), flagged in case that is wrong.
- `.app-rail-item` (`index.css:277`) is commented as a 36×36 squircle but
  carries no `squircle` class today. Phase 1 fixes it through `rounded-md`
  automatically; worth a look in the visual pass since it is on the app rail
  and always visible.

## Context menu fix

`contextMenuFallback.ts` held the highlight as one space-joined string:

```ts
const HIGHLIGHT_CLASS = "bg-accent text-accent-foreground";
level.buttons[index]?.classList.add(HIGHLIGHT_CLASS);
```

`classList.add` takes exactly one token and throws `InvalidCharacterError` on any
token containing whitespace, so **every** hover died at that line. The throw
happened inside the `mouseenter` listener before the rest of it ran, which is why
the symptom was two-fold: no highlight painted, and no submenu opened on hover.
Any row owning a submenu (`Snooze`, `Handoff`, `Fork`, `Copy`) threw on click
instead of opening its flyout. Introduced in `ee9e91172`; `focusItem` never
reached its `.focus()` call either, so keyboard highlight was dead too.

Fixed by holding the tokens as an array and spreading them. Its 7 browser tests
went from 7 failed / 276s to 7 passed / 6.8s.
