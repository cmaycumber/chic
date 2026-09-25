import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
// The gallery's room types and styles live in ./lib/roomTaxonomy, which the
// web app imports too. They are not re-exported from here: one import path
// for the whole vocabulary.
import { vRoomStyle, vRoomType } from "./lib/roomTaxonomy";

const design = v.object({
  // For now we only have one type of artifact, but we could add more later.
  designId: v.id("designs"),
  type: v.literal("design"),
});

const likedDesign = v.object({
  designId: v.id("designs"),
  type: v.literal("design"),
});

/** A shoppable product found on Amazon for a detected item. */
export const vProduct = v.object({
  imageUrl: v.string(),
  name: v.string(),
  price: v.number(),
  productUrl: v.string(),
  rating: v.optional(v.number()),
  reviewCount: v.optional(v.number()),
});

/** Normalized (0..1) bounding box relative to the image. */
export const vBox = v.object({
  height: v.number(),
  width: v.number(),
  x: v.number(),
  y: v.number(),
});

/** A piece of furniture / decor detected in a room image. */
export const vRoomItem = v.object({
  box: vBox,
  description: v.string(),
  id: v.string(),
  label: v.string(),
  products: v.optional(v.array(vProduct)),
  productsStatus: v.optional(
    v.union(v.literal("pending"), v.literal("ready"), v.literal("error"))
  ),
  searchQuery: v.string(),
});

export const vRoomStatus = v.union(
  v.literal("ready"),
  v.literal("generating"),
  v.literal("error")
);

export const vItemsStatus = v.union(
  v.literal("pending"),
  v.literal("ready"),
  v.literal("error")
);

export const vCommentStatus = v.union(
  v.literal("pending"),
  v.literal("applied"),
  v.literal("failed")
);

export const vAnchor = v.object({ x: v.number(), y: v.number() });

/**
 * What a comment turned out to be: furniture to buy and place, or a change
 * with nothing to buy (paint, light, mood) that goes straight to the renderer.
 */
export const vCommentKind = v.union(
  v.literal("products"),
  v.literal("freeform")
);

/** Where a comment is on its way to a render, for the progress text. */
export const vCommentStage = v.union(
  v.literal("planning"),
  v.literal("searching"),
  v.literal("rendering"),
  v.literal("detecting")
);

/**
 * One piece of furniture a comment asks for: swap out something already in
 * the photo (`itemId` on the version the comment was left on) or add
 * something new. `product` is the listing picked for it, once there is one.
 */
export const vPlanSlot = v.object({
  action: v.union(v.literal("replace"), v.literal("add")),
  itemId: v.optional(v.string()),
  label: v.string(),
  product: v.optional(vProduct),
  searchQuery: v.string(),
});

export const vCommentPlan = v.object({ slots: v.array(vPlanSlot) });

