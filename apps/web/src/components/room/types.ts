import type { api } from "@furnish/backend/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

/** Everything the room screen renders comes from `api.rooms.get`. */
export type RoomData = NonNullable<FunctionReturnType<typeof api.rooms.get>>;
export type Room = RoomData["room"];
export type RoomVersion = RoomData["versions"][number];
export type RoomComment = RoomData["comments"][number];
export type RoomItem = RoomVersion["items"][number];
export type RoomProduct = NonNullable<RoomItem["products"]>[number];

/** A point on the photo, normalized to 0..1 on both axes. */
export interface Anchor {
  x: number;
  y: number;
}

/** Comment mode edits the photo, shop mode browses the furniture in it. */
export type RoomMode = "comment" | "shop";

/** An anchored comment rendered as a numbered pin on the photo. */
export interface CommentPin {
  anchor: Anchor;
  commentId: string;
  number: number;
  status: RoomComment["status"];
  text: string;
}
