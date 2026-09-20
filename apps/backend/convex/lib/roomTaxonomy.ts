/**
 * The vocabulary the public gallery is organised by.
 *
 * Every listed room carries one room type and one style, both picked by the
 * vision model that already looks at the photo. The lists live here rather
 * than in the schema because three places need the same words: the Convex
 * validators, the zod schema the model answers with, and the web app's
 * `/ideas/[roomType]` routes.
 *
 * The literals are declared once and everything else is derived from them,
 * so a new room type cannot be half-added.
 */
import { v } from "convex/values";

const ROOM_TYPE_LITERALS = [
  v.literal("living-room"),
  v.literal("bedroom"),
  v.literal("kitchen"),
  v.literal("bathroom"),
  v.literal("dining-room"),
  v.literal("home-office"),
  v.literal("family-room"),
  v.literal("nursery"),
  v.literal("outdoor"),
] as const;

const ROOM_STYLE_LITERALS = [
  v.literal("modern"),
  v.literal("minimalist"),
  v.literal("scandinavian"),
  v.literal("industrial"),
  v.literal("bohemian"),
  v.literal("coastal"),
  v.literal("traditional"),
  v.literal("contemporary"),
  v.literal("mid-century"),
  v.literal("farmhouse"),
  v.literal("japandi"),
  v.literal("eclectic"),
] as const;

/** The kind of room in the photo, used for `/ideas/[roomType]`. */
export const vRoomType = v.union(...ROOM_TYPE_LITERALS);
export type RoomType = (typeof ROOM_TYPE_LITERALS)[number]["value"];
export const ROOM_TYPES = ROOM_TYPE_LITERALS.map((literal) => literal.value);

/** The dominant decor style in the photo. */
export const vRoomStyle = v.union(...ROOM_STYLE_LITERALS);
export type RoomStyle = (typeof ROOM_STYLE_LITERALS)[number]["value"];
export const ROOM_STYLES = ROOM_STYLE_LITERALS.map((literal) => literal.value);
