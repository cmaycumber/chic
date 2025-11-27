/**
 * Generate Design Image Tool
 *
 * Uses Google Gemini 3 Pro to generate photorealistic interior design images.
 * Can create new images or modify existing ones based on design specifications.
 *
 * Model: gemini-3-pro-image-preview
 * - Latest generation image model with highest quality outputs
 * - Superior understanding of complex spatial relationships
 * - Excellent product placement and realistic lighting
 * - Best-in-class prompt adherence for interior design
 */
"use node";
import { createTool, type ToolCtx } from "@convex-dev/agent";
import { gateway, generateText } from "ai";
import z from "zod";

const IMAGE_MODEL = "google/gemini-3-pro-image-preview";
const MAX_REFERENCE_IMAGES = 10;
const ERROR_PREVIEW_LENGTH = 200;

/**
 * Convert a Blob to a base64 data URL
 */
async function blobToDataUrl(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  // biome-ignore lint/style/useForOf: Uint8Array iteration requires index-based loop for TypeScript compatibility
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  const mimeType = blob.type || "image/png";
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Collect all reference images from various sources with deduplication
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Image collection requires multiple source handling
async function collectReferenceImages(
  ctx: ToolCtx,
  args: {
    baseImageStorageId?: string;
    products?: Array<{ imageUrl?: string }>;
    referenceImageUrls?: string[];
  }
): Promise<Array<{ type: "image"; image: string }>> {
  const referenceImages: Array<{ type: "image"; image: string }> = [];
  const seenUrls = new Set<string>();

  // Add base image if provided (from storage) - this gets priority
  if (args.baseImageStorageId) {
    try {
      const baseImageBlob = await ctx.storage.get(args.baseImageStorageId);
      if (baseImageBlob) {
        const dataUrl = await blobToDataUrl(baseImageBlob);
        referenceImages.push({
          type: "image",
          image: dataUrl,
        });
        seenUrls.add(dataUrl);
      }
    } catch {
      // Silently continue if base image load fails
    }
  }

  // Add product images (deduplicated)
  if (args.products) {
    for (const product of args.products) {
      if (
        product.imageUrl &&
        !seenUrls.has(product.imageUrl) &&
        referenceImages.length < MAX_REFERENCE_IMAGES
      ) {
        referenceImages.push({
          type: "image",
          image: product.imageUrl,
        });
        seenUrls.add(product.imageUrl);
      }
    }
  }

  // Add additional reference images (deduplicated)
  if (args.referenceImageUrls) {
    for (const url of args.referenceImageUrls) {
      if (!seenUrls.has(url) && referenceImages.length < MAX_REFERENCE_IMAGES) {
        referenceImages.push({
          type: "image",
          image: url,
        });
        seenUrls.add(url);
      }
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
 * Generates a design visualization image using Google Gemini 3 Pro
 */
// biome-ignore lint/style/useNamingConvention: OpenAI tool names use snake_case
export const generate_design_image = createTool({
  description:
    "Generate photorealistic interior design visualization. Pass product imageUrls for accurate furniture placement. Use baseImageStorageId when iterating on existing designs. Returns storageIds for the generated images.",
  args: z.object({
    roomType: z
      .string()
      .describe("Room type: living room, bedroom, kitchen, etc."),
    style: z
      .string()
      .describe("Design aesthetic: modern, scandinavian, bohemian, etc."),
    designPlan: z
      .string()
      .describe(
        "Detailed vision: color palette, furniture arrangement, materials, lighting mood, and spatial layout"
      ),
    products: z
      .array(productSchema)
      .optional()
      .describe(
        "Products to place in the visualization. Include imageUrl for each product."
      ),
    baseImageStorageId: z
      .string()
      .optional()
      .describe(
        "Storage ID from existing design to iterate on or user-uploaded room photo"
      ),
    referenceImageUrls: z
      .array(z.string())
      .optional()
      .describe(
        "Additional reference URLs: inspiration photos, product images, style references"
      ),
  }),
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Image generation requires complex multimodal handling
  handler: async (ctx: ToolCtx, args) => {
    // Collect all reference images
    const referenceImages = await collectReferenceImages(ctx, args);

    const hasReferences = args.baseImageStorageId || referenceImages.length > 0;

    const productsSection =
      args.products && args.products.length > 0
        ? `

FURNITURE & DECOR TO INCLUDE:
${args.products.map((p, i) => `${i + 1}. ${p.name}${p.description ? `: ${p.description}` : ""}`).join("\n")}

Place each item naturally in the space with proper scale and positioning. If product reference images are provided, match their appearance accurately.`
        : "";

    const imagePrompt = `Generate a professional interior design photograph of a ${args.roomType}.

STYLE: ${args.style}

DESIGN SPECIFICATIONS:
${args.designPlan}${productsSection}

${hasReferences ? "Use the reference images provided to guide the design, matching colors, textures, and furniture styles shown." : ""}

RENDERING REQUIREMENTS:
- Photorealistic quality with natural lighting
- Proper perspective and spatial proportions
- High-end interior photography composition
- Cohesive color palette throughout
- Realistic material textures (fabric, wood, metal, etc.)`;

    // Build multimodal messages with images and text
    const messages: Array<
      { type: "text"; text: string } | { type: "image"; image: string }
    > = [...referenceImages, { type: "text", text: imagePrompt }];

    // Use Google Gemini 3 Pro for high-quality image generation
    const imageResult = await generateText({
      model: gateway.languageModel(IMAGE_MODEL),
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
      throw new Error(
        "Image generation failed: No response steps. This may indicate a model error or rate limit."
      );
    }

    // Find all file content items that are images
    const imageFiles = firstStep.content
      .filter((item) => item.type === "file")
      .map((item) => (item.type === "file" ? item.file : null))
      .filter((file) => file?.mediaType?.startsWith("image/"));

    if (imageFiles.length === 0) {
      // Check if there's text content that might explain the failure
      const textContent = firstStep.content
        .filter((item) => item.type === "text")
        .map((item) => (item.type === "text" ? item.text : ""))
        .join("\n");
      throw new Error(
        `Image generation did not produce images. The model returned: ${textContent.substring(0, ERROR_PREVIEW_LENGTH) || "no explanation"}`
      );
    }

    // Store all generated images
    const storageIds: string[] = [];
    const errors: string[] = [];

    for (const generatedImage of imageFiles) {
      if (!generatedImage?.uint8Array) {
        errors.push("Skipped image with missing data");
        continue;
      }

      try {
        // Convert Uint8Array to Blob for storage
        const imageData = new Uint8Array(generatedImage.uint8Array);
        const blob = new Blob([imageData], {
          type: generatedImage.mediaType,
        });

        const imageStorageId = await ctx.storage.store(blob);

        if (imageStorageId) {
          storageIds.push(imageStorageId);
        } else {
          errors.push("Storage returned null for an image");
        }
      } catch (storeError) {
        errors.push(
          `Failed to store image: ${storeError instanceof Error ? storeError.message : "unknown error"}`
        );
      }
    }

    if (storageIds.length === 0) {
      throw new Error(
        `Failed to store any generated images. Errors: ${errors.join("; ")}`
      );
    }

    const result = {
      storageIds,
      message: `Successfully generated ${storageIds.length} design image${storageIds.length > 1 ? "s" : ""}`,
      ...(errors.length > 0 && { warnings: errors }),
    };

    return result;
  },
});
