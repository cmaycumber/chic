/**
 * Seed Designs Script
 *
 * Creates initial design content for the ideas pages using AI.
 * Run this with the Convex MCP server to generate seed content.
 *
 * Rate Limiting Strategy:
 * - Adds configurable delays between API calls
 * - Implements exponential backoff retry logic
 * - Processes designs sequentially to avoid overwhelming the API
 *
 * Usage with Convex MCP:
 * 1. Use mcp_convex_run to call this mutation
 * 2. Provide roomType, style, and seed count
 * 3. Script will generate designs with AI images (with delays to avoid rate limits)
 */

"use node";
import { createThread } from "@convex-dev/agent";
import { generateText } from "ai";
import { v } from "convex/values";
import { z } from "zod/v3";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { type ActionCtx, internalAction } from "./_generated/server";
import { designAgent } from "./agents/design";

// Rate limiting configuration
const DELAY_BETWEEN_API_CALLS_MS = 2000; // 2 seconds between each AI API call
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
  "living-room": {
    modern: {
      tags: ["clean-lines", "neutral-colors", "minimalist"],
      budgetRange: [budgetLivingModernMin, budgetLivingModernMax],
    },
    scandinavian: {
      tags: ["cozy", "light-wood", "neutral-tones"],
      budgetRange: [budgetLivingScandinavianMin, budgetLivingScandinavianMax],
    },
    bohemian: {
      tags: ["eclectic", "colorful", "textured"],
      budgetRange: [budgetLivingBohemianMin, budgetLivingBohemianMax],
    },
  },
  bedroom: {
    modern: {
      tags: ["serene", "minimal", "calming"],
      budgetRange: [budgetBedroomModernMin, budgetBedroomModernMax],
    },
    scandinavian: {
      tags: ["cozy", "hygge", "natural"],
      budgetRange: [budgetBedroomScandinavianMin, budgetBedroomScandinavianMax],
    },
    bohemian: {
      tags: ["layered", "textured", "earthy"],
      budgetRange: [budgetBedroomBohemianMin, budgetBedroomBohemianMax],
    },
  },
  "family-room": {
    modern: {
      tags: ["family-friendly", "durable", "comfortable"],
      budgetRange: [budgetFamilyModernMin, budgetFamilyModernMax],
    },
    traditional: {
      tags: ["warm", "inviting", "classic"],
      budgetRange: [budgetFamilyTraditionalMin, budgetFamilyTraditionalMax],
    },
    coastal: {
      tags: ["bright", "airy", "relaxed"],
      budgetRange: [budgetFamilyCoastalMin, budgetFamilyCoastalMax],
    },
  },
  kitchen: {
    modern: {
      tags: ["sleek", "functional", "clean"],
      budgetRange: [budgetKitchenModernMin, budgetKitchenModernMax],
    },
    scandinavian: {
      tags: ["light", "efficient", "warm-wood"],
      budgetRange: [budgetKitchenScandinavianMin, budgetKitchenScandinavianMax],
    },
    industrial: {
      tags: ["exposed", "metal", "concrete"],
      budgetRange: [budgetKitchenIndustrialMin, budgetKitchenIndustrialMax],
    },
  },
};

/**
 * Generate a unique design idea using the design agent (Claude)
 * Returns title, description, designPlan and optional tags.
 */
async function generateDesignIdea(
  ctx: ActionCtx,
  args: {
    roomType: string;
    designStyle: string;
    tags: string[];
    budget: number;
  }
): Promise<{
  title: string;
  description: string;
  designPlan: string;
  tags?: string[];
}> {
  const { roomType, designStyle, tags, budget } = args;
  const titleSeed = `${designStyle} ${roomType.replace("-", " ")} Concept`;

  const threadId = await createThread(ctx, components.agent, {
    title: `Seeding: ${titleSeed}`,
  });

  const { thread } = await designAgent.continueThread(ctx, { threadId });

  const { object: idea } = await thread.generateObject(
    {
      mode: "json",
      schemaDescription:
        "Generate a unique, shoppable interior design concept for the specified room type and style.",
      schema: z.object({
        title: z
          .string()
          .describe(
            "Catchy, specific title under 10 words (no generic phrases)"
          ),
        description: z
          .string()
          .describe(
            "2-3 sentence inspiring description tailored to the style and room"
          ),
        designPlan: z
          .string()
          .describe(
            "Markdown plan with sections: Style, Color Palette, Key Features, Tags"
          ),
        tags: z
          .array(z.string())
          .optional()
          .describe("Optional tags specific to this concept"),
      }),
      prompt: `Create a unique design idea. Room: ${roomType}. Style: ${designStyle}. Budget: $${budget}. Existing tags: ${tags.join(", ")}. Avoid generic phrasing. Output JSON only matching the schema.`,
    },
    { storageOptions: { saveMessages: "none" } }
  );

  return idea;
}

/**
 * Generate a single design with AI image
 */
