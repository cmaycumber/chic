/**
 * Room Ideas Queries
 *
 * Queries for fetching, filtering, and displaying curated room design ideas
 */
import { v } from "convex/values";
import { query } from "./_generated/server";

// Constants for query limits
const DEFAULT_FEATURED_LIMIT = 20;
const DEFAULT_ROOM_IDEAS_LIMIT = 50;
const DEFAULT_TRENDING_LIMIT = 20;
const DEFAULT_EXPLORE_LIMIT = 100;
const DEFAULT_TOP_TAGS_LIMIT = 20;
const DEFAULT_HERO_DESIGNS_LIMIT = 24;

const roomTypeValidator = v.union(
  v.literal("living-room"),
  v.literal("bedroom"),
  v.literal("kitchen"),
  v.literal("bathroom"),
  v.literal("dining-room"),
  v.literal("home-office"),
  v.literal("family-room"),
  v.literal("nursery"),
  v.literal("outdoor")
);

const designStyleValidator = v.union(
  v.literal("modern"),
  v.literal("minimalist"),
  v.literal("scandinavian"),
  v.literal("industrial"),
  v.literal("bohemian"),
  v.literal("coastal"),
  v.literal("traditional"),
  v.literal("contemporary")
);

const designWithImageValidator = v.object({
  _id: v.id("designs"),
  _creationTime: v.number(),
  title: v.string(),
  description: v.string(),
  imageUrl: v.union(v.string(), v.null()),
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
  likesCount: v.optional(v.number()),
  views: v.optional(v.number()),
  budget: v.optional(v.number()),
  tags: v.optional(v.array(v.string())),
  featured: v.optional(v.boolean()),
});

/**
 * Get featured designs for a specific room type
 * These are admin-curated designs shown at the top of ideas pages
 */
export const getFeaturedRoomDesigns = query({
  args: {
    roomType: roomTypeValidator,
    limit: v.optional(v.number()),
  },
  returns: v.array(designWithImageValidator),
  handler: async (ctx, args) => {
    const designs = await ctx.db
      .query("designs")
      .withIndex("by_room_type", (q) =>
        q.eq("roomType", args.roomType).eq("isPublic", true)
      )
      .filter((q) => q.eq(q.field("featured"), true))
      .order("desc")
      .take(args.limit ?? DEFAULT_FEATURED_LIMIT);

    const designsWithImages = await Promise.all(
      designs.map(async (design) => {
        let imageUrl: string | null = null;
        if (design.imageStorageId) {
          imageUrl = await ctx.storage.getUrl(design.imageStorageId);
        }

        return {
          _id: design._id,
          _creationTime: design._creationTime,
          title: design.title,
          description: design.description,
          imageUrl,
          roomType: design.roomType,
          designStyle: design.designStyle,
          likesCount: design.likesCount,
          views: design.views,
          budget: design.budget,
          tags: design.tags,
          featured: design.featured,
        };
      })
    );

    return designsWithImages;
  },
});

/**
 * Get all public designs for a room with optional filtering
 */
