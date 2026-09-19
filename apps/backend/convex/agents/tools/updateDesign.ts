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
import { productSchema } from "./index";

/**
 * Updates an existing design in the database
 */
// biome-ignore lint/style/useNamingConvention: OpenAI tool names use snake_case
export const update_design = createTool({
  description:
    "Modify an existing design. Replaces only the fields you provide. Use add_products_to_design to append products without replacing.",
  execute: async (ctx: ToolCtx, args): Promise<Doc<"designs"> | null> => {
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
  inputSchema: z.object({
    budget: z.number().optional().describe("Updated budget in dollars"),
    description: z.string().optional().describe("Updated description"),
    designId: z.string().describe("Design ID from existing designs context"),
    designPlan: z.string().optional().describe("Updated design plan"),
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
    imageStorageId: z
      .string()
      .optional()
      .describe("New storageId from generate_design_image"),
    products: z
      .array(productSchema)
      .optional()
      .describe("Replaces all existing products"),
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
    tags: z.array(z.string()).optional().describe("Updated tags"),
    title: z.string().optional().describe("New title"),
  }),
});
