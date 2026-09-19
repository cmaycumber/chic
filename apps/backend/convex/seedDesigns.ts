/**
 * Seed Designs Script
 *
 * Creates complete, shoppable design content using the design agent.
 * The agent autonomously searches for products, generates visualizations,
 * and creates designs with all necessary data.
 *
 * How It Works:
 * - Calls the design agent with room type, style, budget, and design requirements
 * - Agent uses its tools to search Amazon for real furniture and decor products
 * - Agent generates photorealistic design images showing the products in context
 * - Agent creates the complete design with products, images, and descriptions
 *
 * Rate Limiting Strategy:
 * - Adds configurable delays between design generations
 * - Implements exponential backoff retry logic
 * - Processes designs sequentially to avoid overwhelming the API
 *
 * Usage with Convex MCP:
 * 1. Use mcp_convex_run to call these functions
 * 2. Provide roomType, style, and seed count
 * 3. Script will generate complete designs with products and images
 */

"use node";
import { createThread } from "@convex-dev/agent";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { type ActionCtx, internalAction } from "./_generated/server";
import { designAgent } from "./agents/design";

// Rate limiting configuration
const DELAY_BETWEEN_DESIGNS_MS = 8000; // 8 seconds between each design generation
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 5000; // 5 seconds initial retry delay

/**
 * Sleep utility for rate limiting
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retry logic with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY_MS
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const isRateLimit =
      errorMessage.includes("rate limit") ||
      errorMessage.includes("RateLimitError") ||
      errorMessage.includes("429");

    if (isRateLimit) {
      await sleep(delay);
      return retryWithBackoff(fn, retries - 1, delay * 2); // Exponential backoff
    }

    throw error;
  }
}

const roomTypeValidator = v.union(
  v.literal("living-room"),
  v.literal("bedroom"),
  v.literal("kitchen"),
  v.literal("bathroom"),
  v.literal("dining-room"),
  v.literal("home-office"),
  v.literal("family-room"),
  v.literal("nursery"),
  v.literal("outdoor")
);

const styleValidator = v.union(
  v.literal("modern"),
  v.literal("minimalist"),
  v.literal("scandinavian"),
  v.literal("industrial"),
  v.literal("bohemian"),
  v.literal("coastal"),
  v.literal("traditional"),
  v.literal("contemporary")
);

// Budget constants
const budgetLivingModernMin = 2000;
const budgetLivingModernMax = 5000;
const budgetLivingScandinavianMin = 1500;
const budgetLivingScandinavianMax = 4000;
const budgetLivingBohemianMin = 1000;
const budgetLivingBohemianMax = 3000;

const budgetBedroomModernMin = 1500;
const budgetBedroomModernMax = 4000;
const budgetBedroomScandinavianMin = 1200;
const budgetBedroomScandinavianMax = 3500;
const budgetBedroomBohemianMin = 1000;
const budgetBedroomBohemianMax = 2500;

const budgetFamilyModernMin = 2500;
const budgetFamilyModernMax = 6000;
const budgetFamilyTraditionalMin = 2000;
const budgetFamilyTraditionalMax = 5000;
const budgetFamilyCoastalMin = 2000;
const budgetFamilyCoastalMax = 4500;

const budgetKitchenModernMin = 5000;
const budgetKitchenModernMax = 15_000;
const budgetKitchenScandinavianMin = 4000;
const budgetKitchenScandinavianMax = 12_000;
const budgetKitchenIndustrialMin = 4500;
const budgetKitchenIndustrialMax = 13_000;

// Design inspiration templates
const DESIGN_TEMPLATES = {
  bedroom: {
    bohemian: {
      budgetRange: [budgetBedroomBohemianMin, budgetBedroomBohemianMax],
      tags: ["layered", "textured", "earthy"],
    },
    modern: {
      budgetRange: [budgetBedroomModernMin, budgetBedroomModernMax],
      tags: ["serene", "minimal", "calming"],
    },
    scandinavian: {
      budgetRange: [budgetBedroomScandinavianMin, budgetBedroomScandinavianMax],
      tags: ["cozy", "hygge", "natural"],
    },
  },
  "family-room": {
    coastal: {
      budgetRange: [budgetFamilyCoastalMin, budgetFamilyCoastalMax],
      tags: ["bright", "airy", "relaxed"],
    },
    modern: {
      budgetRange: [budgetFamilyModernMin, budgetFamilyModernMax],
      tags: ["family-friendly", "durable", "comfortable"],
    },
    traditional: {
      budgetRange: [budgetFamilyTraditionalMin, budgetFamilyTraditionalMax],
      tags: ["warm", "inviting", "classic"],
    },
  },
  kitchen: {
    industrial: {
      budgetRange: [budgetKitchenIndustrialMin, budgetKitchenIndustrialMax],
      tags: ["exposed", "metal", "concrete"],
    },
    modern: {
      budgetRange: [budgetKitchenModernMin, budgetKitchenModernMax],
      tags: ["sleek", "functional", "clean"],
    },
    scandinavian: {
      budgetRange: [budgetKitchenScandinavianMin, budgetKitchenScandinavianMax],
      tags: ["light", "efficient", "warm-wood"],
    },
  },
  "living-room": {
    bohemian: {
      budgetRange: [budgetLivingBohemianMin, budgetLivingBohemianMax],
      tags: ["eclectic", "colorful", "textured"],
    },
    modern: {
      budgetRange: [budgetLivingModernMin, budgetLivingModernMax],
      tags: ["clean-lines", "neutral-colors", "minimalist"],
    },
    scandinavian: {
      budgetRange: [budgetLivingScandinavianMin, budgetLivingScandinavianMax],
      tags: ["cozy", "light-wood", "neutral-tones"],
    },
  },
};

/**
 * Generate a complete design using the design agent
 * The agent will search for products, generate an image, and create the design
 * Returns the design ID created by the agent
 */
