/**
 * AI actions for rooms.
 *
 * - applyComment: edit the current room image according to a user comment.
 * - detectItems: find furniture / decor in an image with bounding boxes.
 * - searchItemProducts: fetch Amazon products for a detected item.
 *
 * Required Convex environment variables:
 * - AI_GATEWAY_API_KEY: Vercel AI Gateway (Muse Image edits the photo,
 *   Gemini 3.1 Flash Lite detects furniture; override with ROOM_EDIT_MODEL
 *   and ROOM_DETECT_MODEL)
 * - OPENAI_API_KEY: only needed when ROOM_EDIT_MODEL is an openai/ model
 * - SERPAPI_API_KEY: Amazon product search
 */
"use node";
import { createOpenAI } from "@ai-sdk/openai";
import { gateway, generateImage, generateObject } from "ai";
import { v } from "convex/values";
import z from "zod";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { type ActionCtx, internalAction } from "./_generated/server";
import { type AmazonProduct, searchAmazon } from "./lib/amazonSearch";
import { privateAction } from "./lib/utils";
import { vProduct } from "./schema";

/** Gateway id of the model that renders comment edits (override with ROOM_EDIT_MODEL). */
const DEFAULT_IMAGE_EDIT_MODEL = "meta/muse-image-1.0";
const OPENAI_PREFIX = "openai/";
/** Gateway id of the vision model that finds furniture (override with ROOM_DETECT_MODEL). */
const DEFAULT_DETECTION_MODEL = "google/gemini-3.5-flash-lite";
const MAX_ITEMS = 12;
const PRODUCTS_PER_ITEM = 6;
const BOX_SCALE = 1000;
const PERCENT = 100;
const ERROR_PREVIEW_LENGTH = 200;
const OUTPUT_COMPRESSION = 82;

interface StorageCtx {
  storage: { get: (id: Id<"_storage">) => Promise<Blob | null> };
}

/** Load a stored image as a base64 data URL for multimodal prompts. */
async function storageToDataUrl(
  ctx: StorageCtx,
  storageId: Id<"_storage">
): Promise<string> {
  const blob = await ctx.storage.get(storageId);
  if (!blob) {
    throw new Error("Image not found in storage");
  }
  const base64 = Buffer.from(await blob.arrayBuffer()).toString("base64");
  const mimeType = blob.type || "image/jpeg";
  return `data:${mimeType};base64,${base64}`;
}

const LOWER_THIRD = 33;
const UPPER_THIRD = 66;

function pickThird(value: number, low: string, mid: string, high: string) {
  if (value < LOWER_THIRD) {
    return low;
  }
  if (value > UPPER_THIRD) {
    return high;
  }
  return mid;
}

/** Load a stored image's raw bytes for image-editing models. */
async function storageToBytes(
  ctx: StorageCtx,
  storageId: Id<"_storage">
): Promise<Uint8Array> {
  const blob = await ctx.storage.get(storageId);
  if (!blob) {
    throw new Error("Image not found in storage");
  }
  return new Uint8Array(await blob.arrayBuffer());
}

interface AnchorPoint {
  x: number;
  y: number;
}

interface AnchoredItem {
  box: { height: number; width: number; x: number; y: number };
  description: string;
  label: string;
}

/**
 * The detected item under a pin: the smallest bounding box containing it.
 * Lets the prompt name the object ("the sofa") instead of only a location.
 */
function findAnchoredItem(
  items: AnchoredItem[] | undefined,
  anchor: AnchorPoint
): AnchoredItem | null {
  let best: AnchoredItem | null = null;
  for (const item of items ?? []) {
    const { box } = item;
    const inside =
      anchor.x >= box.x &&
      anchor.x <= box.x + box.width &&
      anchor.y >= box.y &&
      anchor.y <= box.y + box.height;
    if (!inside) {
      continue;
    }
    const area = box.width * box.height;
    if (!best || area < best.box.width * best.box.height) {
      best = item;
    }
  }
  return best;
}

function describeAnchor(anchor?: AnchorPoint, item?: AnchoredItem | null) {
  if (!anchor) {
    return "";
  }
  const x = Math.round(anchor.x * PERCENT);
  const y = Math.round(anchor.y * PERCENT);
  const horizontal = pickThird(x, "left", "center", "right");
  const vertical = pickThird(y, "top", "middle", "bottom");
  const where = `The comment is pinned at ${x}% from the left edge and ${y}% from the top of the photo (the ${vertical}-${horizontal} area).`;
  if (!item) {
    return `${where} Apply the change to whatever object is at that exact spot and leave the rest untouched.`;
  }
  const left = Math.round(item.box.x * PERCENT);
  const right = Math.round((item.box.x + item.box.width) * PERCENT);
  const top = Math.round(item.box.y * PERCENT);
  const bottom = Math.round((item.box.y + item.box.height) * PERCENT);
  return `${where} That spot is on the ${item.label} (${item.description}), which occupies the region from ${left}% to ${right}% horizontally and ${top}% to ${bottom}% vertically. The comment is about that object: apply the change to it and leave everything else untouched.`;
}

