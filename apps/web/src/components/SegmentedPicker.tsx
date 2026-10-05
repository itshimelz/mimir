// FILE: SegmentedPicker.tsx
// Purpose: The raised-thumb segmented control (a recessed track with a sliding selected chip that
//          hangs past the track at either end), as a radio group with arrow-key selection.
//          Two surface variants share the geometry and radio semantics: `compact` (the dense
//          sidebar picker) and `header` (a centred header-scale switch with continuous corners
//          and a glyph per segment). Styling lives in index.css (`.sidebar-segmented-picker`,
//          `.sidebar-segmented-thumb`).
// Layer: Shared presentation
// Exports: SegmentedPicker, SegmentedPickerOption

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { useRadioGroupKeyboardNav } from "~/hooks/useRadioGroupKeyboardNav";
import { cn } from "~/lib/utils";

export interface SegmentedPickerOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly icon?: ReactNode;
  readonly disabled?: boolean;
  readonly title?: string;
}

/** How far the selected chip hangs past the track at either end, in px. */
const THUMB_OVERHANG_PX = 5;

/** A chip position, in px, relative to the track's padding box. */
interface ThumbBox {
  readonly left: number;
  readonly width: number;
  /**
   * How far the label must move to sit centred on the chip rather than on its own cell. The
   * chip is only offset from the cell at the two ends, so this is zero everywhere else.
   */
  readonly labelShift: number;
}

/**
 * Measure the chip off the selected segment's real box instead of deriving it from the track's
 * width.
 *
 * The percentage formula this replaces assumed the track's cells were equal, which is true for
 * the compact `flex-1` track but false for the header track: that one is `w-max`, so each cell is
 * only as wide as its own icon and label, and "Studio" is wider than "Study". Dividing the track
 * by the segment count then placed the chip ~11px wider than the selected cell and pushed it
 * across the divider into its neighbour, which is the gap the header switch used to show.
 *
 * Measuring keeps the chip exact for any label widths, both variants, and any text scale. The
 * raised-chip language is unchanged: an end chip covers its own cell and additionally swallows
 * the track's pad and border on the outer side before overhanging, which is what makes it read
 * as lifted out of the well rather than merely highlighted inside it.
 */
function measureThumb(
  track: HTMLElement,
  cell: HTMLElement,
  index: number,
  count: number,
): ThumbBox {
  const trackBox = track.getBoundingClientRect();
  const cellBox = cell.getBoundingClientRect();
  const style = window.getComputedStyle(track);
  // Offsets are resolved against the track's padding box, so its border comes out of
  // `clientLeft` and the pad has to be added by hand to reach the outer border edge.
  const padLeft = Number.parseFloat(style.paddingLeft) || 0;
  const borderLeft = track.clientLeft;
  const cellLeft = cellBox.left - trackBox.left - borderLeft;
  const cellWidth = cellBox.width;
  // How far an end chip reaches past its own cell: the track pad, the track border, and the
  // overhang that lifts the chip clear of the well.
  const outerSpan = padLeft + borderLeft + THUMB_OVERHANG_PX;
  if (index === 0 && count > 1) {
    return { left: cellLeft - outerSpan, width: cellWidth + outerSpan, labelShift: -outerSpan / 2 };
  }
  if (index === count - 1 && count > 1) {
    return { left: cellLeft, width: cellWidth + outerSpan, labelShift: outerSpan / 2 };
  }
  return { left: cellLeft, width: cellWidth, labelShift: 0 };
}

