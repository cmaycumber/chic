import type { Anchor } from "./types";
import type { ImageRect } from "./use-image-rect";

/** Width of the pin composer popover, in px. */
export const PIN_POPOVER_WIDTH = 320;

/** Enough of the popover to keep on screen while it grows with the text. */
const POPOVER_HEIGHT_ESTIMATE = 176;
/** Clears the 28px pin so the popover sits beside it, not on it. */
const PIN_GAP = 26;
const EDGE_MARGIN = 12;
/** Room reserved for the floating top bar and the bottom composer zone. */
const TOP_SAFE = 88;
const BOTTOM_SAFE = 96;

export interface PopoverPosition {
  left: number;
  top: number;
}

function clampRange(value: number, min: number, max: number): number {
  if (max <= min) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

/**
 * Places the pin composer next to its pin, in container pixels. It opens to
 * the right, flips left when the right edge would run off screen, and stays
 * clear of the top bar and the composer zone at the bottom.
 */
export function placePinPopover(
  anchor: Anchor,
  rect: ImageRect
): PopoverPosition {
  const pinLeft = rect.left + anchor.x * rect.width;
  const pinTop = rect.top + anchor.y * rect.height;

  const fitsRight =
    pinLeft + PIN_GAP + PIN_POPOVER_WIDTH <= rect.containerWidth - EDGE_MARGIN;
  const preferredLeft = fitsRight
    ? pinLeft + PIN_GAP
    : pinLeft - PIN_GAP - PIN_POPOVER_WIDTH;

  return {
    left: clampRange(
      preferredLeft,
      EDGE_MARGIN,
      rect.containerWidth - PIN_POPOVER_WIDTH - EDGE_MARGIN
    ),
    top: clampRange(
      pinTop - POPOVER_HEIGHT_ESTIMATE / 2,
      TOP_SAFE,
      rect.containerHeight - POPOVER_HEIGHT_ESTIMATE - BOTTOM_SAFE
    ),
  };
}