async function generateCompleteDesign(
  ctx: ActionCtx,
  args: {
    roomType: string;
    designStyle: string;
    tags: string[];
    budget: number;
  }
): Promise<Id<"designs">> {
  const { roomType, designStyle, tags, budget } = args;
  const titleSeed = `${designStyle} ${roomType.replace("-", " ")} Design`;

  // Create a thread for this design generation
  const threadId = await createThread(ctx, components.agent, {
    title: `Seed Design: ${titleSeed}`,
  });

  // Create a detailed prompt for the agent to generate a complete design
  const prompt = `Create a complete ${designStyle} design for a ${roomType.replace("-", " ")}.

**Requirements:**
- Budget: $${budget}
- Style: ${designStyle}
- Room Type: ${roomType}
- Design aesthetic tags: ${tags.join(", ")}

**Your task:**
1. Create a unique, specific design (avoid generic titles like "Modern Living Room")
2. Search for 3-5 actual furniture and decor products from Amazon that fit the style and budget
3. Generate a photorealistic design visualization showing these products in the space
4. Save the complete design with all products using the create_design tool

Make this design actionable and shoppable with real products. Focus on furniture, lighting, rugs, artwork, and accessories that bring this ${roomType.replace("-", " ")} to life.

After you create the design, respond with the design ID. Don't ask any questions.`;

  // Let the agent run and use its tools to create the complete design
  await designAgent.generateText(ctx, { threadId }, { prompt });

  // Get the design that was created in this thread
  const designs = await ctx.runQuery(internal.threads.getThreadDesigns, {
    threadId,
  });

  if (designs.length === 0) {
    throw new Error(
      "Agent did not create a design. The design creation may have failed."
    );
  }

  // Return the most recent design ID (should be the only one)
  return designs[0]._id;
}

/**
 * Generate a single design with AI using the design agent
 * The agent will search for products, generate an image, and create a complete design
 */
export const generateSeedDesign = internalAction({
  args: {
    designStyle: styleValidator,
    featured: v.optional(v.boolean()),
    roomType: roomTypeValidator,
  },
  handler: async (ctx, args) => {
    // Get template data
    const defaultBudgetMin = 2000;
    const defaultBudgetMax = 5000;

    const roomTemplates =
      DESIGN_TEMPLATES[args.roomType as keyof typeof DESIGN_TEMPLATES];

    const template = roomTemplates?.[
      args.designStyle as keyof typeof roomTemplates
    ] ?? {
      budgetRange: [defaultBudgetMin, defaultBudgetMax],
      tags: ["stylish", "functional"],
    };

    // Generate random budget in range
    const budget =
      Math.floor(
        Math.random() * (template.budgetRange[1] - template.budgetRange[0] + 1)
      ) + template.budgetRange[0];

    // Let the design agent generate a complete design with products and image
    const designId = await retryWithBackoff(() =>
      generateCompleteDesign(ctx, {
        budget,
        designStyle: args.designStyle,
        roomType: args.roomType,
        tags: template.tags,
      })
    );

    const defaultViews = 100;

    await ctx.runMutation(internal.designs.update, {
      id: designId,
      patch: {
        featured: args.featured ?? false,
        views: Math.floor(Math.random() * defaultViews),
      },
    });

    return designId;
  },
  returns: v.id("designs"),
});

/**
 * Batch seed designs for a room type
 */

export const seedRoomDesigns = internalAction({
  args: {
    count: v.optional(v.number()),
    featured: v.optional(v.boolean()),
    roomType: roomTypeValidator,
  },
  handler: async (ctx, args) => {
    const defaultCount = 6;
    const featuredCount = 3;

    const count = args.count ?? defaultCount;
    const styles = [
      "modern",
      "scandinavian",
      "bohemian",
      "industrial",
      "minimalist",
      "coastal",
    ] as const;

    const designIds: Id<"designs">[] = [];
    for (let i = 0; i < count; i += 1) {
      const style = styles[i % styles.length];

      // biome-ignore lint/performance/noAwaitInLoops: sequential by design to respect the rate-limit delay between generation calls
      const designId: Id<"designs"> = await ctx.runAction(
        internal.seedDesigns.generateSeedDesign,
        {
          designStyle: style,
          featured: args.featured ?? i < featuredCount,
          roomType: args.roomType,
        }
      );
      designIds.push(designId);

      // Delay between designs to avoid rate limits (except after last design)
      if (i < count - 1) {
        await sleep(DELAY_BETWEEN_DESIGNS_MS);
      }
    }

    return designIds;
  },
  returns: v.array(v.id("designs")),
});