function buildEditPrompt(
  text: string,
  anchor?: AnchorPoint,
  item?: AnchoredItem | null
) {
  return `You are editing a photo of a real room for an interior design app.

The user left this comment on the photo:
"${text}"

${describeAnchor(anchor, item)}

Apply exactly what the comment asks for and nothing else. Keep the camera angle, room layout, architecture, windows, flooring, lighting direction and everything the comment does not mention identical to the input photo. The result must be photorealistic and look like the same photo with only the requested change.`;
}

/**
 * Resolve the edit model. OpenAI models go through the OpenAI provider when
 * its key is present, because the AI Gateway drops image provider options
 * (WebP output). Everything else, e.g. `meta/muse-image-1.0`, uses the gateway.
 */
function imageEditModel() {
  const modelId = process.env.ROOM_EDIT_MODEL || DEFAULT_IMAGE_EDIT_MODEL;
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && modelId.startsWith(OPENAI_PREFIX)) {
    return createOpenAI({ apiKey }).image(modelId.slice(OPENAI_PREFIX.length));
  }
  return gateway.imageModel(modelId);
}

/**
 * Run the image model and store the first image it returns.
 * Throws with the model's text if no image is produced.
 */
async function renderEdit(
  ctx: ActionCtx,
  baseImage: Uint8Array,
  prompt: string
): Promise<Id<"_storage">> {
  const startedAt = Date.now();
  const result = await generateImage({
    model: imageEditModel(),
    prompt: { images: [baseImage], text: prompt },
    providerOptions: {
      openai: {
        // PNG edits come back at 2MB+; compressed WebP keeps versions light.
        outputCompression: OUTPUT_COMPRESSION,
        outputFormat: "webp",
      },
    },
  });

  // biome-ignore lint/suspicious/noConsole: usage telemetry for cost tracking
  console.info("[roomsAi] edit", {
    model: process.env.ROOM_EDIT_MODEL || DEFAULT_IMAGE_EDIT_MODEL,
    ms: Date.now() - startedAt,
    usage: result.calls[0]?.usage ?? null,
  });
  const image = result.images.find((candidate) =>
    candidate.mediaType.startsWith("image/")
  );
  if (!image) {
    const warning = result.warnings
      .map((entry) => ("message" in entry ? String(entry.message) : ""))
      .join(" ")
      .slice(0, ERROR_PREVIEW_LENGTH);
    throw new Error(
      warning
        ? `The model could not make that change: ${warning}`
        : "The model did not return an image"
    );
  }

  const blob = new Blob([new Uint8Array(image.uint8Array)], {
    type: image.mediaType,
  });
  return await ctx.storage.store(blob);
}

/**
 * Apply a user's comment to the version it was left on and create a new
 * version with the result. Item detection is scheduled on the new version.
 */
export const applyComment = internalAction({
  args: { commentId: v.id("roomComments") },
  handler: async (ctx, args) => {
    const context = await ctx.runQuery(
      internal.rooms.internalGetCommentContext,
      { commentId: args.commentId }
    );
    if (!context) {
      return null;
    }
    const { comment, baseVersion } = context;

    try {
      const baseImage = await storageToBytes(ctx, baseVersion.imageStorageId);
      const imageStorageId = await renderEdit(
        ctx,
        baseImage,
        buildEditPrompt(
          comment.text,
          comment.anchor,
          comment.anchor
            ? findAnchoredItem(baseVersion.items, comment.anchor)
            : null
        )
      );

      const versionId = await ctx.runMutation(
        internal.rooms.internalCompleteComment,
        { commentId: comment._id, imageStorageId }
      );

      await ctx.scheduler.runAfter(0, internal.roomsAi.detectItems, {
        versionId,
      });
    } catch (error) {
      await ctx.runMutation(internal.rooms.internalFailComment, {
        commentId: comment._id,
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong applying your comment",
      });
    }

    return null;
  },
  returns: v.null(),
});

