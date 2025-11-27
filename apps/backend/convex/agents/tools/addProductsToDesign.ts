/**
 * Add Products to Design Tool
 *
 * Adds new products to an existing design without replacing the existing ones.
 * Useful for incrementally building up a design's product list.
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
 * Adds products to an existing design
 */
// biome-ignore lint/style/useNamingConvention: OpenAI tool names use snake_case
export const add_products_to_design = createTool({
  description:
    "Append products to a design without replacing existing ones. Use for expanding product lists incrementally.",
  args: z.object({
    designId: z.string().describe("Design ID from existing designs"),
    products: z
      .array(productSchema)
      .describe("Products to add from search_products"),
  }),
  handler: async (ctx: ToolCtx, args): Promise<Doc<"designs"> | null> => {
    // Get the existing design
    const existingDesign = await ctx.runQuery(internal.designs.read, {
      id: args.designId as Id<"designs">,
    });

    if (!existingDesign) {
      throw new Error(`Design with ID ${args.designId} not found`);
    }

    // Combine existing products with new products
    const existingProducts = existingDesign.products || [];
    const allProducts = [...existingProducts, ...args.products];

    // Update the design with combined products
    const updatedDesign: Doc<"designs"> | null = await ctx.runMutation(
      internal.designs.update,
      {
        id: args.designId as Id<"designs">,
        patch: {
          products: allProducts,
        },
      }
    );

    return updatedDesign;
  },
});
