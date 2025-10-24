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

const productSchema = z.object({
  name: z.string().describe("Product name"),
  price: z.number().describe("Product price in dollars"),
  imageUrl: z.string().describe("URL to product image"),
  productUrl: z.string().optional().describe("URL to product page"),
  description: z.string().optional().describe("Product description"),
});

/**
 * Creates a new design in the database
 */
// biome-ignore lint/style/useNamingConvention: OpenAI tool names use snake_case
export const create_design = createTool({
  description:
    "Create a new interior design in the database. Use this to store design concepts with their details. Call other tools first (search_products, generate_design_image) if you need products or images, then pass the results here.",
  args: z.object({
    title: z.string().describe("The title of the design"),
    description: z
      .string()
      .describe("Detailed description of the design concept and vision"),
    designPlan: z
      .string()
      .optional()
      .describe(
        "Detailed design plan including style, colors, layout, and specific items"
      ),
    budget: z
      .number()
      .optional()
      .describe("The user's budget for the design in dollars"),
    products: z
      .array(productSchema)
      .optional()
      .describe("Array of products to include in the design"),
    imageStorageId: z
      .string()
      .optional()
      .describe(
        "Storage ID of the design image (from generate_design_image or user upload)"
      ),
    roomType: z
      .string()
      .optional()
      .describe("Type of room (e.g., living room, bedroom, kitchen)"),
    style: z
      .string()
      .optional()
      .describe("Design style (e.g., modern, minimalist, bohemian)"),
  }),
  handler: async (ctx: ToolCtx, args) => {
    // Create the design
    const design: Doc<"designs"> = await ctx.runMutation(
      internal.designs.create,
      {
        title: args.title,
        description: args.description,
        imageStorageId: args.imageStorageId
          ? (args.imageStorageId as Id<"_storage">)
          : undefined,
        products: args.products,
        budget: args.budget,
        designPlan: args.designPlan,
        isPublic: false,
      }
    );

    // Create artifact if in a thread
    if (ctx.threadId) {
      await ctx.runMutation(internal.artifacts.create, {
        threadId: ctx.threadId,
        artifact: {
          type: "design",
          designId: design._id,
        },
      });
    }

    return design;
  },
});
