import { v } from "convex/values";
import { crud } from "convex-helpers/server/crud";
import { query } from "./_generated/server";
import schema from "./schema";

export const { create, read, update, destroy } = crud(schema, "designs");

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
    };
  },
});
