/**
 * Design modification tool
 *
 * This tool:
 * - Modifies existing designs
 * - Can update products, add/replace products
 * - Can generate new images based on modifications
 * - Maintains design history through updates
 */
"use node";

import { openai } from "@ai-sdk/openai";
import { createTool, type ToolCtx } from "@convex-dev/agent";
import { gateway, generateText } from "ai";
import z from "zod";
import { internal } from "../../_generated/api";
import type { Doc, Id } from "../../_generated/dataModel";

const JSON_ARRAY_PATTERN = /\[[\s\S]*\]/;
const URL_PATTERN = /https?:\/\/[^\s]+/;

const productSchema = z.object({
  name: z.string().describe("Product name"),
  price: z.number().describe("Product price in dollars"),
  imageUrl: z.string().describe("URL to product image"),
  productUrl: z.string().optional().describe("URL to product page"),
  description: z.string().optional().describe("Product description"),
});

type Product = z.infer<typeof productSchema>;

function validateRequiredFields(
  designPlan?: string,
  roomType?: string,
  style?: string,
  operation?: string
): void {
  const missing: string[] = [];
  if (!designPlan) {
    missing.push("designPlan");
  }
  if (!roomType) {
    missing.push("roomType");
  }
  if (!style) {
    missing.push("style");
  }
  if (missing.length > 0) {
    const fields = missing.join(", ");
    const opText = operation ? ` for ${operation}` : "";
    throw new Error(`${fields} are required${opText}`);
  }
}

async function handleProductUpdates(
  ctx: ToolCtx,
  args: {
    products?: Product[];
    addProducts: boolean;
    productResearch: boolean;
    roomType?: string;
    style?: string;
    designPlan?: string;
    budget?: number;
  },
  existingProducts: Product[]
): Promise<Product[]> {
  let products = existingProducts;

  if (args.products) {
    products = args.addProducts
      ? [...existingProducts, ...args.products]
      : args.products;
  }

  if (args.productResearch) {
    validateRequiredFields(
      args.designPlan,
      args.roomType,
      args.style,
      "product research"
    );

    const researchedProducts = await researchProducts(ctx, {
      roomType: args.roomType || "",
      style: args.style || "",
      designPlan: args.designPlan || "",
      budget: args.budget,
    });

    products = args.addProducts
      ? [...products, ...researchedProducts]
      : researchedProducts;
  }

  return products;
}

async function handleImageUpdates(
  ctx: ToolCtx,
  args: {
    regenerateImage: boolean;
    baseImageStorageId?: string;
    roomType?: string;
    style?: string;
    designPlan?: string;
  },
  products: Product[],
  existingImageStorageId?: Id<"_storage">
): Promise<Id<"_storage"> | undefined> {
  if (args.regenerateImage) {
    validateRequiredFields(
      args.designPlan,
      args.roomType,
      args.style,
      "image generation"
    );

    const generatedId = await generateDesignImage(
      ctx,
      {
        baseImageStorageId: args.baseImageStorageId,
        roomType: args.roomType || "",
        style: args.style || "",
        designPlan: args.designPlan || "",
      },
      products
    );
    return generatedId || existingImageStorageId;
  }

  if (args.baseImageStorageId) {
    return args.baseImageStorageId as Id<"_storage">;
  }

  return existingImageStorageId;
}

/**
 * Modifies an existing design
 */
// biome-ignore lint/style/useNamingConvention: OpenAI tool names use snake_case
export const modify_design = createTool({
  description:
    "Modify an existing design. Can update description, add/replace products, regenerate images, or adjust budget. Use this when the user wants to change or refine an existing design.",
  args: z.object({
    designId: z
      .string()
      .describe("The ID of the design to modify (from artifacts)"),
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
      .describe(
        "New products to add or replace existing products. If provided, replaces all existing products."
      ),
    addProducts: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "If true, adds new products to existing ones instead of replacing them"
      ),
    productResearch: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "Whether to research and add new products using web search. Requires roomType and style."
      ),
    regenerateImage: z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether to generate a new design visualization image"),
    baseImageStorageId: z
      .string()
      .optional()
      .describe(
        "Storage ID of a new image to use as base for the design (e.g., updated room photo)"
      ),
    roomType: z
      .string()
      .optional()
      .describe(
        "Updated room type (required for product research or image regeneration)"
      ),
    style: z
      .string()
      .optional()
      .describe(
        "Updated design style (required for product research or image regeneration)"
      ),
  }),
  handler: async (ctx: ToolCtx, args): Promise<Doc<"designs"> | null> => {
    // Get the existing design
    const existingDesign = await ctx.runQuery(internal.designs.read, {
      id: args.designId as Id<"designs">,
    });

    if (!existingDesign) {
      throw new Error(`Design with ID ${args.designId} not found`);
    }

    // Handle product updates
    const products = await handleProductUpdates(
      ctx,
      {
        products: args.products,
        addProducts: args.addProducts,
        productResearch: args.productResearch,
        roomType: args.roomType,
        style: args.style,
        designPlan:
          args.designPlan ||
          existingDesign.designPlan ||
          existingDesign.description,
        budget: args.budget || existingDesign.budget,
      },
      existingDesign.products || []
    );

    // Handle image updates
    const imageStorageId = await handleImageUpdates(
      ctx,
      {
        regenerateImage: args.regenerateImage,
        baseImageStorageId: args.baseImageStorageId,
        roomType: args.roomType,
        style: args.style,
        designPlan:
          args.designPlan ||
          existingDesign.designPlan ||
          existingDesign.description,
      },
      products,
      existingDesign.imageStorageId
    );

    // Build updated description
    const description = buildDescription({
      existingDescription: existingDesign.description,
      newDescription: args.description,
      designPlan: args.designPlan || existingDesign.designPlan,
      products,
      budget: args.budget ?? existingDesign.budget,
    });

    // Update the design
    const updatedDesign: Doc<"designs"> | null = await ctx.runMutation(
      internal.designs.update,
      {
        id: args.designId as Id<"designs">,
        patch: {
          title: args.title || existingDesign.title,
          description,
          imageStorageId,
          products: products.length > 0 ? products : undefined,
          budget: args.budget ?? existingDesign.budget,
          designPlan: args.designPlan || existingDesign.designPlan,
        },
      }
    );

    return updatedDesign;
  },
});

