import { api } from "@furnish/backend/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import type { FunctionReturnType } from "convex/server";
import type { RoomStyle, RoomType } from "@/lib/room-taxonomy";

/** One room as the gallery grid shows it, straight off `api.rooms.listGallery`. */
export type GalleryCard = FunctionReturnType<
  typeof api.rooms.listGallery
>["rooms"][number];

export interface Gallery {
  /** The cards to render, already narrowed to the active style. */
  rooms: GalleryCard[];
  /** Styles that actually have rooms behind them, so no chip is a dead end. */
  styles: RoomStyle[];
  /** How many rooms this room type has in total, ignoring the style filter. */
  total: number;
}

const EMPTY: Gallery = { rooms: [], styles: [], total: 0 };

interface LoadGalleryArgs {
  limit: number;
  roomType?: RoomType;
  style?: RoomStyle;
}

function stylesIn(rooms: GalleryCard[]): RoomStyle[] {
  const seen = new Set<RoomStyle>();
  for (const room of rooms) {
    if (room.style) {
      seen.add(room.style);
    }
  }
  return [...seen].sort();
}

/**
 * The gallery as a page needs it: the cards, plus the styles worth offering
 * as filters. The unfiltered read is what tells us which chips to draw, so a
 * filtered page costs one extra query and never shows a chip leading nowhere.
 *
 * A gallery that cannot be reached is an empty gallery, not a 500: the pages
 * around it still say what Chic is and still take an upload.
 */
export async function loadGallery({
  limit,
  roomType,
  style,
}: LoadGalleryArgs): Promise<Gallery> {
  try {
    const all = await fetchQuery(api.rooms.listGallery, { limit, roomType });
    if (style === undefined) {
      return {
        rooms: all.rooms,
        styles: stylesIn(all.rooms),
        total: all.rooms.length,
      };
    }
    const filtered = await fetchQuery(api.rooms.listGallery, {
      limit,
      roomType,
      style,
    });
    return {
      rooms: filtered.rooms,
      styles: stylesIn(all.rooms),
      total: all.rooms.length,
    };
  } catch {
    return EMPTY;
  }
}