export function SegmentedPicker<T extends string>({
  value,
  options,
  onValueChange,
  ariaLabel,
  disabled: disabledProp,
  className,
  variant,
}: {
  value: T;
  options: ReadonlyArray<SegmentedPickerOption<T>>;
  onValueChange: (value: T) => void;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
  /**
   * `compact` (default) is the dense sidebar picker. `header` is the centred header-scale
   * variant: continuous corners, a deeper track, and a glyph on each segment. Same raised-thumb
   * geometry and radio semantics either way — only the surface differs.
   */
  variant?: "compact" | "header";
}) {
  const disabled = disabledProp ?? false;
  const headerVariant = variant === "header";
  const radioItemProps = useRadioGroupKeyboardNav({
    values: options.filter((option) => !option.disabled).map((option) => option.value),
    value,
    onValueChange,
  });
  const activeIndex = options.findIndex((option) => option.value === value);

  // The chip is measured rather than derived from the track width, so it needs the live boxes of
  // the track and of every cell. Each cell's node is registered here and composed with the ref the
  // keyboard hook hands back, so the roving tabindex and the measurement share one node.
  const trackRef = useRef<HTMLDivElement | null>(null);
  const cellNodesRef = useRef(new Map<T, HTMLButtonElement>());
  // Stable per-value ref callbacks. An inline arrow would change identity every render, so React
  // would detach and reattach each cell on every render and the resize observer below would
  // keep re-observing nodes it had already dropped.
  const cellRefsRef = useRef(new Map<T, (node: HTMLButtonElement | null) => void>());
  const [thumb, setThumb] = useState<ThumbBox | null>(null);
  // The chip is measured in a layout effect, so the first commit has no chip and the selected
  // label carries no counter-shift. Both are corrected before that first paint, but they must not
  // *animate* into place, so the transitions only switch on after a paint has gone by — arming
  // them in the same commit that applies the correction would transition the correction itself.
  const [animate, setAnimate] = useState(false);

  const measure = useCallback(() => {
    const track = trackRef.current;
    const cell = activeIndex >= 0 ? cellNodesRef.current.get(value) : null;
    if (!track || !cell) {
      setThumb(null);
      return;
    }
    const next = measureThumb(track, cell, activeIndex, options.length);
    setThumb((current) =>
      // Sub-pixel churn from a resize observer would otherwise re-render on every frame.
      current &&
      Math.abs(current.left - next.left) < 0.5 &&
      Math.abs(current.width - next.width) < 0.5 &&
      Math.abs(current.labelShift - next.labelShift) < 0.5
        ? current
        : next,
    );
  }, [activeIndex, options.length, value]);

  useLayoutEffect(measure, [measure]);

  // Arm the transitions only after the frame that first painted the measured chip. A passive
  // effect is not enough: under React's test act() and under a fast mount it can be flushed into
  // the same batch as the measurement, which would transition the correction itself.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Labels, icons, and the user's text scale all change the cells' widths after mount, and a
  // resized window moves them again, so re-measure whenever the track or any cell resizes.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    for (const cell of cellNodesRef.current.values()) observer.observe(cell);
    return () => observer.disconnect();
  }, [measure]);

  const registerCell = (optionValue: T) => {
    const existing = cellRefsRef.current.get(optionValue);
    if (existing) return existing;
    const next = (node: HTMLButtonElement | null) => {
      if (node) cellNodesRef.current.set(optionValue, node);
      else cellNodesRef.current.delete(optionValue);
    };
    cellRefsRef.current.set(optionValue, next);
    return next;
  };

  return (
    // The header track needs its own inset: the selected chip deliberately overhangs the track,
    // so without room here it would collide with whatever sits beside the control. The compact
    // track keeps the original wrapper pad.
    <div className={cn(headerVariant ? "px-2" : "px-1", className)}>
      <div
        ref={trackRef}
        role="radiogroup"
        aria-label={ariaLabel}
        className={cn(
          "relative isolate inline-flex items-stretch p-0.5",
          headerVariant
            ? // Same recessed-track language as the sidebar picker, just at header scale with
              // continuous corners. `w-max` rather than a fixed width, so the track sizes itself to
              // its content and a longer label or a larger text scale can never clip inside a cell.
              "sidebar-segmented-picker squircle w-max rounded-xl"
            : "sidebar-segmented-picker w-full rounded-lg",
        )}
      >
        {thumb ? (
          <div
            aria-hidden
            data-segmented-thumb=""
            className={cn(
              "pointer-events-none absolute -inset-y-[1.5px] z-0",
              animate
                ? "transition-[left,width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
                : null,
              headerVariant
                ? "sidebar-segmented-thumb squircle rounded-lg"
                : "sidebar-segmented-thumb rounded-md",
            )}
            style={{ left: `${thumb.left}px`, width: `${thumb.width}px` }}
          />
        ) : null}
        {options.map((option) => {
          const active = option.value === value;
          const { ref: keyboardRef, ...itemProps } = radioItemProps(option.value);
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled || option.disabled}
              title={option.title}
              ref={(node) => {
                keyboardRef(node);
                registerCell(option.value)(node);
              }}
              className={cn(
                "relative z-10 flex items-center justify-center font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50",
                // The chip fills the selected cell, so an unselected cell needs its own hover
                // fill or hovering reads as "nothing here is clickable".
                !active && !disabled && !option.disabled ? "hover:bg-foreground/6" : null,
                headerVariant
                  ? // Roomier padding than the compact variant. Safe because the header track is
                    // `w-max`: the control grows to fit rather than clipping its own label.
                    "squircle gap-2 rounded-lg px-4 py-2 text-ui"
                  : "min-w-0 flex-1 rounded-md px-2.5 py-1 text-ui-sm",
                active
                  ? "text-[var(--color-text-foreground)]"
                  : "text-[var(--color-text-foreground-secondary)] hover:text-[var(--color-text-foreground)]",
              )}
              onClick={() => onValueChange(option.value)}
              {...itemProps}
            >
              {/* No `min-w-0` here: it would let the label shrink below its content and clip.
                  The track is `w-max`, so the row is only as wide as it needs to be. */}
              <span
                className={cn(
                  "flex shrink-0 items-center gap-1.5",
                  // Gated like the chip: the first measurement must not animate the label into
                  // place on mount.
                  animate
                    ? "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
                    : null,
                )}
                style={{
                  // Only the selected label rides the chip, so it stays centred on the chip
                  // rather than on its own cell while the chip overhangs the track.
                  transform: `translateX(${active && thumb ? `${thumb.labelShift}px` : "0px"})`,
                }}
              >
                {option.icon ? (
                  <span
                    aria-hidden
                    className={cn(
                      // Fixed size on the wrapper plus `[&_svg]:size-full` so the caller's icon
                      // lands at that size whichever icon set it came from (Tabler via
                      // `adaptIcon`, Hugeicons, or a Central mask span).
                      "flex shrink-0 items-center [&_svg]:size-full",
                      headerVariant ? "size-4" : "size-3.5",
                      active
                        ? "text-[var(--color-text-foreground)]"
                        : "text-[var(--color-text-foreground-secondary)]",
                    )}
                  >
                    {option.icon}
                  </span>
                ) : null}
                {/* `whitespace-nowrap` instead of `truncate`: a segmented control's label is
                    short by construction, so clipping it reads as a bug. Overflow is prevented
                    upstream by the track being sized to fit. */}
                <span className="whitespace-nowrap">{option.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
