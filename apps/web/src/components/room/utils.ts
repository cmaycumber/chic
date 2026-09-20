import { ConvexError } from "convex/values";
import type {
  Anchor,
  CommentPin,
  RoomComment,
  RoomRole,
  RoomVersion,
} from "./types";

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
export const PIN_POPOVER_RADIUS = 20;
export const COMPOSER_RADIUS = 28;
export const CLUSTER_RADIUS = 22;

const PERCENT = 100;
const AMAZON_AFFILIATE_TAG = "fitvivo-20";

const MAX_SHORT_NAME = 32;
/** Below this a word-boundary cut leaves too little to recognise. */
const MIN_SHORT_NAME = 12;
/** Amazon packs the specs after the first comma, dash or bracket. */
const NAME_BREAK = /[,\-\u2013\u2014|(]/;

const priceFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

export function formatPrice(value: number): string {
  return priceFormatter.format(value);
}

/** Amazon titles run to a paragraph; a toast only has room for the noun. */
export function shortProductName(name: string): string {
  const head = name.split(NAME_BREAK).at(0)?.trim() ?? "";
  const value = head.length > 0 ? head : name.trim();
  if (value.length <= MAX_SHORT_NAME) {
    return value;
  }
  // Cutting mid-word reads like a glitch, so back up to the last space.
  const cut = value.slice(0, MAX_SHORT_NAME);
  const lastSpace = cut.lastIndexOf(" ");
  const kept = lastSpace > MIN_SHORT_NAME ? cut.slice(0, lastSpace) : cut;
  return `${kept.trimEnd()}…`;
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
  // A ConvexError carries a message we wrote for this person; a plain Error
  // arrives wrapped in request ids and stack noise.
  if (error instanceof ConvexError && typeof error.data === "string") {
    return error.data;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

/** The owner and an invited editor may both change the photo; nobody else. */
export function canEditRoom(role: RoomRole): boolean {
  return role === "owner" || role === "collaborator";
}

/** The one letter that stands in for a person on a pin. */
export function initialOf(name: string | undefined): string {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

/** The version on screen: the room's current one, else the newest. */
export function resolveCurrentVersion(
  versions: RoomVersion[],
  currentVersionId: string | undefined
): RoomVersion | null {
  const current = versions.find((version) => version._id === currentVersionId);
  return current ?? versions.at(-1) ?? null;
}

/** The least a comment has to be for us to number its pin. */
interface AnchoredComment {
  _id: string;
  anchor?: Anchor | undefined;
}

/**
 * Numbers every anchored comment in the order it was written so the badge in
 * the comments panel matches the pin on the photo. Takes the shared, id-free
 * shape too, so a public room numbers its pins exactly the same way.
 */
export function buildPinNumbers(
  comments: readonly AnchoredComment[]
): Map<string, number> {
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

/**
 * Pins for the comments that belong to the version currently on screen.
 *
 * `showAuthors` is off in a room of one: a letter on every pin telling you
 * that you wrote it is noise on your own photo.
 */
export function buildPins(
  comments: RoomComment[],
  numbers: Map<string, number>,
  versionId: string | null,
  showAuthors: boolean
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
        authorInitial: showAuthors ? initialOf(comment.authorName) : null,
        authorIsOwner: comment.authorIsOwner,
        authorName: comment.authorName,
        commentId: comment._id,
        number,
        product: comment.product ?? null,
        status: comment.status,
        text: comment.text,
      });
    }
  }
  return pins;
}

/** All hit-testing needs of a detected item: a normalized box and a name. */
interface BoxedItem {
  box: { height: number; width: number; x: number; y: number };
  label: string;
}

/**
 * Names the piece of furniture a pin landed on. Boxes nest — a cushion sits
 * inside a sofa — so the smallest box containing the point wins, which is the
 * thing a person means when they tap there.
 */
export function findItemLabelAt(
  items: readonly BoxedItem[] | undefined,
  anchor: Anchor | null | undefined
): string | null {
  if (!(items && anchor)) {
    return null;
  }

  let best: string | null = null;
  let smallest = Number.POSITIVE_INFINITY;

  for (const item of items) {
    const { box, label } = item;
    const contains =
      anchor.x >= box.x &&
      anchor.x <= box.x + box.width &&
      anchor.y >= box.y &&
      anchor.y <= box.y + box.height;
    const area = box.width * box.height;
    if (contains && area < smallest) {
      best = label;
      smallest = area;
    }
  }

  return best;
}

/**
 * The item label for every anchored comment, hit-tested against the version
 * the comment was written on rather than whichever one is on screen now.
 */
export function buildAnchorLabels(
  comments: readonly RoomComment[],
  versions: readonly RoomVersion[]
): Map<string, string> {
  const itemsByVersion = new Map<string, RoomVersion["items"]>(
    versions.map((version) => [version._id as string, version.items])
  );
  const labels = new Map<string, string>();

  for (const comment of comments) {
    const label = findItemLabelAt(
      itemsByVersion.get(comment.baseVersionId),
      comment.anchor
    );
    if (label !== null) {
      labels.set(comment._id, label);
    }
  }

  return labels;
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
