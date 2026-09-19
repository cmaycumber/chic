import { v } from "convex/values";
import { crud } from "convex-helpers/server/crud";
import { privateQuery } from "./lib/utils";
import schema from "./schema";

export const { create, read, update, destroy } = crud(schema, "artifacts");

export const listByThreadId = privateQuery({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    const artifacts = await ctx.db
      .query("artifacts")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .collect();
    return artifacts;
  },
  returns: v.array(
    v.object({
      _creationTime: v.number(),
      _id: v.id("artifacts"),
      artifact: v.union(
        v.object({
          designId: v.id("designs"),
          type: v.literal("design"),
        })
      ),
      threadId: v.string(),
    })
  ),
});

export const listByThreadIdWithDetails = privateQuery({
  args: { threadId: v.string() },
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
            _creationTime: artifact._creationTime,
            _id: artifact._id,
            design: {
              _id: design._id,
              budget: design.budget,
              description: design.description,
              designPlan: design.designPlan,
              imageUrl,
              isPublic: design.isPublic ?? false,
              products: design.products,
              title: design.title,
            },
            threadId: artifact.threadId,
            type: "design" as const,
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
  returns: v.array(
    v.object({
      _creationTime: v.number(),
      _id: v.id("artifacts"),
      design: v.object({
        _id: v.string(),
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
      threadId: v.string(),
      type: v.literal("design"),
    })
  ),
});
