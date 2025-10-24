import { v } from "convex/values";
import { crud } from "convex-helpers/server/crud";
import { mutation, query } from "./_generated/server";
import schema from "./schema";

export const { create, read, update, destroy } = crud(schema, "designs");

/**
 * Toggle the public/private status of a design
 */
export const togglePublic = mutation({
  args: { designId: v.id("designs") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const design = await ctx.db.get(args.designId);
    if (!design) {
      throw new Error("Design not found");
    }

    const newIsPublic = !design.isPublic;
    await ctx.db.patch(args.designId, { isPublic: newIsPublic });
    return newIsPublic;
  },
});

/**
 * Get a design with its image URL
 */
export const getWithImage = query({
  args: { designId: v.id("designs") },
  returns: v.union(
    v.object({
      _id: v.id("designs"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      imageUrl: v.union(v.string(), v.null()),
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
      isPublic: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const design = await ctx.db.get(args.designId);
    if (!design) {
      return null;
    }

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
      products: design.products,
      budget: design.budget,
      designPlan: design.designPlan,
      isPublic: design.isPublic ?? false,
    };
  },
});

/**
 * Get a public design with its image URL (for sharing)
 * Returns null if design doesn't exist or is not public
 */
export const getPublicDesign = query({
  args: { designId: v.id("designs") },
  returns: v.union(
    v.object({
      _id: v.id("designs"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      imageUrl: v.union(v.string(), v.null()),
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
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const design = await ctx.db.get(args.designId);
    if (!design?.isPublic) {
      return null;
    }

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
      products: design.products,
      budget: design.budget,
      designPlan: design.designPlan,
    };
  },
});
