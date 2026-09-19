import type { Anchor, CommentPin, RoomComment, RoomVersion } from "./types";

/**
 * liquid-glass-react styles its inner `.glass` node with inline padding, a
 * 24px gap and an inline-flex layout. These overrides hand layout back to the
 * children so a glass surface can hold a panel, not just a pill of chrome.
 */
export const GLASS_RESET =
  "[&_.glass]:block! [&_.glass]:w-full! [&_.glass]:gap-0! [&_.glass]:p-0!";

/** Refraction is distracting behind text, so text surfaces stay low. */
export const PANEL_DISPLACEMENT = 20;
export const PILL_DISPLACEMENT = 26;

export const PANEL_RADIUS = 24;
export const COMPOSER_RADIUS = 28;
export const CLUSTER_RADIUS = 22;

const PERCENT = 100;
const AMAZON_AFFILIATE_TAG = "fitvivo-20";

const priceFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

export function formatPrice(value: number): string {
  return priceFormatter.format(value);
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Normalized 0..1 coordinate as a CSS percentage. */
export function toPercent(value: number): string {
  return `${value * PERCENT}%`;
}

export function amazonSearchUrl(query: string): string {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${AMAZON_AFFILIATE_TAG}`;
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

/** The version on screen: the room's current one, else the newest. */
export function resolveCurrentVersion(
  versions: RoomVersion[],
  currentVersionId: string | undefined
): RoomVersion | null {
  const current = versions.find((version) => version._id === currentVersionId);
  return current ?? versions.at(-1) ?? null;
}

/**
 * Numbers every anchored comment in the order it was written so the badge in
 * the comments panel matches the pin on the photo.
 */
export function buildPinNumbers(comments: RoomComment[]): Map<string, number> {
  const numbers = new Map<string, number>();
  let next = 1;
  for (const comment of comments) {
    if (comment.anchor) {
      numbers.set(comment._id, next);
      next += 1;
    }
  }
  return numbers;
}

/** Pins for the comments that belong to the version currently on screen. */
export function buildPins(
  comments: RoomComment[],
  numbers: Map<string, number>,
  versionId: string | null
): CommentPin[] {
  if (!versionId) {
    return [];
  }
  const pins: CommentPin[] = [];
  for (const comment of comments) {
    const anchor: Anchor | undefined = comment.anchor;
    const belongsHere =
      comment.baseVersionId === versionId ||
      comment.resultVersionId === versionId;
    const number = numbers.get(comment._id);
    if (anchor && belongsHere && number !== undefined) {
      pins.push({
        anchor,
        commentId: comment._id,
        number,
        status: comment.status,
      });
    }
  }
  return pins;
}

/** Label used in the history strip and the top bar. */
export function versionLabel(index: number): string {
  return index === 0 ? "Original" : `v${index + 1}`;
}

/** Keyboard shortcuts must not fire while the composer has focus. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}
