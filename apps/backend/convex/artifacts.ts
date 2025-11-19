import { v } from "convex/values";
import { crud } from "convex-helpers/server/crud";
import { privateQuery } from "./lib/utils";
import schema from "./schema";

export const { create, read, update, destroy } = crud(schema, "artifacts");

export const listByThreadId = privateQuery({
  args: { threadId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("artifacts"),
      _creationTime: v.number(),
      threadId: v.string(),
      artifact: v.union(
        v.object({
          type: v.literal("design"),
          designId: v.id("designs"),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const artifacts = await ctx.db
      .query("artifacts")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .collect();
    return artifacts;
  },
});

export const listByThreadIdWithDetails = privateQuery({
  args: { threadId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("artifacts"),
      _creationTime: v.number(),
      threadId: v.string(),
      type: v.literal("design"),
      design: v.object({
        _id: v.string(),
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
    })
  ),
  handler: async (ctx, args) => {
    const artifacts = await ctx.db
      .query("artifacts")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .collect();

    const result: Array<{
      _id: (typeof artifacts)[number]["_id"];
      _creationTime: number;
      threadId: string;
      type: "design";
      design: {
        _id: string;
        title: string;
        description: string;
        imageUrl: string | null;
        products?: Array<{
          name: string;
          price: number;
          imageUrl: string;
          productUrl?: string;
          description?: string;
        }>;
        budget?: number;
        designPlan?: string;
        isPublic: boolean;
      };
    }> = [];

    const designPromises = artifacts.map(async (artifact) => {
      if (artifact.artifact.type === "design") {
        const design = await ctx.db.get(artifact.artifact.designId);
        if (design) {
          let imageUrl: string | null = null;
          if (design.imageStorageId) {
            imageUrl = await ctx.storage.getUrl(design.imageStorageId);
          }

          return {
            _id: artifact._id,
            _creationTime: artifact._creationTime,
            threadId: artifact.threadId,
            type: "design" as const,
            design: {
              _id: design._id,
              title: design.title,
              description: design.description,
              imageUrl,
              products: design.products,
              budget: design.budget,
              designPlan: design.designPlan,
              isPublic: design.isPublic ?? false,
            },
          };
        }
      }
      return null;
    });

    const resolvedDesigns = await Promise.all(designPromises);

    for (const design of resolvedDesigns) {
      if (design) {
        result.push(design);
      }
    }

    return result;
  },
});
