/**
 * Generate Design Image Tool
 *
 * Uses Google Gemini Flash to generate photorealistic interior design images.
 * Can create new images or modify existing ones based on design specifications.
 */
"use node";
import { createTool, type ToolCtx } from "@convex-dev/agent";
import { gateway, generateText } from "ai";
import z from "zod";
import type { Id } from "../../_generated/dataModel";

const URL_PATTERN = /https?:\/\/[^\s]+/;

const productSchema = z.object({
  name: z.string().describe("Product name"),
  description: z.string().optional().describe("Product description"),
});

/**
 * Generates a design visualization image using Google Gemini Flash
 */
// biome-ignore lint/style/useNamingConvention: OpenAI tool names use snake_case
export const generate_design_image = createTool({
  description:
    "Generate a photorealistic interior design image using Google Gemini Flash. Creates visualizations based on room type, style, design plan, and optional product placements. Returns the storage ID of the generated image.",
  args: z.object({
    roomType: z
      .string()
      .describe("Type of room to visualize (e.g., living room, bedroom)"),
    style: z
      .string()
      .describe(
        "Design style for the image (e.g., modern, minimalist, bohemian)"
      ),
    designPlan: z
      .string()
      .describe(
        "Detailed description of design elements: colors, layout, materials, lighting, atmosphere"
      ),
    products: z
      .array(productSchema)
      .optional()
      .describe(
        "Optional list of products to naturally place in the room visualization"
      ),
    baseImageStorageId: z
      .string()
      .optional()
      .describe(
        "Optional storage ID of an existing image to use as reference or starting point (e.g., user-uploaded room photo)"
      ),
  }),
  handler: async (ctx: ToolCtx, args) => {
    const imagePromptBase = args.baseImageStorageId
      ? "Edit and enhance this interior design space based on the uploaded image."
      : `Create a photorealistic interior design image of a ${args.roomType}.`;

    const productsDescription =
      args.products && args.products.length > 0
        ? `\n\nInclude these products naturally placed in the room:\n${args.products.map((p, i) => `${i + 1}. ${p.name}${p.description ? ` - ${p.description}` : ""}`).join("\n")}`
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

    // Extract and store the generated image
    const imageUrl = imageResult.text.match(URL_PATTERN)?.[0];
    if (!imageUrl) {
      throw new Error(
        "Failed to generate image: No image URL found in response"
      );
    }

    let imageStorageId: Id<"_storage"> | null = null;

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
      imageStorageId = await ctx.storage.store(blob);
    } catch (error) {
      throw new Error(
        `Failed to store generated image: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    if (!imageStorageId) {
      throw new Error("Failed to store generated image: Storage returned null");
    }

    return {
      storageId: imageStorageId,
      message: "Design image generated successfully",
    };
  },
});
