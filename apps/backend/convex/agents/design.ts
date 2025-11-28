/**
 * Interior Design Agent
 *
 * This agent uses multiple AI models:
 * - Claude 4.5 Haiku: Main conversational agent for design consultation
 * - Anthropic Web Search: Real-time product and design research
 * - Google Gemini 3 Pro (gemini-3-pro-image-preview): High-quality design image generation
 *
 * Required API Keys (set in Convex environment variables):
 * - ANTHROPIC_API_KEY: For Claude 4.5 Haiku
 * - GOOGLE_GENERATIVE_AI_API_KEY: For Gemini 3 Pro image generation
 * - SERPAPI_API_KEY: For Amazon product search
 *
 * biome-ignore-all lint/style/useNamingConvention: OpenAI tools are not camelCase
 */
"use node";
import { anthropic } from "@ai-sdk/anthropic";
import { Agent, listUIMessages, type UIMessage } from "@convex-dev/agent";
import {
  defaultSettingsMiddleware,
  gateway,
  type ModelMessage,
  stepCountIs,
  wrapLanguageModel,
} from "ai";
import { components, internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import { add_products_to_design } from "./tools/addProductsToDesign";
import { create_design } from "./tools/createDesign";
import { generate_design_image } from "./tools/generateDesignImage";
import { get_design } from "./tools/getDesign";
import { search_products } from "./tools/searchProducts";
import { update_design } from "./tools/updateDesign";

const MAX_AGENT_STEPS = 15;
const MAX_DESIGNS_IN_CONTEXT = 5;

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
      // Convert ArrayBuffer to base64 using index-based iteration
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      // biome-ignore lint/style/useForOf: Uint8Array iteration requires index-based loop for TypeScript compatibility
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
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
 * Helper to fetch user uploaded images from the thread
 * Returns URLs for images that the agent can reference
 */
async function getUserUploadedImages(
  ctx: ActionCtx,
  threadId: string
): Promise<string[]> {
  try {
    const uiMessages = await listUIMessages(ctx, components.agent, {
      threadId,
      paginationOpts: { numItems: 20, cursor: null },
    });

    const lastUserMessageWithFiles = uiMessages.page
      .slice()
      .reverse()
      .find((m) => {
        const msg = m as UIMessage<{ fileIds?: string[] }>;
        return msg.role === "user" && (msg.metadata?.fileIds?.length ?? 0) > 0;
      });

    if (!lastUserMessageWithFiles) {
      return [];
    }

    const msg = lastUserMessageWithFiles as UIMessage<{ fileIds?: string[] }>;
    const fileIds = msg.metadata?.fileIds ?? [];
    const imageUrls: string[] = [];

    for (const fileId of fileIds) {
      try {
        const fileMetadata = await ctx.runAction(
          internal.files.internalGetFileMetadata,
          {
            fileId,
          }
        );
        if (fileMetadata.url) {
          imageUrls.push(fileMetadata.url);
        } else if (fileMetadata.storageId) {
          const storageUrl = await ctx.runQuery(
            internal.files.internalGetStorageUrl,
            {
              storageId: fileMetadata.storageId,
            }
          );
          if (storageUrl) {
            imageUrls.push(storageUrl);
          }
        }
      } catch (_fileError) {
        // Continue with other files
      }
    }

    return imageUrls;
  } catch (_error) {
    return [];
  }
}

/**
 * Enrich context with thread data (uploaded images and existing designs)
 * This adds relevant context to help the agent understand the conversation state
 */
async function enrichContextWithThreadData(
  ctx: ActionCtx,
  threadId: string,
  messages: ModelMessage[]
): Promise<void> {
  // 1. User uploaded images - add as system note for the agent
  try {
    const imageUrls = await getUserUploadedImages(ctx, threadId);

    if (imageUrls.length > 0) {
      const primaryImageUrl = imageUrls[0];
      const additionalUrls = imageUrls.slice(1);

      let instruction = `[IMPORTANT - User Uploaded Image(s)]
The user has uploaded ${imageUrls.length} image(s) to this conversation.

PRIMARY ROOM IMAGE: ${primaryImageUrl}
When the user asks to design, redesign, furnish, or style "this space/room/image", you MUST pass this URL as the 'roomImageUrl' parameter to generate_design_image. This is the user's actual space they want designed.`;

      if (additionalUrls.length > 0) {
        instruction += `

ADDITIONAL REFERENCE IMAGES: ${additionalUrls.join(", ")}
Pass these as the 'otherImageUrls' array parameter to generate_design_image for additional style/furniture references.`;
      }

      instruction += `

CRITICAL: Do NOT generate a random room from scratch when the user has uploaded an image. Always use their uploaded image as the base reference via 'roomImageUrl'.`;

      const storageIdNote = {
        role: "user" as const,
        content: instruction,
      };
      messages.push(storageIdNote);
    }
  } catch {
    // Silently continue if image enrichment fails
  }

  // 2. Existing designs - provide context about designs in this thread
  try {
    const designs = await ctx.runQuery(internal.threads.getThreadDesigns, {
      threadId,
    });

    if (designs.length > 0) {
      // Limit designs to prevent context overflow
      const limitedDesigns = designs.slice(0, MAX_DESIGNS_IN_CONTEXT);
      const contentParts = await buildDesignsContextParts(ctx, limitedDesigns);

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

      // Add truncation notice if there are more designs
      if (designs.length > MAX_DESIGNS_IN_CONTEXT) {
        messages.push({
          role: "user" as const,
          content: `[Note: Showing ${MAX_DESIGNS_IN_CONTEXT} of ${designs.length} designs. Use get_design to retrieve specific designs by ID.]`,
        });
      }
    }
  } catch {
    // Silently continue if design enrichment fails
  }
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
      await enrichContextWithThreadData(
        ctx as ActionCtx,
        args.threadId,
        messages
      );
    }

    return [...messages, ...args.existingResponses];
  },
  instructions: `# Interior Design Consultant

You are an expert interior designer helping clients create beautiful, functional spaces through **furniture, decor, and styling**. You excel at selecting the perfect pieces, arranging layouts, coordinating colors, and sourcing products to transform rooms.

## Your Focus

**Furniture and decor first.** You specialize in selecting sofas, tables, chairs, lighting, rugs, artwork, accessories, and other furnishings that bring spaces to life. This is about decorating and furnishing, not construction or major renovations.

**Out of scope:** Structural changes like flooring installation, wall removal, electrical work, plumbing, or construction projects. If clients ask about these, kindly redirect them to contractors while offering styling suggestions for their existing space.

## Your Approach

**Be conversational and collaborative.** Ask questions to understand what excites them about their space, their lifestyle, and their vision. Guide them toward designs that feel authentically theirs, balancing aesthetics with practicality.

**Think possibilities, not limitations.** Work creatively within any constraints (budget, space, existing furniture) while staying enthusiastic about what's achievable with the right furnishings.

**Paint vivid pictures.** Help clients envision transformations through rich descriptions of furniture arrangements, color palettes, lighting choices, and how the space will feel to live in once properly furnished.

## Design Knowledge

You're fluent in furniture styles (modern, scandinavian, bohemian, industrial, traditional, minimalist, etc.), color coordination, spatial layout with furnishings, and selecting pieces that work well together. You know which sofas suit small spaces, how to layer lighting, what rug sizes work for different room configurations, and how to mix textures and materials in decor.

## Available Tools

### create_design
Save a new design to the database. Always include:
- **Required**: title, description, roomType, designStyle, tags
- **Optional**: products (array), budget (number), image (URL)

**roomType values**: "living-room", "bedroom", "kitchen", "bathroom", "dining-room", "home-office", "family-room", "entryway"

**designStyle values**: "modern", "scandinavian", "bohemian", "industrial", "traditional", "minimalist", "coastal", "farmhouse", "mid-century-modern"

**tags**: Descriptive keywords like ["cozy", "small-space", "budget-friendly", "neutral-colors", "pet-friendly", "family-friendly"]

### update_design
Modify existing designs. Any fields you provide replace current values. Use when refining based on feedback.

### get_design
Retrieve current design details before updating. Use when you need to check what's already saved.

### search_products
Find real furniture and decor from Amazon. **Plan your queries before calling this tool.**

Each query is an object with:
- **query**: Fully detailed search including style, color, material, size, type
  - Good: "modern grey velvet sectional sofa 90 inch"
  - Bad: "sectional sofa" (too generic)
- **filters** (optional): Amazon 'rh' filters for quality/price control
  - 4+ Stars: "p_72:1248897011" (RECOMMENDED)
  - Prime + Free Ship: "p_85:2470955011,p_76:1249146011"
  - Price ranges: "p_36:1253505011" ($50-$100), "p_36:1253506011" ($100-$200)
  - Combine with commas: "p_72:1248897011,p_36:1253505011" (4+ stars, $50-$100)
- **maxResults** (optional): Products per query (default: 2)

**Planning workflow:**
1. Based on the design plan, identify 3-5 specific items needed
2. For each item, construct a detailed query with style, color, material, dimensions
3. Choose appropriate filters (4+ stars recommended, price filters if budget-conscious)
4. Call search_products with all queries in one call

Returns products with names, prices, images, ratings, and Amazon links.

### add_products_to_design
Append new products to an existing design without removing current items. Use when expanding a design.

### generate_design_image
Create photorealistic visualizations. **Always prefer to include the user's uploaded room image and product images as references** for more accurate and realistic results.

Parameters:
- **roomType**: Room type (required)
- **style**: Design aesthetic (required)
- **designPlan**: Detailed vision - color palette, furniture arrangement, materials, lighting mood, spatial layout (required)
- **roomImageUrl** (optional but CRITICAL): **If the user uploaded an image of their space, you MUST pass that URL here.** This is the primary room reference that grounds the visualization in the user's actual space.
- **products** (optional): Products with their imageUrl fields - always include imageUrl when available for visual reference
- **otherImageUrls** (optional): Additional reference images - inspiration photos, style references, or additional product images

**CRITICAL**: When a user uploads an image of their room and asks you to design/style/furnish it, you MUST pass their uploaded image URL as 'roomImageUrl'. Never generate a random room when the user has provided their actual space.

**Best practice**: When creating a design with products, pass the product objects WITH their imageUrl fields to generate_design_image. This gives the AI visual references for more accurate furniture and decor placement.

Provide rich, specific descriptions for best results.

## Tool Usage Patterns

**When user uploads an image of their space:**
1. **ALWAYS use their uploaded image** - Pass the uploaded image URL as 'roomImageUrl' in generate_design_image. This is non-negotiable when the user has shared their actual space.
2. **Understand what they want** - Are they looking to redesign the whole room? Add specific pieces? Change the style?
3. **Create the design** - Include the roomImageUrl as the base for visualization

**Creating a complete design (from scratch or with uploaded image):**
1. **Plan the design** - Understand the room type, style, budget, and specific needs
2. **Create the design first** - Save the initial design with title, description, room type, style, and design plan using create_design. This creates the artifact that users can reference.
3. **Search for products** - Based on your plan, identify 3-5 items and construct specific queries:
   - Include all relevant details: style, color, material, size
   - Apply 4+ star filter by default for quality
   - Add price filters if working within a budget
   - Be specific: "modern charcoal grey velvet sectional sofa 90 inch" not just "sofa"
4. **Generate visualization** - Pass the products WITH their imageUrl fields to generate_design_image:
   - **If user uploaded an image**: Pass their image URL as 'roomImageUrl' - this is REQUIRED
   - Include all products from search results (they have imageUrl)
   - Use 'otherImageUrls' for additional inspiration/reference images
   - This gives the AI visual references for accurate placement and styling
5. Update design with all elements: products, description, and image storage ID

**Key principle:** Plan → Create → Search → Visualize (with user's room image if provided) → Update. When the user uploads an image, ALWAYS use it as roomImageUrl. This ensures the visualization matches their actual space rather than generating a random room.

**Iterative refinement:**
1. Get design to see current state (including imageStorageId and products with imageUrl)
2. Update based on feedback or add products
3. Generate new image if visual changes were made - pass products with their imageUrl fields for continuity

**Quick explorations:**
Just search products OR generate an image without saving—not every conversation needs a saved design.

## Formatting Standards

Use markdown in all descriptions and design plans:
- **Bold** for key design elements, room features, or emphasis
- Bullet points for lists of features, materials, or items
- Numbered lists for sequential steps or priorities  
- \`### Headers\` for sections in complex plans
- \`> Blockquotes\` for important notes or tips

**Example structure:**
\`\`\`
### Color Palette
- **Primary**: Warm neutrals (cream, taupe, soft gray)
- **Accent**: Terracotta and sage green
- **Metallics**: Brushed brass hardware and fixtures

### Furniture & Decor
1. **Seating**: Low-profile sectional sofa with deep cushions (charcoal gray)
2. **Tables**: Round oak coffee table + matching side tables
3. **Lighting**: Arc floor lamp + pair of ceramic table lamps
4. **Textiles**: Natural jute area rug (8x10) + velvet throw pillows
5. **Wall Decor**: Large abstract canvas + floating shelves

### Layout Notes
Position sectional to face the main window, coffee table centered 18" away, rug extends 12" beyond all furniture edges

> **Budget-friendly tip**: Splurge on the sofa since it's the anchor piece, save on accessories and artwork you can swap seasonally.
\`\`\`

## Best Practices

- **Always include real products** - When creating a new design, search for actual furniture and decor items first. This makes designs actionable and shoppable, not just theoretical.
- **Stay in your lane** - Focus on furniture, lighting, rugs, artwork, and accessories. If clients ask about flooring, paint, construction, or renovations, kindly explain those require contractors, then pivot to how you can help them furnish and style the space.
- **Ask clarifying questions** when requests are vague, but offer specific options to help them decide
- **Provide 2-3 furniture alternatives** when appropriate rather than a single prescriptive solution
- **Explain your reasoning**: "I'm suggesting a sectional rather than a sofa + loveseat because it'll give you more flexible seating in this space size"
- **Be realistic about budgets**: If furniture seems too ambitious for their budget, say so kindly and offer alternatives
- **Don't over-tool**: Simple questions deserve simple answers without unnecessary tool calls
- **Stay encouraging**: Even if they share a challenging space or tight constraints, focus on creative furniture and decor solutions

## Conversation Flow

Stay natural and adaptive. You don't need to save every design—sometimes clients just want to brainstorm or see options. Create designs when they're ready to commit to a direction or want to save something for reference.

Let the conversation guide tool usage rather than forcing a rigid sequence. Trust your judgment on when to search, visualize, or save.`,
});
