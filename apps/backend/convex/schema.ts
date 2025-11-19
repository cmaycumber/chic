import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const design = v.object({
  type: v.literal("design"),
  // For now we only have one type of artifact, but we could add more later.
  designId: v.id("designs"),
});

const likedDesign = v.object({
  type: v.literal("design"),
  designId: v.id("designs"),
});

export default defineSchema({
  designs: defineTable({
    title: v.string(),
    description: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    products: v.optional(
      v.array(
        v.object({
          name: v.string(),
          price: v.number(),
          imageUrl: v.string(),
          productUrl: v.optional(v.string()),
          description: v.optional(v.string()),
        })
      )
    ),
    budget: v.optional(v.number()),
    designPlan: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    userId: v.optional(v.string()),
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
    // Deprecated: managed by aggregate component
    likes: v.optional(v.number()),

    likesCount: v.optional(v.number()), // Managed by aggregate component
    views: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    pinterestPinId: v.optional(v.string()),
  })
    .index("by_public", ["isPublic"])
    .index("by_room_type", ["roomType", "isPublic"])
    .index("by_style", ["designStyle", "isPublic"])
    .index("by_featured", ["featured", "isPublic"])
    .index("by_user", ["userId"]),

  artifacts: defineTable({
    threadId: v.string(),
    // Do we want to make this a union of different artifact types?
    artifact: v.union(design),
  }).index("by_threadId", ["threadId"]),

  likes: defineTable({
    userId: v.string(),
    // Union of different types that can be liked
    likedItem: v.union(likedDesign),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_design", ["userId", "likedItem.designId"]),
});
