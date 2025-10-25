/**
 * Public Tools API
 *
 * Public endpoints for frontend tools like the AI Room Designer
 */
"use node";
import { gateway, generateText } from "ai";
import { v } from "convex/values";
import { action } from "./_generated/server";

/**
 * Generate a design image using Google Gemini Flash
 *
 * This public action allows the frontend to generate photorealistic interior design images
 * by transforming an uploaded room photo based on a description of desired changes.
 */
export const generateDesignImage = action({
  args: {
    imageStorageId: v.string(),
    description: v.string(),
  },
  returns: v.object({
    storageIds: v.array(v.string()),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get the uploaded image from storage
    const imageUrl = await ctx.storage.getUrl(args.imageStorageId);
    if (!imageUrl) {
      throw new Error("Failed to get image URL from storage");
    }

    const imagePrompt = `Transform this interior design space based on the following description:

${args.description}

Make it look realistic, well-lit, and professionally styled. Maintain the room's layout and architecture while applying the requested design changes.`;

    // Fetch the image data
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString("base64");
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

    // Use Google Gemini Flash for image generation with the uploaded image
    const imageResult = await generateText({
      model: gateway.languageModel("google/gemini-2.5-flash-image"),
      providerOptions: {
        google: { responseModalities: ["TEXT", "IMAGE"] },
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: `data:${mimeType};base64,${imageBase64}`,
            },
            {
              type: "text",
              text: imagePrompt,
            },
          ],
        },
      ],
    });

    // Extract all generated images from the steps content
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
