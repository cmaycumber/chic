/**
 * Interior Design Agent
 *
 * This agent uses multiple AI models:
 * - Claude 4.5 Haiku: Main conversational agent for design consultation
 * - GPT-4o: Product research with web search capabilities
 * - Google Gemini Flash: Design image generation
 *
 * Required API Keys (set in Convex environment variables):
 * - ANTHROPIC_API_KEY: For Claude 4.5 Haiku
 * - OPENAI_API_KEY: For GPT-4o and web search
 * - GOOGLE_GENERATIVE_AI_API_KEY: For Gemini Flash image generation
 *
 * biome-ignore-all lint/style/useNamingConvention: OpenAI tools are not camelCase
 */
"use node";
import { anthropic } from "@ai-sdk/anthropic";
import { Agent } from "@convex-dev/agent";
import {
  defaultSettingsMiddleware,
  gateway,
  stepCountIs,
  wrapLanguageModel,
} from "ai";
import { components, internal } from "../_generated/api";
import { add_products_to_design } from "./tools/addProductsToDesign";
import { create_design } from "./tools/createDesign";
import { generate_design_image } from "./tools/generateDesignImage";
import { get_design } from "./tools/getDesign";
import { search_products } from "./tools/searchProducts";
import { update_design } from "./tools/updateDesign";

const MAX_AGENT_STEPS = 15;

// Use Claude 4.5 Haiku for the main agent
const claude = wrapLanguageModel({
  model: gateway.languageModel("anthropic/claude-4.5-haiku"),
  middleware: defaultSettingsMiddleware({ settings: {} }),
});

/**
 * Format a single design's products list
 */
function formatProductsList<
  T extends {
    name: string;
    price: number;
    description?: string;
    productUrl?: string;
  },
>(products: T[] | undefined): string {
  if (!products?.length) {
    return "  No products listed";
  }

  return products
    .map((p) => {
      const description = p.description ? ` - ${p.description}` : "";
      const url = p.productUrl ? ` (${p.productUrl})` : "";
      return `  - ${p.name}: $${p.price}${description}${url}`;
    })
    .join("\n");
}

/**
 * Format a single design for context with structured message parts
 */
async function formatDesignContext<
  T extends {
    _id: { toString(): string };
    title: string;
    description: string;
    designPlan?: string;
    budget?: number;
    products?: Array<{
      name: string;
      price: number;
      description?: string;
      productUrl?: string;
    }>;
    imageStorageId?: string;
  },
>(
  ctx: { storage: { get: (id: string) => Promise<Blob | null> } },
  design: T
): Promise<
  Array<{ type: "text"; text: string } | { type: "image"; image: string }>
> {
  const designPlan = design.designPlan
    ? `Design Plan: ${design.designPlan}`
    : "";
  const budget = design.budget ? `Budget: $${design.budget}` : "";
  const productsList = formatProductsList(design.products);

  const textPart = {
    type: "text" as const,
    text: `
Design: ${design.title}
ID: ${design._id}
Description: ${design.description}
${designPlan}
${budget}
Products:
${productsList}
---`,
  };

  // If there's an image, fetch it as bytes and convert to base64 data URL
  if (design.imageStorageId) {
    const imageBlob = await ctx.storage.get(design.imageStorageId);
    if (imageBlob) {
      const arrayBuffer = await imageBlob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const mimeType = imageBlob.type || "image/png";
      const dataUrl = `data:${mimeType};base64,${base64}`;

      return [
        textPart,
        {
          type: "image" as const,
          image: dataUrl,
        },
      ];
    }
  }

  return [textPart];
}

/**
 * Build structured content parts for designs context
 */
async function buildDesignsContextParts<
  T extends {
    _id: { toString(): string };
    title: string;
    description: string;
    designPlan?: string;
    budget?: number;
    products?: Array<{
      name: string;
      price: number;
      description?: string;
      productUrl?: string;
    }>;
    imageStorageId?: string;
  },
>(
  ctx: { storage: { get: (id: string) => Promise<Blob | null> } },
  designs: T[]
): Promise<
  Array<{ type: "text"; text: string } | { type: "image"; image: string }>
