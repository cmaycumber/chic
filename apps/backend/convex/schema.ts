import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const design = v.object({
  type: v.literal("design"),
  // For now we only have one type of artifact, but we could add more later.
  designId: v.id("designs"),
});

export default defineSchema({
  designs: defineTable({
    title: v.string(),
    description: v.string(),
  }),

  artifacts: defineTable({
    threadId: v.string(),
    // Do we want to make this a union of different artifact types?
    artifact: v.union(design),
  }).index("by_threadId", ["threadId"]),
});
