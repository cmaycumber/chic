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

/**
 * Convert a Blob to a base64 data URL
 */
async function blobToDataUrl(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  const base64 = btoa(binary);
  const mimeType = blob.type || "image/png";
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Collect all reference images from various sources
 */
async function collectReferenceImages(
  ctx: ToolCtx,
  args: {
    baseImageStorageId?: string;
    products?: Array<{ imageUrl?: string }>;
    referenceImageUrls?: string[];
  }
): Promise<Array<{ type: "image"; image: string }>> {
  const referenceImages: Array<{ type: "image"; image: string }> = [];

  // Add base image if provided (from storage)
  if (args.baseImageStorageId) {
    const baseImageBlob = await ctx.storage.get(args.baseImageStorageId);
    if (baseImageBlob) {
      const dataUrl = await blobToDataUrl(baseImageBlob);
      referenceImages.push({
        type: "image",
        image: dataUrl,
      });
    }
  }

  // Add product images
  if (args.products) {
    for (const product of args.products) {
      if (product.imageUrl) {
        referenceImages.push({
          type: "image",
          image: product.imageUrl,
        });
      }
    }
  }

  // Add additional reference images
  if (args.referenceImageUrls) {
    for (const url of args.referenceImageUrls) {
      referenceImages.push({
        type: "image",
        image: url,
      });
    }
  }

  return referenceImages;
}

const productSchema = z.object({
  name: z.string().describe("Product name"),
  description: z.string().optional().describe("Product description"),
  imageUrl: z
    .string()
    .optional()
    .describe("Product image URL to use as reference"),
});

/**
 * Generates a design visualization image using Google Gemini Flash
 */
// biome-ignore lint/style/useNamingConvention: OpenAI tool names use snake_case
export const generate_design_image = createTool({
  description:
    "Generate a photorealistic interior design image using Google Gemini Flash. Creates visualizations based on room type, style, design plan, and optional product placements. Prefer to include product images and existing design images as references for better results. Returns the storage ID of the generated image.",
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
        "Optional list of products with their images to naturally place in the room visualization. Include imageUrl when available for better visual reference."
      ),
    baseImageStorageId: z
      .string()
      .optional()
      .describe(
        "Optional storage ID of an existing design image to use as reference or starting point (e.g., previous design iteration or user-uploaded room photo)"
      ),
    referenceImageUrls: z
      .array(z.string())
      .optional()
      .describe(
        "Optional array of additional reference image URLs (e.g., product images, inspiration photos)"
      ),
  }),
  handler: async (ctx: ToolCtx, args) => {
    // Collect all reference images
    const referenceImages = await collectReferenceImages(ctx, args);

    const imagePromptBase =
      args.baseImageStorageId || referenceImages.length > 0
        ? "Create an interior design visualization incorporating elements from the reference images provided."
        : `Create a photorealistic interior design image of a ${args.roomType}.`;

    const productsDescription =
      args.products && args.products.length > 0
        ? `\n\nInclude these products naturally placed in the room:\n${args.products.map((p, i) => `${i + 1}. ${p.name}${p.description ? ` - ${p.description}` : ""}`).join("\n")}`
        : "";

    const imagePrompt = `${imagePromptBase}

Style: ${args.style}
Design Elements: ${args.designPlan}${productsDescription}

Make it look realistic, well-lit, and professionally styled. The composition should show how all elements work together harmoniously in the space.`;

    // Build multimodal messages with images and text
    const messages: Array<
      { type: "text"; text: string } | { type: "image"; image: string }
    > = [...referenceImages, { type: "text", text: imagePrompt }];

    // Use Google Gemini Flash for image generation
    const imageResult = await generateText({
      model: gateway.languageModel("google/gemini-2.5-flash-image"),
      providerOptions: {
        google: { responseModalities: ["TEXT", "IMAGE"] },
      },
      messages: [
        {
          role: "user",
          content: messages,
        },
      ],
    });

    // Extract all generated images from the steps content
    // Images are in steps[0].content as content items with type: 'file'
    const firstStep = imageResult.steps?.[0];
    if (!firstStep) {
      throw new Error("Failed to generate image: No steps in response");
    }

    // Find all file content items that are images
    const imageFiles = firstStep.content
      .filter((item) => item.type === "file")
      .map((item) => (item.type === "file" ? item.file : null))
      .filter((file) => file?.mediaType?.startsWith("image/"));

    if (imageFiles.length === 0) {
      throw new Error(
        "Failed to generate image: No image files found in response"
      );
    }

    // Store all generated images
    const storageIds: string[] = [];

    for (const generatedImage of imageFiles) {
      if (!generatedImage) {
        continue;
      }

      // Convert Uint8Array to Blob for storage
      // Create a new Uint8Array to ensure proper typing
      const imageData = new Uint8Array(generatedImage.uint8Array);
      const blob = new Blob([imageData], {
        type: generatedImage.mediaType,
      });

      const imageStorageId = await ctx.storage.store(blob);

      if (!imageStorageId) {
        throw new Error(
          "Failed to store generated image: Storage returned null"
        );
      }

      storageIds.push(imageStorageId);
    }

    return {
      storageIds,
      message: `Successfully generated ${storageIds.length} design image${storageIds.length > 1 ? "s" : ""}`,
    };
  },
});