/**
 * Seed all room types with designs
 */

export const seedAllRooms = internalAction({
  args: {
    designsPerRoom: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const defaultDesignsPerRoom = 6;

    const roomTypes = [
      "living-room",
      "bedroom",
      "kitchen",
      "family-room",
      "dining-room",
      "home-office",
    ] as const;

    const designsPerRoom = args.designsPerRoom ?? defaultDesignsPerRoom;
    let totalDesigns = 0;

    for (let i = 0; i < roomTypes.length; i += 1) {
      const roomType = roomTypes[i];

      // biome-ignore lint/performance/noAwaitInLoops: sequential by design to respect the rate-limit delay between room seeding calls
      const designs = await ctx.runAction(
        internal.seedDesigns.seedRoomDesigns,
        {
          count: designsPerRoom,
          featured: true,
          roomType,
        }
      );
      totalDesigns += designs.length;

      // Delay between room types (except after last room)
      if (i < roomTypes.length - 1) {
        await sleep(DELAY_BETWEEN_DESIGNS_MS);
      }
    }

    return {
      roomsSeeded: roomTypes.length,
      totalDesigns,
    };
  },
  returns: v.object({
    roomsSeeded: v.number(),
    totalDesigns: v.number(),
  }),
});

/**
 * Generate a single design (safest option for rate limiting)
 *
 * This is the recommended way to seed designs one at a time
 * to avoid rate limits entirely.
 */
export const generateSingleDesign = internalAction({
  args: {
    featured: v.optional(v.boolean()),
    roomType: roomTypeValidator,
    style: styleValidator,
  },
  handler: async (ctx, args) => {
    const designId: Id<"designs"> = await ctx.runAction(
      internal.seedDesigns.generateSeedDesign,
      {
        designStyle: args.style,
        featured: args.featured ?? false,
        roomType: args.roomType,
      }
    );

    const roomLabel = args.roomType
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    const styleLabel = args.style.charAt(0).toUpperCase() + args.style.slice(1);
    const title = `${styleLabel} ${roomLabel} Design`;

    return {
      designId,
      roomType: args.roomType,
      style: args.style,
      title,
    };
  },
  returns: v.object({
    designId: v.id("designs"),
    roomType: roomTypeValidator,
    style: styleValidator,
    title: v.string(),
  }),
});

/**
 * USAGE RECOMMENDATIONS:
 *
 * The design agent now handles the entire design creation process autonomously,
 * including product search, image generation, and database creation.
 *
 * To avoid rate limits, use these strategies:
 *
 * 1. Generate ONE design at a time (SAFEST):
 *    ```
 *    mcp_convex_run({
 *      deploymentSelector: "...",
 *      functionName: "seedDesigns:generateSingleDesign",
 *      args: JSON.stringify({
 *        roomType: "living-room",
 *        style: "modern",
 *        featured: true
 *      })
 *    })
 *    ```
 *    Wait a minute, then generate the next one.
 *
 * 2. Generate a small batch for one room (with delays):
 *    ```
 *    mcp_convex_run({
 *      deploymentSelector: "...",
 *      functionName: "seedDesigns:seedRoomDesigns",
 *      args: JSON.stringify({
 *        roomType: "living-room",
 *        count: 3  // Small number
 *      })
 *    })
 *    ```
 *    This will take time as the agent searches products and generates images for each design.
 *
 * 3. Generate all rooms (SLOWEST but complete):
 *    ```
 *    mcp_convex_run({
 *      deploymentSelector: "...",
 *      functionName: "seedDesigns:seedAllRooms",
 *      args: JSON.stringify({
 *        designsPerRoom: 2  // Keep this low
 *      })
 *    })
 *    ```
 *    This will take several minutes but will complete with full designs including products.
 *
 * WHAT THE AGENT DOES:
 * - Receives room type, style, budget, and design requirements
 * - Uses search_products tool to find 3-5 real furniture/decor items from Amazon
 * - Uses generate_design_image tool to create photorealistic visualizations
 * - Uses create_design tool to save the complete design with products and images
 * - Returns the design ID for further updates (featured status, likes, views)
 *
 * RATE LIMIT CONFIGURATION:
 * - DELAY_BETWEEN_DESIGNS_MS: 8000ms (8 seconds between each design)
 * - Each design involves multiple agent steps (product search, image generation, design creation)
 * - Adjust these constants at the top of the file if you hit rate limits
 */
