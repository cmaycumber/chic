/**
 * Create Design Tool
 *
 * Pure database operation for creating new designs.
 * Focused on storing design data without side effects.
 */
"use node";
import { createTool, type ToolCtx } from "@convex-dev/agent";
import z from "zod";
import { internal } from "../../_generated/api";
import type { Doc, Id } from "../../_generated/dataModel";
import { productSchema } from "./index";

/**
 * Creates a new design in the database
 */
// biome-ignore lint/style/useNamingConvention: OpenAI tool names use snake_case
export const create_design = createTool({
  description:
    "Save a new design to the database. Creates the artifact users can view and reference. Call this early in the design process, then update with products/images later.",
  execute: async (ctx: ToolCtx, args) => {
    // Create the design
    const design: Doc<"designs"> = await ctx.runMutation(
      internal.designs.create,
      {
        budget: args.budget,
        description: args.description,
        designPlan: args.designPlan,
        designStyle: args.designStyle,
        imageStorageId: args.imageStorageId
          ? (args.imageStorageId as Id<"_storage">)
          : undefined,
        isPublic: false,
        likesCount: 0,
        products: args.products,
        roomType: args.roomType,
        tags: args.tags,
        title: args.title,
        views: 0,
      }
    );

    // Create artifact if in a thread
    if (ctx.threadId) {
      await ctx.runMutation(internal.artifacts.create, {
        artifact: {
          designId: design._id,
          type: "design",
        },
        threadId: ctx.threadId,
      });
    }

    return design;
  },
  inputSchema: z.object({
    budget: z.number().optional().describe("Budget in dollars"),
    description: z
      .string()
      .describe("Design concept overview and key features"),
    designPlan: z
      .string()
      .optional()
      .describe(
        "Detailed plan: color palette, furniture layout, materials, lighting"
      ),
    designStyle: z
      .enum([
        "modern",
        "minimalist",
        "scandinavian",
        "industrial",
        "bohemian",
        "coastal",
        "traditional",
        "contemporary",
      ])
      .optional()
      .describe("Design aesthetic - always set based on style"),
    imageStorageId: z
      .string()
      .optional()
      .describe("storageId from generate_design_image"),
    products: z
      .array(productSchema)
      .optional()
      .describe("Products from search_products to include"),
    roomType: z
      .enum([
        "living-room",
        "bedroom",
        "kitchen",
        "bathroom",
        "dining-room",
        "home-office",
        "family-room",
        "nursery",
        "outdoor",
      ])
      .optional()
      .describe("Room type - always set based on context"),
    tags: z
      .array(z.string())
      .optional()
      .describe("Descriptive tags: cozy, small-space, budget-friendly, etc."),
    title: z.string().describe("Descriptive title for the design"),
  }),
});