> {
  const contentParts: Array<
    { type: "text"; text: string } | { type: "image"; image: string }
  > = [
    {
      type: "text" as const,
      text: `
=== EXISTING DESIGNS IN THIS CONVERSATION ===
The following designs have been created in this conversation. Reference these when the user asks about existing designs or wants to modify them:
`,
    },
  ];

  // Add each design's structured content (text + optional image)
  for (const design of designs) {
    const designParts = await formatDesignContext(ctx, design);
    contentParts.push(...designParts);
  }

  contentParts.push({
    type: "text" as const,
    text: "\n=== END OF EXISTING DESIGNS ===",
  });

  return contentParts;
}

/**
 * Interior Design Agent
 * Specialized AI agent for interior design consultation and advice
 */
export const designAgent = new Agent(components.agent, {
  name: "Interior Design Consultant",
  languageModel: claude,
  tools: {
    web_search: anthropic.tools.webSearch_20250305({
      maxUses: 10,
    }),
    create_design,
    update_design,
    search_products,
    generate_design_image,
    add_products_to_design,
    get_design,
  },
  stopWhen: stepCountIs(MAX_AGENT_STEPS),
  contextHandler: async (ctx, args) => {
    // Build the context messages
    const messages = [
      ...args.search,
      ...args.recent,
      ...args.inputMessages,
      ...args.inputPrompt,
    ];

    // Fetch existing designs from the thread
    if (args.threadId) {
      const designs = await ctx.runQuery(internal.threads.getThreadDesigns, {
        threadId: args.threadId,
      });

      if (designs.length > 0) {
        const contentParts = await buildDesignsContextParts(ctx, designs);

        // Find the last user message index
        let lastUserMessageIndex = -1;
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].role === "user") {
            lastUserMessageIndex = i;
            break;
          }
        }

        // Insert the designs context with structured parts before the last user message
        // Use "user" role since system messages don't support multimodal content
        const designsMessage = {
          role: "user" as const,
          content: contentParts,
        };

        if (lastUserMessageIndex > 0) {
          messages.splice(lastUserMessageIndex, 0, designsMessage);
        } else {
          messages.unshift(designsMessage);
        }
      }
    }

    return [...messages, ...args.existingResponses];
  },
  instructions: `You are an expert interior design consultant with years of experience helping people create beautiful, functional spaces. Your expertise spans space planning, color theory, style curation, material selection, lighting design, and product sourcing.

Your approach is conversational and collaborative. Listen to what excites your clients about their space, understand their lifestyle and preferences, and guide them toward designs that feel authentically theirs. Balance aesthetics with practicality, and help them envision the transformation through vivid descriptions and visual examples.

You're knowledgeable about various design styles (modern, traditional, minimalist, bohemian, industrial, scandinavian, etc.), color psychology, furniture placement principles, and how different materials work in real-life settings. You can work within any constraints they have, but focus on possibilities rather than limitations.

## Your Tools

**create_design** - Save a new design to the database. Include title, description, and optionally products, budget, or an image. You might want to search for products or generate a visualization first, then bring it all together here.

**update_design** - Modify an existing design. You can update any aspect: title, description, products, budget, or image. Whatever you provide will replace what's there.

**search_products** - Find real furniture and decor items through web search. Provide the room type, style, and what you're looking for (designPlan), and optionally mention budget or how many items you want. You'll get back products with names, prices, images, and purchase links.

**generate_design_image** - Create photorealistic visualizations of interior spaces. Describe the room type, style, and design vision. You can include products to show them in context, or provide a base image to modify.

**add_products_to_design** - Add new products to an existing design without removing what's already there. Great for when clients want to expand their design with additional pieces.

**get_design** - Look up the current details of a design. Useful when you need to check what's already been created before making updates.

## Working with Tools

Feel free to use these tools fluidly based on the conversation. If someone wants to see what a space could look like, generate an image. If they're curious about specific furniture pieces, search for products. If they want to save something they like, create or update a design.

You can combine tools naturally—search for products and then generate an image showing them in place, or create a design that includes both visual and shopping elements. Think of these as your creative toolkit rather than rigid steps to follow.

When generating images, provide rich descriptions that capture the mood, lighting, materials, and spatial layout. When searching for products, focus on what would genuinely work well for their space and style.

Stay conversational, enthusiastic, and supportive. This is a creative collaboration, not a transaction.`,
});
