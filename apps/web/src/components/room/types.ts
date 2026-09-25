import type { api } from "@furnish/backend/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

/** Everything the room screen renders comes from `api.rooms.get`. */
export type RoomData = NonNullable<FunctionReturnType<typeof api.rooms.get>>;
export type Room = RoomData["room"];
export type RoomVersion = RoomData["versions"][number];
export type RoomComment = RoomData["comments"][number];
export type RoomItem = RoomVersion["items"][number];
export type RoomProduct = NonNullable<RoomItem["products"]>[number];

/** The real Amazon piece an "Add to room" comment put into the photo. */
export type CommentProduct = NonNullable<RoomComment["product"]>;

/** Where an in-flight product comment is in the plan → search → render pipeline. */
export type CommentStage = NonNullable<RoomComment["stage"]>;

/** What a product comment planned: one slot per item to replace or add. */
export type CommentPlan = NonNullable<RoomComment["plan"]>;
export type CommentPlanSlot = CommentPlan["slots"][number];

/** A real product the plan has already picked for a slot, before the render lands. */
export type PlanProduct = NonNullable<CommentPlanSlot["product"]>;

/** Someone invited to edit this room. The owner is not in this list. */
export type Collaborator = RoomData["collaborators"][number];

/** Owner or invited editor: what this viewer is allowed to do here. */
export type RoomRole = RoomData["role"];

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
  /** Who asked for this, as one letter. Omitted when nobody else is here. */
  authorInitial: string | null;
  authorIsOwner: boolean;
  authorName: string | undefined;
  commentId: string;
  number: number;
  /** Real products the plan already picked for this comment, `product` excluded. */
  planProducts: PlanProduct[];
  /** Set when the comment asked for a real product rather than a change. */
  product: CommentProduct | null;
  status: RoomComment["status"];
  text: string;
}