export const getRoomIdeas = query({
  args: {
    roomType: roomTypeValidator,
    style: v.optional(designStyleValidator),
    tags: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  returns: v.array(designWithImageValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? DEFAULT_ROOM_IDEAS_LIMIT;

    // Fetch all public designs for this room type
    const designs = await ctx.db
      .query("designs")
      .withIndex("by_room_type", (q) =>
        q.eq("roomType", args.roomType).eq("isPublic", true)
      )
      .collect();

    // Filter by style if provided
    let filtered = designs;
    if (args.style) {
      filtered = filtered.filter((d) => d.designStyle === args.style);
    }

    // Filter by tags if provided (design must have ALL specified tags)
    if (args.tags && args.tags.length > 0) {
      const requiredTags = args.tags;
      filtered = filtered.filter((d) => {
        if (!d.tags) {
          return false;
        }
        return requiredTags.every((tag) => d.tags?.includes(tag));
      });
    }

    // Only include designs with images
    filtered = filtered.filter((d) => d.imageStorageId);

    // Sort: featured first, then by likes, then by recency
    const sorted = filtered.sort((a, b) => {
      // Featured designs first
      if (a.featured && !b.featured) {
        return -1;
      }
      if (!a.featured && b.featured) {
        return 1;
      }

      // Then by likes
      const aLikes = a.likesCount ?? 0;
      const bLikes = b.likesCount ?? 0;
      if (aLikes !== bLikes) {
        return bLikes - aLikes;
      }

      // Then by recency
      return b._creationTime - a._creationTime;
    });

    // Take limit
    const limited = sorted.slice(0, limit);

    // Get image URLs
    const designsWithImages = await Promise.all(
      limited.map(async (design) => {
        let imageUrl: string | null = null;
        if (design.imageStorageId) {
          imageUrl = await ctx.storage.getUrl(design.imageStorageId);
        }

        return {
          _id: design._id,
          _creationTime: design._creationTime,
          title: design.title,
          description: design.description,
          imageUrl,
          roomType: design.roomType,
          designStyle: design.designStyle,
          likesCount: design.likesCount,
          views: design.views,
          budget: design.budget,
          tags: design.tags,
          featured: design.featured,
        };
      })
    );

    return designsWithImages;
  },
});

/**
 * Get trending designs across all rooms (for homepage/explore)
 */
export const getTrendingDesigns = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(designWithImageValidator),
  handler: async (ctx, args) => {
    const designs = await ctx.db
      .query("designs")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();

    // Only designs with images
    const withImages = designs.filter((d) => d.imageStorageId);

    // Calculate trending score: (likes * 2 + views) / age_in_days
    const likesWeight = 2;
    const minAgeDays = 1;
    const millisecondsPerSecond = 1000;
    const secondsPerMinute = 60;
    const minutesPerHour = 60;
    const hoursPerDay = 24;
    const millisecondsPerDay =
      millisecondsPerSecond * secondsPerMinute * minutesPerHour * hoursPerDay;

    const now = Date.now();
    const trending = withImages
      .map((d) => {
        const ageInDays = (now - d._creationTime) / millisecondsPerDay;
        const score =
          ((d.likesCount ?? 0) * likesWeight + (d.views ?? 0)) /
          Math.max(ageInDays, minAgeDays);
        return { design: d, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, args.limit ?? DEFAULT_TRENDING_LIMIT);

    const designsWithImages = await Promise.all(
      trending.map(async ({ design }) => {
        let imageUrl: string | null = null;
        if (design.imageStorageId) {
          imageUrl = await ctx.storage.getUrl(design.imageStorageId);
        }

        return {
          _id: design._id,
          _creationTime: design._creationTime,
          title: design.title,
          description: design.description,
          imageUrl,
          roomType: design.roomType,
          designStyle: design.designStyle,
          likesCount: design.likesCount,
          views: design.views,
          budget: design.budget,
          tags: design.tags,
          featured: design.featured,
        };
      })
    );

    return designsWithImages;
  },
});

/**
 * Get all public designs across all rooms with optional filtering
 */
export const exploreAllDesigns = query({
  args: {
    roomType: v.optional(roomTypeValidator),
    style: v.optional(designStyleValidator),
    tags: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  returns: v.array(designWithImageValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? DEFAULT_EXPLORE_LIMIT;

    // Fetch all public designs
    const designs = await ctx.db
      .query("designs")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();

    // Filter by room type if provided
    let filtered = designs;
    if (args.roomType) {
      filtered = filtered.filter((d) => d.roomType === args.roomType);
    }

    // Filter by style if provided
    if (args.style) {
      filtered = filtered.filter((d) => d.designStyle === args.style);
    }

    // Filter by tags if provided
    if (args.tags && args.tags.length > 0) {
      const requiredTags = args.tags;
      filtered = filtered.filter((d) => {
        if (!d.tags) {
          return false;
        }
        return requiredTags.every((tag) => d.tags?.includes(tag));
      });
    }

    // Only include designs with images
    filtered = filtered.filter((d) => d.imageStorageId);

    // Sort: featured first, then by likes, then by recency
    const sorted = filtered.sort((a, b) => {
      if (a.featured && !b.featured) {
        return -1;
      }
      if (!a.featured && b.featured) {
        return 1;
      }

      const aLikes = a.likesCount ?? 0;
      const bLikes = b.likesCount ?? 0;
      if (aLikes !== bLikes) {
        return bLikes - aLikes;
      }

      return b._creationTime - a._creationTime;
    });

    // Take limit
    const limited = sorted.slice(0, limit);

    // Get image URLs
    const designsWithImages = await Promise.all(
      limited.map(async (design) => {
        let imageUrl: string | null = null;
        if (design.imageStorageId) {
          imageUrl = await ctx.storage.getUrl(design.imageStorageId);
        }

        return {
          _id: design._id,
          _creationTime: design._creationTime,
          title: design.title,
          description: design.description,
          imageUrl,
          roomType: design.roomType,
          designStyle: design.designStyle,
          likesCount: design.likesCount,
          views: design.views,
          budget: design.budget,
          tags: design.tags,
          featured: design.featured,
        };
      })
    );

    return designsWithImages;
  },
});

/**
 * Get available filter options across all designs
 * Returns counts of designs by room type, style, and tags
 */
export const getExploreFilterOptions = query({
  args: {},
  returns: v.object({
    roomTypes: v.array(
      v.object({
        roomType: v.string(),
        count: v.number(),
      })
    ),
    styles: v.array(
      v.object({
        style: v.string(),
        count: v.number(),
      })
    ),
    tags: v.array(
      v.object({
        tag: v.string(),
        count: v.number(),
      })
    ),
  }),
  handler: async (ctx) => {
    const designs = await ctx.db
      .query("designs")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .filter((q) => q.neq(q.field("imageStorageId"), undefined))
      .collect();

    // Count by room type
    const roomTypeCounts = new Map<string, number>();
    for (const design of designs) {
      if (design.roomType) {
        roomTypeCounts.set(
          design.roomType,
          (roomTypeCounts.get(design.roomType) ?? 0) + 1
        );
      }
    }

    // Count by style
    const styleCounts = new Map<string, number>();
    for (const design of designs) {
      if (design.designStyle) {
        styleCounts.set(
          design.designStyle,
          (styleCounts.get(design.designStyle) ?? 0) + 1
        );
      }
    }

    // Count by tag
    const tagCounts = new Map<string, number>();
    for (const design of designs) {
      if (design.tags) {
        for (const tag of design.tags) {
          tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
        }
      }
    }

    return {
      roomTypes: Array.from(roomTypeCounts.entries())
        .map(([roomType, count]) => ({ roomType, count }))
        .sort((a, b) => b.count - a.count),
      styles: Array.from(styleCounts.entries())
        .map(([style, count]) => ({ style, count }))
        .sort((a, b) => b.count - a.count),
      tags: Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, DEFAULT_TOP_TAGS_LIMIT),
    };
  },
});

/**
 * Get available filter options for a room type
 * Returns counts of designs by style and tags
 */
export const getRoomFilterOptions = query({
  args: {
    roomType: roomTypeValidator,
  },
  returns: v.object({
    styles: v.array(
      v.object({
        style: v.string(),
        count: v.number(),
      })
    ),
    tags: v.array(
      v.object({
        tag: v.string(),
        count: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const designs = await ctx.db
      .query("designs")
      .withIndex("by_room_type", (q) =>
        q.eq("roomType", args.roomType).eq("isPublic", true)
      )
      .filter((q) => q.neq(q.field("imageStorageId"), undefined))
      .collect();

    // Count by style
    const styleCounts = new Map<string, number>();
    for (const design of designs) {
      if (design.designStyle) {
        styleCounts.set(
          design.designStyle,
          (styleCounts.get(design.designStyle) ?? 0) + 1
        );
      }
    }

    // Count by tag
    const tagCounts = new Map<string, number>();
    for (const design of designs) {
      if (design.tags) {
        for (const tag of design.tags) {
          tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
        }
      }
    }

    return {
      styles: Array.from(styleCounts.entries())
        .map(([style, count]) => ({ style, count }))
        .sort((a, b) => b.count - a.count),
      tags: Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, DEFAULT_TOP_TAGS_LIMIT),
    };
  },
});

/**
 * Get hero designs for homepage
 * Returns the most liked public designs with images
 */
export const getHeroDesigns = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(designWithImageValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? DEFAULT_HERO_DESIGNS_LIMIT;

    // Fetch all public designs with images
    const designs = await ctx.db
      .query("designs")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();

    // Filter to only designs with images
    const filtered = designs.filter((d) => d.imageStorageId);

    // Sort by: featured first, then by likes, then by recency
    const sorted = filtered.sort((a, b) => {
      if (a.featured && !b.featured) {
        return -1;
      }
      if (!a.featured && b.featured) {
        return 1;
      }

      const aLikes = a.likesCount ?? 0;
      const bLikes = b.likesCount ?? 0;
      if (aLikes !== bLikes) {
        return bLikes - aLikes;
      }

      return b._creationTime - a._creationTime;
    });

    // Take limit
    const limited = sorted.slice(0, limit);

    // Get image URLs
    const designsWithImages = await Promise.all(
      limited.map(async (design) => {
        let imageUrl: string | null = null;
        if (design.imageStorageId) {
          imageUrl = await ctx.storage.getUrl(design.imageStorageId);
        }

        return {
          _id: design._id,
          _creationTime: design._creationTime,
          title: design.title,
          description: design.description,
          imageUrl,
          roomType: design.roomType,
          designStyle: design.designStyle,
          likesCount: design.likesCount,
          views: design.views,
          budget: design.budget,
          tags: design.tags,
          featured: design.featured,
        };
      })
    );

    return designsWithImages;
  },
});
