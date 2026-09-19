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
  handler: async (ctx, args) => {
    const design = await ctx.db.get(args.designId);
    if (!design) {
      throw new Error("Design not found");
    }

    const newIsPublic = !design.isPublic;
    await ctx.db.patch(args.designId, { isPublic: newIsPublic });
    return newIsPublic;
  },
  returns: v.boolean(),
});

/**
 * Get a design with its image URL
 */
export const getWithImage = privateQuery({
  args: { designId: v.id("designs") },
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
      _creationTime: design._creationTime,
      _id: design._id,
      budget: design.budget,
      description: design.description,
      designPlan: design.designPlan,
      imageUrl,
      isPublic: design.isPublic ?? false,
      products: design.products,
      title: design.title,
    };
  },
  returns: v.union(
    v.object({
      _creationTime: v.number(),
      _id: v.id("designs"),
      budget: v.optional(v.number()),
      description: v.string(),
      designPlan: v.optional(v.string()),
      imageUrl: v.union(v.string(), v.null()),
      isPublic: v.boolean(),
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
      title: v.string(),
    }),
    v.null()
  ),
});

/**
 * Get a public design with its image URL (for sharing)
 * Returns null if design doesn't exist or is not public
 */
export const getPublicDesign = publicQuery({
  args: { designId: v.id("designs") },
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
      _creationTime: design._creationTime,
      _id: design._id,
      budget: design.budget,
      description: design.description,
      designPlan: design.designPlan,
      designStyle: design.designStyle,
      imageUrl,
      products: design.products,
      roomType: design.roomType,
      title: design.title,
    };
  },
  returns: v.union(
    v.object({
      _creationTime: v.number(),
      _id: v.id("designs"),
      budget: v.optional(v.number()),
      description: v.string(),
      designPlan: v.optional(v.string()),
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
      imageUrl: v.union(v.string(), v.null()),
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
      title: v.string(),
    }),
    v.null()
  ),
});
