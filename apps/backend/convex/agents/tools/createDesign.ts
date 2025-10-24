/**
 * Comprehensive design creation tool
 *
 * This tool:
 * - Creates designs with optional product research
 * - Generates design images using Google Gemini Flash
 * - Accepts user-provided images as base for modifications
 * - Supports custom product lists or automatic product research
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

/**
 * Creates a new design with optional products and image generation
 */
// biome-ignore lint/style/useNamingConvention: OpenAI tool names use snake_case
export const create_design = createTool({
  description:
    "Create a new interior design. Can include product research, image generation, and budget tracking. Use this when the user wants to create a new design concept.",
  args: z.object({
    title: z.string().describe("The title of the design"),
    description: z
      .string()
      .describe("Detailed description of the design concept and vision"),
    designPlan: z
      .string()
      .optional()
      .describe(
        "Detailed design plan including style, colors, layout, and specific items. Required if generating images or researching products."
      ),
    budget: z
      .number()
      .optional()
      .describe("The user's budget for the design in dollars"),
    products: z
      .array(productSchema)
      .optional()
      .describe(
        "Optional array of specific products to include in the design. If not provided and productResearch is true, products will be researched automatically."
      ),
    productResearch: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "Whether to automatically research and find products using web search. Only used if products array is not provided."
      ),
    generateImage: z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether to generate a design visualization image"),
    baseImageStorageId: z
      .string()
      .optional()
      .describe(
        "Storage ID of an existing image to use as base for the design (e.g., user-uploaded room photo)"
      ),
    roomType: z
      .string()
      .optional()
      .describe(
        "Type of room (e.g., living room, bedroom, kitchen). Required if generating images."
      ),
    style: z
      .string()
      .optional()
      .describe(
        "Design style (e.g., modern, minimalist, bohemian). Required if generating images."
      ),
  }),
  handler: async (ctx: ToolCtx, args) => {
    let products = args.products || [];

    // Research products if requested and no products provided
    if (args.productResearch && products.length === 0) {
      validateRequiredFields(
        args.designPlan,
        args.roomType,
        args.style,
        "product research"
      );
      // After validation, these are guaranteed to be strings
      products = await researchProducts(ctx, {
        roomType: args.roomType as string,
        style: args.style as string,
        designPlan: args.designPlan as string,
        budget: args.budget,
      });
    }

    // Generate design image if requested
    let imageStorageId: Id<"_storage"> | undefined;
    if (args.generateImage) {
      validateRequiredFields(
        args.designPlan,
        args.roomType,
        args.style,
        "image generation"
      );

      // After validation, these are guaranteed to be strings
      const generatedId = await generateDesignImage(
        ctx,
        {
          baseImageStorageId: args.baseImageStorageId,
          roomType: args.roomType as string,
          style: args.style as string,
          designPlan: args.designPlan as string,
        },
        products
      );
      if (generatedId) {
        imageStorageId = generatedId;
      }
    } else if (args.baseImageStorageId) {
      // Use the base image if provided but not generating
      imageStorageId = args.baseImageStorageId as Id<"_storage">;
    }

    // Build full description
    const fullDescription = buildDescription({
      description: args.description,
      designPlan: args.designPlan,
      products,
      budget: args.budget,
    });

    // Create the design
    const design: Doc<"designs"> = await ctx.runMutation(
      internal.designs.create,
      {
        title: args.title,
        description: fullDescription,
        imageStorageId,
        products: products.length > 0 ? products : undefined,
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
  description: string;
  designPlan?: string;
  products: Product[];
  budget?: number;
}): string {
  const parts: string[] = [args.description];

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
