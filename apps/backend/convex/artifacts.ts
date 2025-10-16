import { v } from "convex/values";
import { crud } from "convex-helpers/server/crud";
import { query } from "./_generated/server";
import schema from "./schema";

export const { create, read, update, destroy } = crud(schema, "artifacts");

export const listByThreadId = query({
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

export const listByThreadIdWithDetails = query({
  args: { threadId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("artifacts"),
      _creationTime: v.number(),
      threadId: v.string(),
      type: v.literal("design"),
      design: v.object({
        _id: v.string(),
        description: v.string(),
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
        description: string;
      };
    }> = [];

    const designPromises = artifacts.map(async (artifact) => {
      if (artifact.artifact.type === "design") {
        const design = await ctx.db.get(artifact.artifact.designId);
        if (design) {
          return {
            _id: artifact._id,
            _creationTime: artifact._creationTime,
            threadId: artifact.threadId,
            type: "design" as const,
            design: {
              _id: design._id,
              description: design.description,
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
