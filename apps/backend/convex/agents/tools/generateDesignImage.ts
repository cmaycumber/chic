/**
 * Generate Design Image Tool
 *
 * Creates composite interior design visualizations by combining multiple reference images:
 * - User-uploaded room photos (the space to redesign)
 * - Product images from search results (furniture/decor to place)
 * - Previous design images (for iterative refinement)
 * - Style/inspiration reference images
 *
 * The tool merges all inputs into a single cohesive output image.
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
import { imageGenProductSchema } from "./index";

const IMAGE_MODEL = "google/gemini-3-pro-image-preview";
const MAX_REFERENCE_IMAGES = 10;
const ERROR_PREVIEW_LENGTH = 200;

/**
 * AI SDK 7 file part. Image parts (`{ type: "image", image }`) are deprecated;
 * `data` accepts the same URL / data-URL strings and `mediaType` may be the
 * bare top-level IANA segment when the concrete subtype is unknown.
 */
interface ImageFilePart {
  data: string;
  mediaType: string;
  type: "file";
}

/**
 * Convert a Convex storage blob to a base64 data URL
 */
async function storageIdToDataUrl(
  ctx: { storage: { get: (id: string) => Promise<Blob | null> } },
  storageId: string
): Promise<string | null> {
  const blob = await ctx.storage.get(storageId);
  if (!blob) {
    return null;
  }

  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  // biome-ignore lint/style/useForOf: Uint8Array iteration requires index-based loop
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  const mimeType = blob.type || "image/png";
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Collect all reference images from various sources with deduplication
 * Handles both URLs and Convex storage IDs
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Multiple image sources require sequential processing
async function collectReferenceImages(
  ctx: { storage: { get: (id: string) => Promise<Blob | null> } },
  args: {
    roomImageUrl?: string;
    baseImageStorageIds?: string[];
    products?: Array<{ imageUrl?: string }>;
    referenceImageUrls?: string[];
  }
): Promise<ImageFilePart[]> {
  const referenceImages: ImageFilePart[] = [];
  const seenUrls = new Set<string>();

  // 1. Add room image if provided (user's uploaded space) - highest priority
  if (args.roomImageUrl) {
    referenceImages.push({
      data: args.roomImageUrl,
      mediaType: "image",
      type: "file",
    });
    seenUrls.add(args.roomImageUrl);
  }

  // 2. Add base images from storage (previous designs to iterate on)
  if (args.baseImageStorageIds) {
    for (const storageId of args.baseImageStorageIds) {
      if (referenceImages.length >= MAX_REFERENCE_IMAGES) {
        break;
      }
      // biome-ignore lint/performance/noAwaitInLoops: must stay sequential to respect the MAX_REFERENCE_IMAGES early-exit and de-dup against images already collected
      const dataUrl = await storageIdToDataUrl(ctx, storageId);
      if (dataUrl && !seenUrls.has(dataUrl)) {
        referenceImages.push({
          data: dataUrl,
          mediaType: "image",
          type: "file",
        });
        seenUrls.add(dataUrl);
      }
    }
  }

  // 3. Add product images (furniture/decor to place in the design)
  if (args.products) {
    for (const product of args.products) {
      if (
        product.imageUrl &&
        !seenUrls.has(product.imageUrl) &&
        referenceImages.length < MAX_REFERENCE_IMAGES
      ) {
        referenceImages.push({
          data: product.imageUrl,
          mediaType: "image",
          type: "file",
        });
        seenUrls.add(product.imageUrl);
      }
    }
  }

  // 4. Add additional reference images (inspiration, style references)
  if (args.referenceImageUrls) {
    for (const url of args.referenceImageUrls) {
      if (!seenUrls.has(url) && referenceImages.length < MAX_REFERENCE_IMAGES) {
        referenceImages.push({
          data: url,
          mediaType: "image",
          type: "file",
        });
        seenUrls.add(url);
      }
    }
  }

  return referenceImages;
}

/**
 * Generates a composite design visualization by combining multiple reference images
 */
// biome-ignore lint/style/useNamingConvention: OpenAI tool names use snake_case
export const generate_design_image = createTool({
  description:
    "Create a composite interior design image from multiple references. Combines user's room photo, product images, and style references into one cohesive visualization. Use baseImageStorageIds to iterate on previous designs. Returns storageIds for generated images.",
  execute: async (ctx: ToolCtx, args) => {
    // Collect all reference images (handles both URLs and storage IDs)
    const referenceImages = await collectReferenceImages(ctx, {
      baseImageStorageIds: args.baseImageStorageIds,
      products: args.products,
      referenceImageUrls: args.referenceImageUrls,
      roomImageUrl: args.roomImageUrl,
    });

    const hasReferences =
      args.roomImageUrl ||
      args.baseImageStorageIds?.length ||
      referenceImages.length > 0;

    const productsSection =
      args.products && args.products.length > 0
        ? `

FURNITURE & DECOR TO INCLUDE:
${args.products.map((p, i) => `${i + 1}. ${p.name}${p.description ? `: ${p.description}` : ""}`).join("\n")}

Place each item naturally in the space with proper scale and positioning. If product reference images are provided, match their appearance accurately.`
        : "";

    // Build context-aware prompt based on what references are provided
    const referenceContext: string[] = [];
    if (args.roomImageUrl) {
      referenceContext.push(
        "The first image is the user's actual room - preserve its layout, dimensions, and architectural features while transforming the decor."
      );
    }
    if (args.baseImageStorageIds?.length) {
      referenceContext.push(
        "Previous design iterations are included - build upon them while incorporating the requested changes."
      );
    }
    if (args.products?.length) {
      referenceContext.push(
        "Product reference images show the exact furniture/decor to place - match their appearance accurately."
      );
    }

    const imagePrompt = `Create a composite interior design visualization for a ${args.roomType}.

STYLE: ${args.style}

DESIGN SPECIFICATIONS:
${args.designPlan}${productsSection}

${hasReferences ? `REFERENCE IMAGE GUIDANCE:\n${referenceContext.join("\n")}\n\nCombine all reference images into ONE cohesive final design. The output should seamlessly blend the room structure, furniture pieces, and style references into a unified visualization.` : ""}

RENDERING REQUIREMENTS:
- Photorealistic quality with natural lighting
- Proper perspective and spatial proportions
- High-end interior photography composition
- Cohesive color palette throughout
- Realistic material textures (fabric, wood, metal, etc.)
- Seamless integration of all referenced elements`;

    // Build multimodal messages with images and text
    const messages: Array<{ type: "text"; text: string } | ImageFilePart> = [
      ...referenceImages,
      { text: imagePrompt, type: "text" },
    ];

    // Use Google Gemini 3 Pro for high-quality image generation
    const imageResult = await generateText({
      messages: [
        {
          content: messages,
          role: "user",
        },
      ],
      model: gateway.languageModel(IMAGE_MODEL),
      providerOptions: {
        google: { responseModalities: ["TEXT", "IMAGE"] },
      },
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
        `Image generation did not produce images. The model returned: ${textContent.slice(0, ERROR_PREVIEW_LENGTH) || "no explanation"}`
      );
    }

    // Store all generated images
    type StoreResult =
      | { ok: true; storageId: string }
      | { ok: false; error: string };

    const storeResults: StoreResult[] = await Promise.all(
      imageFiles.map(async (generatedImage): Promise<StoreResult> => {
        if (!generatedImage?.uint8Array) {
          return { error: "Skipped image with missing data", ok: false };
        }

        try {
          // Convert Uint8Array to Blob for storage
          const imageData = new Uint8Array(generatedImage.uint8Array);
          const blob = new Blob([imageData], {
            type: generatedImage.mediaType,
          });

          const imageStorageId = await ctx.storage.store(blob);

          if (imageStorageId) {
            return { ok: true, storageId: imageStorageId };
          }
          return { error: "Storage returned null for an image", ok: false };
        } catch (storeError) {
          return {
            error: `Failed to store image: ${storeError instanceof Error ? storeError.message : "unknown error"}`,
            ok: false,
          };
        }
      })
    );

    const storageIds: string[] = [];
    const errors: string[] = [];
    for (const result of storeResults) {
      if (result.ok) {
        storageIds.push(result.storageId);
      } else {
        errors.push(result.error);
      }
    }

    if (storageIds.length === 0) {
      throw new Error(
        `Failed to store any generated images. Errors: ${errors.join("; ")}`
      );
    }

    const result = {
      message: `Successfully generated ${storageIds.length} design image${storageIds.length > 1 ? "s" : ""}`,
      storageIds,
      ...(errors.length > 0 && { warnings: errors }),
    };

    return result;
  },
  inputSchema: z.object({
    baseImageStorageIds: z
      .array(z.string())
      .optional()
      .describe(
        "Convex storage IDs of previous design images to iterate on. Use when refining an existing design."
      ),
    designPlan: z
      .string()
      .describe(
        "Detailed vision: color palette, furniture arrangement, materials, lighting mood, and spatial layout"
      ),
    products: z
      .array(imageGenProductSchema)
      .optional()
      .describe(
        "Products to place in the visualization. Include imageUrl for each - these will be composited into the scene."
      ),
    referenceImageUrls: z
      .array(z.string())
      .optional()
      .describe(
        "Additional reference URLs: inspiration photos, style references, mood boards. These guide the overall aesthetic."
      ),
    roomImageUrl: z
      .string()
      .optional()
      .describe(
        "URL to user's uploaded room photo - the actual space to redesign. This is the PRIMARY reference."
      ),
    roomType: z
      .string()
      .describe("Room type: living room, bedroom, kitchen, etc."),
    style: z
      .string()
      .describe("Design aesthetic: modern, scandinavian, bohemian, etc."),
  }),
});
