import {
  ROOM_STYLES,
  ROOM_TYPES,
  type RoomStyle,
  type RoomType,
} from "@furnish/backend/convex/lib/roomTaxonomy";

export type {
  RoomStyle,
  RoomType,
} from "@furnish/backend/convex/lib/roomTaxonomy";

/**
 * The words the gallery is browsed by, in the app's voice rather than the
 * model's. The slugs are the URL, so they live in the backend next to the
 * validators; only the reading of them belongs here.
 */
const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  bathroom: "Bathroom",
  bedroom: "Bedroom",
  "dining-room": "Dining room",
  "family-room": "Family room",
  "home-office": "Home office",
  kitchen: "Kitchen",
  "living-room": "Living room",
  nursery: "Nursery",
  outdoor: "Outdoor space",
};

const ROOM_STYLE_LABELS: Record<RoomStyle, string> = {
  bohemian: "Bohemian",
  coastal: "Coastal",
  contemporary: "Contemporary",
  eclectic: "Eclectic",
  farmhouse: "Farmhouse",
  industrial: "Industrial",
  japandi: "Japandi",
  "mid-century": "Mid-century",
  minimalist: "Minimalist",
  modern: "Modern",
  scandinavian: "Scandinavian",
  traditional: "Traditional",
};

export function isRoomType(value: string): value is RoomType {
  return (ROOM_TYPES as readonly string[]).includes(value);
}

export function isRoomStyle(value: string): value is RoomStyle {
  return (ROOM_STYLES as readonly string[]).includes(value);
}

/** "Living room". Falls back to the slug so an unknown tag still reads. */
export function roomTypeLabel(roomType: string | undefined): string {
  if (roomType && isRoomType(roomType)) {
    return ROOM_TYPE_LABELS[roomType];
  }
  return "Room";
}

const WORD_START = /\b\w/g;

/** "Living Room": the label as a page title writes it. */
export function roomTypeTitle(roomType: string | undefined): string {
  return roomTypeLabel(roomType).replace(WORD_START, (letter) =>
    letter.toUpperCase()
  );
}

export function roomStyleLabel(style: string | undefined): string | null {
  if (style && isRoomStyle(style)) {
    return ROOM_STYLE_LABELS[style];
  }
  return null;
}

/** The style slug in a URL, or undefined when it is missing or invented. */
export function parseStyleParam(
  value: string | undefined
): RoomStyle | undefined {
  return value && isRoomStyle(value) ? value : undefined;
}

/** Matches the backend's fallback display name for a signed-out uploader. */
const GUEST_NAME = "Guest";

/**
 * Who to credit, or nobody. Anonymous uploaders all come back as "Guest",
 * which is a placeholder rather than a person, so it is left off.
 */
export function creditedAuthor(name: string | undefined): string | null {
  const trimmed = name?.trim();
  if (!trimmed || trimmed === GUEST_NAME) {
    return null;
  }
  return trimmed;
}