const detectionSchema = z.object({
  items: z
    .array(
      z.object({
        // biome-ignore lint/style/useNamingConvention: Gemini's native bounding box field name
        box_2d: z
          .array(z.number())
          .length(4)
          .describe("[ymin, xmin, ymax, xmax] normalized to 0-1000"),
        description: z
          .string()
          .describe("One sentence: colour, material, style"),
        label: z
          .string()
          .describe("Short name of the item, e.g. 'Sofa', 'Floor lamp'"),
        searchQuery: z
          .string()
          .describe(
            "Specific Amazon search query with style, colour, material and type. No brand names."
          ),
      })
    )
    .max(MAX_ITEMS),
});

const clamp01 = (value: number) => Math.min(1, Math.max(0, value / BOX_SCALE));

/**
 * Detect furniture and decor in a version's image so it becomes shoppable.
 */
export const detectItems = internalAction({
  args: { versionId: v.id("roomVersions") },
  handler: async (ctx, args) => {
    const version = await ctx.runQuery(internal.rooms.internalGetVersion, {
      versionId: args.versionId,
    });
    if (!version) {
      return null;
    }

    try {
      const image = await storageToDataUrl(ctx, version.imageStorageId);
      const detectStartedAt = Date.now();
      const { object, usage } = await generateObject({
        messages: [
          {
            content: [
              {
                data: image,
                mediaType: "image",
                type: "file",
              },
              {
                text: `Detect every distinct piece of furniture, lighting, rug, artwork, plant and decor in this room photo that someone could buy. Return at most ${MAX_ITEMS} items, largest and most prominent first. Skip architectural features such as walls, windows, doors, floors and ceilings. For each item give a short label, a one sentence description, a specific Amazon search query, and a tight 2D bounding box as [ymin, xmin, ymax, xmax] on a 0-1000 scale.`,
                type: "text",
              },
            ],
            role: "user",
          },
        ],
        model: gateway.languageModel(
          process.env.ROOM_DETECT_MODEL || DEFAULT_DETECTION_MODEL
        ),
        // Detection is a lookup, not a reasoning task: turn thinking off so
        // small models answer in seconds and bill only the answer tokens.
        providerOptions: {
          google: { thinkingConfig: { thinkingBudget: 0 } },
          openai: { reasoningEffort: "minimal" },
        },
        schema: detectionSchema,
      });

      // biome-ignore lint/suspicious/noConsole: usage telemetry for cost tracking
      console.info("[roomsAi] detect", {
        model: process.env.ROOM_DETECT_MODEL || DEFAULT_DETECTION_MODEL,
        ms: Date.now() - detectStartedAt,
        usage,
      });
      const items = object.items.map((item, index) => {
        const [ymin, xmin, ymax, xmax] = item.box_2d;
        const x = clamp01(xmin);
        const y = clamp01(ymin);
        return {
          box: {
            height: Math.max(0, clamp01(ymax) - y),
            width: Math.max(0, clamp01(xmax) - x),
            x,
            y,
          },
          description: item.description,
          id: `item-${index + 1}`,
          label: item.label,
          searchQuery: item.searchQuery,
        };
      });

      await ctx.runMutation(internal.rooms.internalSetItems, {
        items,
        status: "ready",
        versionId: version._id,
      });
    } catch {
      await ctx.runMutation(internal.rooms.internalSetItems, {
        status: "error",
        versionId: version._id,
      });
    }

    return null;
  },
  returns: v.null(),
});

/**
 * Fetch Amazon products for a detected item. Results are cached on the item,
 * so repeated clicks are free.
 */
export const searchItemProducts = privateAction({
  args: { itemId: v.string(), versionId: v.id("roomVersions") },
  handler: async (ctx, args): Promise<AmazonProduct[]> => {
    const version: Doc<"roomVersions"> | null = await ctx.runQuery(
      internal.rooms.internalAssertVersionOwner,
      { userId: ctx.userId, versionId: args.versionId }
    );
    if (!version) {
      throw new Error("Version not found");
    }

    const item = version.items?.find(
      (candidate) => candidate.id === args.itemId
    );
    if (!item) {
      throw new Error("Item not found");
    }
    if (item.productsStatus === "ready" && item.products) {
      return item.products;
    }

    await ctx.runMutation(internal.rooms.internalSetItemProducts, {
      itemId: item.id,
      status: "pending",
      versionId: version._id,
    });

    try {
      const products = await searchAmazon(item.searchQuery, PRODUCTS_PER_ITEM);
      await ctx.runMutation(internal.rooms.internalSetItemProducts, {
        itemId: item.id,
        products,
        status: "ready",
        versionId: version._id,
      });
      return products;
    } catch (error) {
      await ctx.runMutation(internal.rooms.internalSetItemProducts, {
        itemId: item.id,
        status: "error",
        versionId: version._id,
      });
      throw error;
    }
  },
  returns: v.array(vProduct),
});
