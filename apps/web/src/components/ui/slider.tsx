// FILE: slider.tsx
// Purpose: Shared single-value slider. Renders the M3 Expressive primitive from the
//          @m3e registry and keeps the app-specific affordances the composer effort
//          ladder needs: one mark per stop, and a magnetic settle between stops.
// Layer: Base UI component
// Exports: Slider

import { useEffect, useState } from "react";

import { Slider as M3eSlider } from "@/components/m3e/slider";
import { cn } from "~/lib/utils";

type SliderProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  /** `default` is a settings-row slider; `large` is the chunky control used by the
   *  composer effort card. M3E ships one geometry, so this only scales the marks. */
  size?: "default" | "large";
  /** Draw one dot per step so discrete scales (effort levels, sizes) read as a ladder. */
  showStepMarks?: boolean;
  /** Animate the fill between stops with a short overshooting ease so a stepped slider
   *  feels like it snaps to a magnet instead of teleporting. Off for continuous scales,
   *  where the lag would fight the pointer. */
  magnetic?: boolean;
  className?: string;
  "aria-label": string;
  /** Spoken value for assistive tech; defaults to the numeric value. */
  getAriaValueText?: (value: number) => string;
  onValueChange: (value: number) => void;
};

// Snap motion: quick, with a touch of overshoot so the handle visibly "lands" on the
// stop. M3E owns the fill's geometry, so this targets it by its data-slot rather than
// by reaching into the primitive's internals.
const MAGNETIC_MOTION_CLASS =
  "[&_[data-slot=slider-range]>:first-child]:transition-[inset-inline-start,width] [&_[data-slot=slider-range]>:first-child]:duration-180 [&_[data-slot=slider-range]>:first-child]:ease-[cubic-bezier(0.22,1.1,0.36,1)] motion-reduce:[&_[data-slot=slider-range]>:first-child]:transition-none";

function stepMarkPercents(min: number, max: number, step: number): number[] {
  if (!(max > min) || !(step > 0)) return [];
  const marks: number[] = [];
  for (let value = min; value <= max + Number.EPSILON; value += step) {
    marks.push(((value - min) / (max - min)) * 100);
  }
  return marks;
}

// The pointer can leave the slider mid-drag (Base UI captures the pointer, but the
// cursor shown still follows the element under it), so the closed hand is forced
// document-wide for the duration of the press.
function useGrabbingCursor(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    const previous = root.style.cursor;
    root.style.cursor = "grabbing";
    return () => {
      root.style.cursor = previous;
    };
  }, [active]);
}

/**
 * M3 Expressive geometry (16dp track, 4x44dp bar handle, 6dp gaps, end stop
 * indicator) with the app's step ladder drawn over it. The handle is edge-aligned by
 * the primitive, so it never overhangs the track, and the marks sit in a rail inset to
 * the same 8dp handle+gap offset so every dot lands under the handle centre.
 */
function Slider({
  value,
  min,
  max,
  step: stepProp,
  disabled,
  size: sizeProp,
  showStepMarks: showStepMarksProp,
  magnetic: magneticProp,
  className,
  "aria-label": ariaLabel,
  getAriaValueText,
  onValueChange,
}: SliderProps) {
  const step = stepProp ?? 1;
  const size = sizeProp ?? "default";
  const showStepMarks = showStepMarksProp ?? false;
  const magnetic = magneticProp ?? false;
  const marks = showStepMarks ? stepMarkPercents(min, max, step) : [];
  const [pressed, setPressed] = useState(false);
  useGrabbingCursor(pressed);

  useEffect(() => {
    if (!pressed) return;
    const release = () => setPressed(false);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [pressed]);

  return (
    <div
      className={cn("relative w-full", className)}
      data-slot="slider"
      data-size={size}
      {...(pressed ? { "data-pressed": "" } : {})}
    >
      <M3eSlider
        value={value}
        min={min}
        max={max}
        step={step}
        aria-label={ariaLabel}
        {...(disabled ? { disabled: true } : {})}
        {...(getAriaValueText
          ? { getAriaValueText: (_formatted: string, next: number) => getAriaValueText(next) }
          : {})}
        className={cn(magnetic && MAGNETIC_MOTION_CLASS, disabled && "opacity-64")}
        onValueChange={(nextValue) => {
          const single = Array.isArray(nextValue) ? nextValue[0] : nextValue;
          if (typeof single === "number") onValueChange(single);
        }}
        onPointerDown={(event: React.PointerEvent) => {
          if (disabled || event.button !== 0) return;
          setPressed(true);
        }}
      />
      {/* Marks ride above the primitive in an overlay rather than inside its track: the
          track is the primitive's own element and must not be re-implemented here. The
          inset matches the primitive's `--slider-gap` (8px) so a dot sits under the
          handle centre at that value rather than under the handle's leading edge. */}
      {marks.length > 0 ? (
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-1/2 flex -translate-y-1/2 justify-between",
            size === "large" ? "inset-x-[var(--slider-gap,8px)]" : "inset-x-1",
          )}
        >
          {marks.map((percent, index) => (
            <span
              // Percentages are the identity here: a ladder's stops are positional.
              key={`${index}-${percent}`}
              className={cn(
                "size-1 shrink-0 rounded-full bg-muted-foreground/45",
                // The primitive hides its own end stop indicator when the handle reaches
                // the end, so the matching mark goes too or the two read as a mistake.
                index === 0 || index === marks.length - 1 ? "opacity-70" : null,
              )}
              style={{
                // oxlint-disable-next-line no-unsafe-type-assertion
                insetInlineStart: `${percent}%`,
                position: "absolute",
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export { Slider };
