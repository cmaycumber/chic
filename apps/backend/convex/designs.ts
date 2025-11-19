import { v } from "convex/values";
import { crud } from "convex-helpers/server/crud";
import { privateMutation, privateQuery, publicQuery } from "./lib/utils";
import schema from "./schema";

export const { create, read, update, destroy } = crud(schema, "designs");

/**
 * Toggle the public/private status of a design
 */
export const togglePublic = privateMutation({
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
export const getWithImage = privateQuery({
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
export const getPublicDesign = publicQuery({
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
      roomType: design.roomType,
      designStyle: design.designStyle,
    };
  },
});
