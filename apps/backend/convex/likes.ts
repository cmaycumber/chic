/**
 * Likes Management
 *
 * Mutations and queries for handling user likes on designs with aggregate count tracking
 */
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { likesCountAggregate } from "./aggregate.config";
import { privateMutation, privateQuery, publicQuery } from "./lib/utils";
import { getAuthUserId } from "./utils";

/**
 * Toggle like on a design
 * If already liked, remove the like. If not liked, add a like.
 * The aggregate component maintains an efficient count of likes per design.
 */
export const toggleDesignLike = privateMutation({
  args: {
    designId: v.id("designs"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if design exists
    const design = await ctx.db.get(args.designId);
    if (!design) {
      throw new Error("Design not found");
    }

    // Check if user has already liked this design
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("likedItem.designId"), args.designId))
      .first();

    let newCount: number;

    if (existingLike) {
      // Unlike: remove the like from database
      await ctx.db.delete(existingLike._id);

      // Remove from aggregate (use _delete for the internal API)
      // Signature: _delete(ctx, namespace, key, value)
      await likesCountAggregate._delete(ctx, undefined, args.designId, "");

      // Get the new count from the aggregate
      newCount = await likesCountAggregate.count(ctx, {
        bounds: {
          lower: { inclusive: true, key: args.designId },
          upper: { inclusive: true, key: args.designId },
        },
      });

      // Update the denormalized count in the design document
      await ctx.db.patch(args.designId, { likesCount: newCount });

      return { liked: false, likesCount: newCount };
    }

    // Like: add the like to database
    await ctx.db.insert("likes", {
      likedItem: {
        designId: args.designId,
        type: "design" as const,
      },
      userId,
    });

    // Add to aggregate (key = designId, value = "" since we only count)
    // Signature: _insert(ctx, namespace, key, value)
    await likesCountAggregate._insert(ctx, undefined, args.designId, "");

    // Get the new count from the aggregate
    newCount = await likesCountAggregate.count(ctx, {
      bounds: {
        lower: { inclusive: true, key: args.designId },
        upper: { inclusive: true, key: args.designId },
      },
    });

    // Update the denormalized count in the design document
    await ctx.db.patch(args.designId, { likesCount: newCount });

    return { liked: true, likesCount: newCount };
  },
  returns: v.object({
    liked: v.boolean(),
    likesCount: v.number(),
  }),
});

/**
 * Get the likes count for a specific design using the aggregate
 * This is efficient O(log(n)) instead of counting all likes
 */
export const getDesignLikesCount = publicQuery({
  args: {
    designId: v.id("designs"),
  },
  handler: async (ctx, args) => {
    const count: number = await likesCountAggregate.count(ctx, {
      bounds: {
        lower: { inclusive: true, key: args.designId },
        upper: { inclusive: true, key: args.designId },
      },
    });
    return count;
  },
  returns: v.number(),
});

/**
 * Get likes counts for multiple designs efficiently
 * Uses batch counting from the aggregate component
 */
export const getDesignLikesCountBatch = publicQuery({
  args: {
    designIds: v.array(v.id("designs")),
  },
  handler: async (ctx, args) => {
    const counts: Record<string, number> = {};

    // Use countBatch for efficient parallel counting
    const countPromises: Promise<number>[] = args.designIds.map((designId) =>
      likesCountAggregate.count(ctx, {
        bounds: {
          lower: { inclusive: true, key: designId },
          upper: { inclusive: true, key: designId },
        },
      })
    );

    const results: number[] = await Promise.all(countPromises);

    for (let i = 0; i < args.designIds.length; i += 1) {
      counts[args.designIds[i]] = results[i];
    }

    return counts;
  },
  returns: v.record(v.id("designs"), v.number()),
});

/**
 * Check if user has liked a specific design
 */
export const isDesignLiked = privateQuery({
  args: {
    designId: v.id("designs"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }

    const like = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("likedItem.designId"), args.designId))
      .first();

    return like !== null;
  },
  returns: v.boolean(),
});

/**
 * Initialize/sync the aggregate with existing likes data
 * This should be run once after setting up the aggregate component
 * or if the aggregate gets out of sync with the database
 *
 * @internal This is an internal function for maintenance
 */
export const syncLikesAggregate = privateMutation({
  args: {},
  handler: async (ctx) => {
    // Get all likes from the database
    const allLikes = await ctx.db.query("likes").collect();

    let processed = 0;
    let synced = 0;

    // Count likes per design
    const likesPerDesign: Record<string, number> = {};

    for (const like of allLikes) {
      if (like.likedItem.type === "design") {
        const designId: string = like.likedItem.designId;
        likesPerDesign[designId] = (likesPerDesign[designId] ?? 0) + 1;
        processed += 1;
      }
    }

    // Clear and rebuild the aggregate
    // Note: This should ideally use aggregate.clear() but we'll rebuild incrementally

    // Update each design with its like count and sync to aggregate
    for (const [designId, count] of Object.entries(likesPerDesign)) {
      // Insert each like into the aggregate
      for (let i = 0; i < count; i += 1) {
        // biome-ignore lint/performance/noAwaitInLoops: inserts for the same key must happen sequentially to keep the aggregate's internal ordering consistent
        await likesCountAggregate._insert(ctx, undefined, designId, "");
      }

      // Update the denormalized count in the design document
      await ctx.db.patch(designId as Id<"designs">, { likesCount: count });
      synced += 1;
    }

    return { processed, synced };
  },
  returns: v.object({
    processed: v.number(),
    synced: v.number(),
  }),
});

/**
 * Get all designs liked by the current user
 */
export const getUserLikedDesigns = privateQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get all likes for this user
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // Fetch the design details for each liked design
    const designsWithImages = await Promise.all(
      likes
        .filter((like) => like.likedItem.type === "design")
        .map(async (like) => {
          const design = await ctx.db.get(like.likedItem.designId);
          if (!design) {
            return null;
          }

          let imageUrl: string | null = null;
          if (design.imageStorageId) {
            imageUrl = await ctx.storage.getUrl(design.imageStorageId);
          }

          return {
            _creationTime: design._creationTime,
            _id: design._id,
            budget: design.budget,
            description: design.description,
            designStyle: design.designStyle,
            featured: design.featured,
            imageUrl,
            likedAt: like._creationTime,
            likesCount: design.likesCount,
            roomType: design.roomType,
            tags: design.tags,
            title: design.title,
            views: design.views,
          };
        })
    );

    // Filter out any null designs (in case a design was deleted)
    const filtered = designsWithImages.filter((design) => design !== null);
    return filtered;
  },
  returns: v.array(
    v.object({
      _creationTime: v.number(),
      _id: v.id("designs"),
      budget: v.optional(v.number()),
      description: v.string(),
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
      featured: v.optional(v.boolean()),
      imageUrl: v.union(v.string(), v.null()),
      likedAt: v.number(),
      likesCount: v.optional(v.number()),
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
      views: v.optional(v.number()),
    })
  ),
});
