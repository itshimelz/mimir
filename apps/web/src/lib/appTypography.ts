import {
  DEFAULT_CHAT_FONT_SIZE_PX,
  MAX_CHAT_FONT_SIZE_PX,
  normalizeChatFontSizePx,
} from "../appSettings";

export interface AppTypographyScale {
  basePx: number;
  uiPx: number;
  uiLgPx: number;
  uiSmPx: number;
  uiXsPx: number;
  ui2XsPx: number;
  uiMetaPx: number;
  uiTimestampPx: number;
  chatPx: number;
  chatCodePx: number;
  chatMetaPx: number;
  chatTinyPx: number;
}

function clampTypographyPx(value: number, min: number, max = MAX_CHAT_FONT_SIZE_PX + 2): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

/**
 * Tiers are whole-pixel offsets off the user's chosen size, not ratios.
 *
 * Multiplicative ratios rounded independently made the ladder inconsistent:
 * 14 * 1.08 rounds to 15 and 13 * 1.08 to 14, but 13 * 0.84 is 11 while
 * 12 * 0.84 is 10, so adjacent tiers collapsed onto the same size at some base
 * values and separated at others. Whole-pixel offsets hold every relationship
 * constant at every setting, which is the whole point of a type ladder — the
 * optical step between body copy and a meta label must not move when the user
 * changes the body size.
 *
 * Offsets are relative to a 14px reference and expressed as integers, so at the
 * default setting each tier lands on a clean pixel.
 */
const UI_LG_OFFSET_PX = 1;
const UI_SM_OFFSET_PX = -1;
const UI_XS_OFFSET_PX = -2;
const UI_2XS_OFFSET_PX = -3;
const UI_META_OFFSET_PX = -3;
const UI_TIMESTAMP_OFFSET_PX = -4;
const CHAT_CODE_OFFSET_PX = -1;
const CHAT_META_OFFSET_PX = -3;
const CHAT_TINY_OFFSET_PX = -4;

export function getAppTypographyScale(
  baseFontSizePx = DEFAULT_CHAT_FONT_SIZE_PX,
): AppTypographyScale {
  const basePx = normalizeChatFontSizePx(baseFontSizePx);

  return {
    basePx,
    uiPx: basePx,
    uiLgPx: clampTypographyPx(basePx + UI_LG_OFFSET_PX, basePx),
    uiSmPx: clampTypographyPx(basePx + UI_SM_OFFSET_PX, 10),
    uiXsPx: clampTypographyPx(basePx + UI_XS_OFFSET_PX, 10),
    ui2XsPx: clampTypographyPx(basePx + UI_2XS_OFFSET_PX, 9),
    uiMetaPx: clampTypographyPx(basePx + UI_META_OFFSET_PX, 10),
    uiTimestampPx: clampTypographyPx(basePx + UI_TIMESTAMP_OFFSET_PX, 8),
    chatPx: basePx,
    chatCodePx: clampTypographyPx(basePx + CHAT_CODE_OFFSET_PX, 10),
    chatMetaPx: clampTypographyPx(basePx + CHAT_META_OFFSET_PX, 8),
    chatTinyPx: clampTypographyPx(basePx + CHAT_TINY_OFFSET_PX, 8),
  };
}