export default defineSchema({
  artifacts: defineTable({
    // Do we want to make this a union of different artifact types?
    artifact: v.union(design),
    threadId: v.string(),
  }).index("by_threadId", ["threadId"]),
  designs: defineTable({
    budget: v.optional(v.number()),
    description: v.string(),
    designPlan: v.optional(v.string()),
    // Style categorization
    designStyle: v.optional(
      v.union(
        v.literal("modern"),
        v.literal("minimalist"),
        v.literal("scandinavian"),
        v.literal("industrial"),
        v.literal("bohemian"),
        v.literal("coastal"),
        v.literal("traditional"),
        v.literal("contemporary")
      )
    ),
    // Curation & engagement
    featured: v.optional(v.boolean()),
    imageStorageId: v.optional(v.id("_storage")),
    isPublic: v.optional(v.boolean()),
    // Deprecated: managed by aggregate component
    likes: v.optional(v.number()),

    likesCount: v.optional(v.number()), // Managed by aggregate component
    pinterestPinId: v.optional(v.string()),
    products: v.optional(
      v.array(
        v.object({
          description: v.optional(v.string()),
          imageUrl: v.string(),
          name: v.string(),
          price: v.number(),
          productUrl: v.optional(v.string()),
        })
      )
    ),
    // Room categorization
    roomType: v.optional(
      v.union(
        v.literal("living-room"),
        v.literal("bedroom"),
        v.literal("kitchen"),
        v.literal("bathroom"),
        v.literal("dining-room"),
        v.literal("home-office"),
        v.literal("family-room"),
        v.literal("nursery"),
        v.literal("outdoor")
      )
    ),
    tags: v.optional(v.array(v.string())),
    title: v.string(),
    userId: v.optional(v.string()),
    views: v.optional(v.number()),
  })
    .index("by_public", ["isPublic"])
    .index("by_room_type", ["roomType", "isPublic"])
    .index("by_style", ["designStyle", "isPublic"])
    .index("by_featured", ["featured", "isPublic"])
    .index("by_user", ["userId"]),

  likes: defineTable({
    // Union of different types that can be liked
    likedItem: v.union(likedDesign),
    userId: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_design", ["userId", "likedItem.designId"]),

  /**
   * Amazon results keyed by the search that found them, shared across every
   * room. Two people who upload a similar sofa ask the same question, and the
   * search behind the answer is the dominant cost of a session: paying for it
   * once a fortnight rather than once a click is most of the bill.
   */
  productSearches: defineTable({
    fetchedAt: v.number(),
    products: v.array(vProduct),
    /** Normalized: trimmed, lower-cased, inner whitespace collapsed. */
    query: v.string(),
  })
    .index("by_query", ["query"])
    // Pruning reads by age, and age is not where the table is written.
    .index("by_fetchedAt", ["fetchedAt"]),

  /** A user comment on a room requesting a change. */
  roomComments: defineTable({
    /** Optional normalized (0..1) point on the image the comment refers to. */
    anchor: v.optional(vAnchor),
    /**
     * Who asked, resolved when the comment was written. Denormalized because
     * a room is read far more often than it gains a collaborator, and the
     * name is only ever shown next to the words that person wrote.
     */
    authorName: v.optional(v.string()),
    /** The version that was displayed when the comment was made. */
    baseVersionId: v.id("roomVersions"),
    error: v.optional(v.string()),
    /** Set once the planner has read the comment. */
    kind: v.optional(vCommentKind),
    /** The furniture a product comment is buying, and what was picked. */
    plan: v.optional(vCommentPlan),
    /**
     * Set when the comment is a product the user picked rather than words they
     * typed: the edit puts this exact item into the photo.
     */
    product: v.optional(vProduct),
    resultVersionId: v.optional(v.id("roomVersions")),
    roomId: v.id("rooms"),
    /** Progress while pending; cleared once the comment is applied or fails. */
    stage: v.optional(vCommentStage),
    status: vCommentStatus,
    text: v.string(),
    userId: v.string(),
  }).index("by_room", ["roomId"]),

  /**
   * Who may edit a room besides its owner. A row per person rather than an
   * array on the room, because Convex cannot index array membership and the
   * rooms list has to find "rooms shared with me" by user id.
   */
  roomMembers: defineTable({
    roomId: v.id("rooms"),
    userId: v.string(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_user", ["roomId", "userId"])
    .index("by_user", ["userId"]),

  /**
   * A room is an uploaded photo the user iterates on by leaving comments.
   * Every applied comment produces a new roomVersion.
   */
  rooms: defineTable({
    currentVersionId: v.optional(v.id("roomVersions")),
    error: v.optional(v.string()),
    /**
     * When an anonymous owner's room is deleted. Cleared the moment they sign
     * up; never set for a room made by someone with an account.
     */
    expiresAt: v.optional(v.number()),
    /** The secret in an invite link. Absent once the owner revokes it. */
    inviteToken: v.optional(v.string()),
    /**
     * Opted in to the public gallery at `/ideas`. Only meaningful while the
     * room is public: sharing is what makes it readable, listing is what puts
     * it in front of people who were not sent the link.
     */
    isListed: v.optional(v.boolean()),
    /** Shared by link: anyone with the room id can read it through `getPublic`. */
    isPublic: v.optional(v.boolean()),
    /** When the room entered the gallery; the gallery's sort order. */
    listedAt: v.optional(v.number()),
    originalImageStorageId: v.id("_storage"),
    /** What kind of room the photo shows, tagged by the detection model. */
    roomType: v.optional(vRoomType),
    status: vRoomStatus,
    /** The dominant decor style, tagged by the detection model. */
    style: v.optional(vRoomStyle),
    title: v.optional(v.string()),
    userId: v.string(),
  })
    .index("by_expiresAt", ["expiresAt"])
    .index("by_inviteToken", ["inviteToken"])
    .index("by_listed", ["isListed", "listedAt"])
    .index("by_listed_type", ["isListed", "roomType", "listedAt"])
    .index("by_user", ["userId"]),

  /** One rendered image of a room (the original upload is version 0). */
  roomVersions: defineTable({
    /** The comment that produced this version; undefined for the original. */
    commentId: v.optional(v.id("roomComments")),
    imageStorageId: v.id("_storage"),
    items: v.optional(v.array(vRoomItem)),
    itemsStatus: vItemsStatus,
    roomId: v.id("rooms"),
    /** Short description of what changed. */
    summary: v.optional(v.string()),
  }).index("by_room", ["roomId"]),
});