async function researchProducts(
  _ctx: ToolCtx,
  args: {
    roomType: string;
    style: string;
    designPlan: string;
    budget?: number;
  }
): Promise<Product[]> {
  const productsSearchPrompt = `Based on this interior design plan:
Room Type: ${args.roomType}
Style: ${args.style}
Design Plan: ${args.designPlan}
${args.budget ? `Budget: $${args.budget}` : ""}

Find 5-8 specific furniture and decor products that would work for this design. For each product, provide:
- Product name
- Estimated price (as a number, not a string)
- Product image URL (direct link to the product image)
- Product page URL (where to buy it)
- Brief description

Focus on products that fit the style and stay within budget if provided. Return the results as a JSON array with fields: name, price, imageUrl, productUrl, description.`;

  const productResearchResult = await generateText({
    model: openai("gpt-4o"),
    prompt: productsSearchPrompt,
    tools: {
      // biome-ignore lint/style/useNamingConvention: OpenAI tool name
      web_search: openai.tools.webSearch(),
    },
  });

  const products: Product[] = [];

  try {
    const jsonMatch = productResearchResult.text.match(JSON_ARRAY_PATTERN);
    if (jsonMatch) {
      const productsData = JSON.parse(jsonMatch[0]);
      products.push(
        ...productsData.map(
          (p: {
            name: string;
            price: number;
            imageUrl?: string;
            productUrl?: string;
            description?: string;
          }) => ({
            name: p.name,
            price: p.price,
            imageUrl: p.imageUrl || "",
            productUrl: p.productUrl,
            description: p.description,
          })
        )
      );
    }
  } catch {
    // If parsing fails, return empty array
  }

  return products;
}

async function generateDesignImage(
  ctx: ToolCtx,
  args: {
    baseImageStorageId?: string;
    roomType: string;
    style: string;
    designPlan: string;
  },
  products: Product[]
): Promise<Id<"_storage"> | null> {
  const imagePromptBase = args.baseImageStorageId
    ? "Edit and enhance this interior design space based on the uploaded image."
    : `Create a photorealistic interior design image of a ${args.roomType}.`;

  const productsDescription =
    products.length > 0
      ? `\n\nInclude these products naturally placed in the room:\n${products.map((p, i) => `${i + 1}. ${p.name}${p.description ? ` - ${p.description}` : ""}`).join("\n")}`
      : "";

  const imagePrompt = `${imagePromptBase}

Style: ${args.style}
Design Elements: ${args.designPlan}${productsDescription}

Make it look realistic, well-lit, and professionally styled. The composition should show how all elements work together harmoniously in the space.`;

  // Use Google Gemini Flash for image generation
  const imageResult = await generateText({
    model: gateway.languageModel("google/gemini-2.5-flash-image"),
    prompt: imagePrompt,
  });

  let imageStorageId: Id<"_storage"> | null = null;

  // Try to extract and store the generated image from the response
  const imageUrl = imageResult.text.match(URL_PATTERN)?.[0];
  if (imageUrl) {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      imageStorageId = await ctx.storage.store(blob);
    } catch {
      // Failed to store image
    }
  }

  return imageStorageId;
}

function buildDescription(args: {
  existingDescription: string;
  newDescription?: string;
  designPlan?: string;
  products: Product[];
  budget?: number;
}): string {
  const parts: string[] = [];

  // Use new description if provided, otherwise keep existing
  if (args.newDescription) {
    parts.push(args.newDescription);
  } else {
    // Keep the base description from existing, but remove old products/budget sections
    const existingBase = args.existingDescription
      .split("\n\nDesign Plan:")[0]
      .split("\n\nProducts included:")[0]
      .split("\n\nBudget:")[0];
    parts.push(existingBase);
  }

  if (args.designPlan) {
    parts.push(`\n\nDesign Plan:\n${args.designPlan}`);
  }

  if (args.products.length > 0) {
    const totalCost = args.products.reduce((sum, p) => sum + p.price, 0);
    parts.push(
      `\n\nProducts included:\n${args.products.map((p) => `- ${p.name}: $${p.price}${p.description ? ` - ${p.description}` : ""}`).join("\n")}`
    );
    parts.push(`\nTotal estimated cost: $${totalCost}`);

    if (args.budget) {
      const isOverBudget = totalCost > args.budget;
      const status = isOverBudget ? " (⚠️ Over budget)" : " (✓ Within budget)";
      const budgetLine = `Budget: $${args.budget}${status}`;
      parts.push(budgetLine);
    }
  } else if (args.budget) {
    const budgetLine = `\n\nBudget: $${args.budget}`;
    parts.push(budgetLine);
  }

  return parts.join("");
}
