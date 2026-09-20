import type { api } from "@furnish/backend/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

/** The shared, id-free view of a room returned by `api.rooms.getPublic`. */
export type PublicRoom = NonNullable<
  FunctionReturnType<typeof api.rooms.getPublic>
>;
export type PublicVersion = PublicRoom["versions"][number];
export type PublicComment = PublicRoom["comments"][number];
export type PublicItem = PublicVersion["items"][number];
export type PublicProduct = NonNullable<PublicItem["products"]>[number];

/** The real Amazon piece an "Add to room" comment put into the photo. */
export type PublicCommentProduct = NonNullable<PublicComment["product"]>;
