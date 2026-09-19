/**
 * Room Ideas Queries
 *
 * Queries for fetching, filtering, and displaying curated room design ideas
 */
import { v } from "convex/values";
import { publicQuery } from "./lib/utils";

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
});

/**
 * Get featured designs for a specific room type
 * These are admin-curated designs shown at the top of ideas pages
 */
export const getFeaturedRoomDesigns = publicQuery({
  args: {
    limit: v.optional(v.number()),
    roomType: roomTypeValidator,
  },
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
          _creationTime: design._creationTime,
          _id: design._id,
          budget: design.budget,
          description: design.description,
          designStyle: design.designStyle,
          featured: design.featured,
          imageUrl,
          likesCount: design.likesCount,
          roomType: design.roomType,
          tags: design.tags,
          title: design.title,
          views: design.views,
        };
      })
    );

    return designsWithImages;
  },
  returns: v.array(designWithImageValidator),
});

/**
 * Get all public designs for a room with optional filtering
 */
export const getRoomIdeas = publicQuery({
  args: {
    limit: v.optional(v.number()),
    roomType: roomTypeValidator,
    style: v.optional(designStyleValidator),
    tags: v.optional(v.array(v.string())),
  },
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
          _creationTime: design._creationTime,
          _id: design._id,
          budget: design.budget,
          description: design.description,
          designStyle: design.designStyle,
          featured: design.featured,
          imageUrl,
          likesCount: design.likesCount,
          roomType: design.roomType,
          tags: design.tags,
          title: design.title,
          views: design.views,
        };
      })
    );

    return designsWithImages;
  },
  returns: v.array(designWithImageValidator),
});

/**
 * Get trending designs across all rooms (for homepage/explore)
 */
export const getTrendingDesigns = publicQuery({
  args: {
    limit: v.optional(v.number()),
  },
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
          _creationTime: design._creationTime,
          _id: design._id,
          budget: design.budget,
          description: design.description,
          designStyle: design.designStyle,
          featured: design.featured,
          imageUrl,
          likesCount: design.likesCount,
          roomType: design.roomType,
          tags: design.tags,
          title: design.title,
          views: design.views,
        };
      })
    );

    return designsWithImages;
  },
  returns: v.array(designWithImageValidator),
});

/**
 * Get all public designs across all rooms with optional filtering
 */
export const exploreAllDesigns = publicQuery({
  args: {
    limit: v.optional(v.number()),
    roomType: v.optional(roomTypeValidator),
    style: v.optional(designStyleValidator),
    tags: v.optional(v.array(v.string())),
  },
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
          _creationTime: design._creationTime,
          _id: design._id,
          budget: design.budget,
          description: design.description,
          designStyle: design.designStyle,
          featured: design.featured,
          imageUrl,
          likesCount: design.likesCount,
          roomType: design.roomType,
          tags: design.tags,
          title: design.title,
          views: design.views,
        };
      })
    );

    return designsWithImages;
  },
  returns: v.array(designWithImageValidator),
});

/**
 * Get available filter options across all designs
 * Returns counts of designs by room type, style, and tags
 */
export const getExploreFilterOptions = publicQuery({
  args: {},
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
        .map(([roomType, count]) => ({ count, roomType }))
        .sort((a, b) => b.count - a.count),
      styles: Array.from(styleCounts.entries())
        .map(([style, count]) => ({ count, style }))
        .sort((a, b) => b.count - a.count),
      tags: Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ count, tag }))
        .sort((a, b) => b.count - a.count)
        .slice(0, DEFAULT_TOP_TAGS_LIMIT),
    };
  },
  returns: v.object({
    roomTypes: v.array(
      v.object({
        count: v.number(),
        roomType: v.string(),
      })
    ),
    styles: v.array(
      v.object({
        count: v.number(),
        style: v.string(),
      })
    ),
    tags: v.array(
      v.object({
        count: v.number(),
        tag: v.string(),
      })
    ),
  }),
});

/**
 * Get available filter options for a room type
 * Returns counts of designs by style and tags
 */
export const getRoomFilterOptions = publicQuery({
  args: {
    roomType: roomTypeValidator,
  },
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
        .map(([style, count]) => ({ count, style }))
        .sort((a, b) => b.count - a.count),
      tags: Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ count, tag }))
        .sort((a, b) => b.count - a.count)
        .slice(0, DEFAULT_TOP_TAGS_LIMIT),
    };
  },
  returns: v.object({
    styles: v.array(
      v.object({
        count: v.number(),
        style: v.string(),
      })
    ),
    tags: v.array(
      v.object({
        count: v.number(),
        tag: v.string(),
      })
    ),
  }),
});

/**
 * Get hero designs for homepage
 * Returns the most liked public designs with images
 */
export const getHeroDesigns = publicQuery({
  args: {
    limit: v.optional(v.number()),
  },
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
          _creationTime: design._creationTime,
          _id: design._id,
          budget: design.budget,
          description: design.description,
          designStyle: design.designStyle,
          featured: design.featured,
          imageUrl,
          likesCount: design.likesCount,
          roomType: design.roomType,
          tags: design.tags,
          title: design.title,
          views: design.views,
        };
      })
    );

    return designsWithImages;
  },
  returns: v.array(designWithImageValidator),
});