export const generateSeedDesign = internalAction({
  args: {
    roomType: roomTypeValidator,
    designStyle: styleValidator,
    featured: v.optional(v.boolean()),
  },
  returns: v.id("designs"),
  handler: async (ctx, args) => {
    // Get template data
    const defaultBudgetMin = 2000;
    const defaultBudgetMax = 5000;

    const roomTemplates =
      DESIGN_TEMPLATES[args.roomType as keyof typeof DESIGN_TEMPLATES];

    const template = roomTemplates?.[
      args.designStyle as keyof typeof roomTemplates
    ] ?? {
      tags: ["stylish", "functional"],
      budgetRange: [defaultBudgetMin, defaultBudgetMax],
    };

    // Generate random budget in range
    const budget =
      Math.floor(
        Math.random() * (template.budgetRange[1] - template.budgetRange[0] + 1)
      ) + template.budgetRange[0];

    // Create title
    const roomLabel = args.roomType
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    const styleLabel =
      args.designStyle.charAt(0).toUpperCase() + args.designStyle.slice(1);
    const title = `${styleLabel} ${roomLabel} Design`;

    // Generate a unique idea (title, description, plan) using the design agent (Claude)
    const idea = await retryWithBackoff(() =>
      generateDesignIdea(ctx, {
        roomType: args.roomType,
        designStyle: args.designStyle,
        tags: template.tags,
        budget,
      })
    );

    const description = idea.description;
    const designPlan = idea.designPlan;
    const generatedTitle = idea.title;

    // Delay before next API call
    await sleep(DELAY_BETWEEN_API_CALLS_MS);

    // Generate design visualization image with retry logic
    const imagePrompt = `Create a photorealistic interior design image of a ${args.roomType.replace("-", " ")}.

Style: ${args.designStyle}
Design Elements: ${designPlan}

Make it look realistic, well-lit, and professionally styled. The composition should show how all elements work together harmoniously in the space.`;

    const imageResult = await retryWithBackoff(() =>
      generateText({
        model: "google/gemini-2.5-flash-image",
        providerOptions: {
          google: { responseModalities: ["TEXT", "IMAGE"] },
        },
        prompt: imagePrompt,
      })
    );

    // Extract the generated image from the response
    const firstStep = imageResult.steps?.[0];
    if (!firstStep) {
      throw new Error("Failed to generate image: No steps in response");
    }

    // Find the first image file in the response
    const imageFile = firstStep.content
      .filter((item) => item.type === "file")
      .map((item) => (item.type === "file" ? item.file : null))
      .find((file) => file?.mediaType?.startsWith("image/"));

    if (!imageFile) {
      throw new Error(
        "Failed to generate image: No image files found in response"
      );
    }

    // Convert Uint8Array to Blob for storage
    const imageData = new Uint8Array(imageFile.uint8Array);
    const blob = new Blob([imageData], {
      type: imageFile.mediaType,
    });

    const imageStorageId = await ctx.storage.store(blob);

    if (!imageStorageId) {
      throw new Error("Failed to store generated image: Storage returned null");
    }

    const defaultLikes = 20;
    const defaultViews = 100;

    // Create the design with generated image
    const design: { _id: Id<"designs"> } = await ctx.runMutation(
      internal.designs.create,
      {
        title: generatedTitle || title,
        description,
        designPlan,
        budget,
        roomType: args.roomType,
        designStyle: args.designStyle,
        tags: idea.tags && idea.tags.length > 0 ? idea.tags : template.tags,
        isPublic: true,
        featured: args.featured ?? false,
        likes: Math.floor(Math.random() * defaultLikes),
        views: Math.floor(Math.random() * defaultViews),
        imageStorageId,
      }
    );

    return design._id;
  },
});

/**
 * Batch seed designs for a room type
 */

export const seedRoomDesigns = internalAction({
  args: {
    roomType: roomTypeValidator,
    count: v.optional(v.number()),
    featured: v.optional(v.boolean()),
  },
  returns: v.array(v.id("designs")),
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
    for (let i = 0; i < count; i++) {
      const style = styles[i % styles.length];

      const designId: Id<"designs"> = await ctx.runAction(
        internal.seedDesigns.generateSeedDesign,
        {
          roomType: args.roomType,
          designStyle: style,
          featured: args.featured ?? i < featuredCount,
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
});

/**
 * Seed all room types with designs
 */

export const seedAllRooms = internalAction({
  args: {
    designsPerRoom: v.optional(v.number()),
  },
  returns: v.object({
    totalDesigns: v.number(),
    roomsSeeded: v.number(),
  }),
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

    for (let i = 0; i < roomTypes.length; i++) {
      const roomType = roomTypes[i];

      const designs = await ctx.runAction(
        internal.seedDesigns.seedRoomDesigns,
        {
          roomType,
          count: designsPerRoom,
          featured: true,
        }
      );
      totalDesigns += designs.length;

      // Delay between room types (except after last room)
      if (i < roomTypes.length - 1) {
        await sleep(DELAY_BETWEEN_DESIGNS_MS);
      }
    }

    return {
      totalDesigns,
      roomsSeeded: roomTypes.length,
    };
  },
});

/**
 * Generate a single design (safest option for rate limiting)
 *
 * This is the recommended way to seed designs one at a time
 * to avoid rate limits entirely.
 */
export const generateSingleDesign = internalAction({
  args: {
    roomType: roomTypeValidator,
    style: styleValidator,
    featured: v.optional(v.boolean()),
  },
  returns: v.object({
    designId: v.id("designs"),
    title: v.string(),
    roomType: roomTypeValidator,
    style: styleValidator,
  }),
  handler: async (ctx, args) => {
    const designId: Id<"designs"> = await ctx.runAction(
      internal.seedDesigns.generateSeedDesign,
      {
        roomType: args.roomType,
        designStyle: args.style,
        featured: args.featured ?? false,
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
      title,
      roomType: args.roomType,
      style: args.style,
    };
  },
});

/**
 * USAGE RECOMMENDATIONS:
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
 *    This will take ~30 seconds per design with built-in delays.
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
 *    This will take several minutes but will complete without rate limits.
 *
 * RATE LIMIT CONFIGURATION:
 * - DELAY_BETWEEN_API_CALLS_MS: 2000ms (2 seconds between each AI call)
 * - DELAY_BETWEEN_DESIGNS_MS: 8000ms (8 seconds between each design)
 * - Each design makes 3 AI calls, so total time per design: ~14 seconds
 * - Adjust these constants at the top of the file if you hit rate limits
 */
