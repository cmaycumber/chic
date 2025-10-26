/**
 * Update Design Tool
 *
 * Pure database operation for updating existing designs.
 * Focused on modifying design data without side effects.
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
 * Updates an existing design in the database
 */
// biome-ignore lint/style/useNamingConvention: OpenAI tool names use snake_case
export const update_design = createTool({
  description:
    "Update an existing design in the database. Use this to modify design details, replace products, update images, or change budget. Only updates fields that are provided.",
  args: z.object({
    designId: z
      .string()
      .describe("The ID of the design to update (from existing designs)"),
    title: z.string().optional().describe("New title for the design"),
    description: z
      .string()
      .optional()
      .describe("Updated description or additional notes"),
    designPlan: z
      .string()
      .optional()
      .describe("Updated design plan with new details"),
    budget: z
      .number()
      .optional()
      .describe("Updated budget for the design in dollars"),
    products: z
      .array(productSchema)
      .optional()
      .describe("Products array - completely replaces existing products"),
    imageStorageId: z
      .string()
      .optional()
      .describe(
        "Storage ID of a new design image (from generate_design_image)"
      ),
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
      .describe("Updated room type"),
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
      .describe("Updated design style"),
    tags: z
      .array(z.string())
      .optional()
      .describe("Updated tags describing the design"),
  }),
  handler: async (ctx: ToolCtx, args): Promise<Doc<"designs"> | null> => {
    // Get the existing design
    const existingDesign = await ctx.runQuery(internal.designs.read, {
      id: args.designId as Id<"designs">,
    });

    if (!existingDesign) {
      throw new Error(`Design with ID ${args.designId} not found`);
    }

    // Build patch object with only provided fields
    const patch: {
      title?: string;
      description?: string;
      imageStorageId?: Id<"_storage">;
      products?: {
        name: string;
        price: number;
        imageUrl: string;
        productUrl?: string;
        description?: string;
      }[];
      budget?: number;
      designPlan?: string;
      roomType?:
        | "living-room"
        | "bedroom"
        | "kitchen"
        | "bathroom"
        | "dining-room"
        | "home-office"
        | "family-room"
        | "nursery"
        | "outdoor";
      designStyle?:
        | "modern"
        | "minimalist"
        | "scandinavian"
        | "industrial"
        | "bohemian"
        | "coastal"
        | "traditional"
        | "contemporary";
      tags?: string[];
    } = {};

    if (args.title !== undefined) {
      patch.title = args.title;
    }
    if (args.description !== undefined) {
      patch.description = args.description;
    }
    if (args.imageStorageId !== undefined) {
      patch.imageStorageId = args.imageStorageId as Id<"_storage">;
    }
    if (args.products !== undefined) {
      patch.products = args.products;
    }
    if (args.budget !== undefined) {
      patch.budget = args.budget;
    }
    if (args.designPlan !== undefined) {
      patch.designPlan = args.designPlan;
    }
    if (args.roomType !== undefined) {
      patch.roomType = args.roomType;
    }
    if (args.designStyle !== undefined) {
      patch.designStyle = args.designStyle;
    }
    if (args.tags !== undefined) {
      patch.tags = args.tags;
    }

    // Update the design
    const updatedDesign: Doc<"designs"> | null = await ctx.runMutation(
      internal.designs.update,
      {
        id: args.designId as Id<"designs">,
        patch,
      }
    );

    return updatedDesign;
  },
});
