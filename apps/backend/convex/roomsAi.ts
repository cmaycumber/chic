/**
 * AI actions for rooms.
 *
 * - applyComment: edit the current room image according to a user comment.
 *   Comments that ask for furniture are planned, shopped for and rendered
 *   with the real products' photos; everything else is a plain edit.
 * - detectItems: find furniture / decor in an image with bounding boxes.
 * - searchItemProducts: fetch Amazon products for a detected item.
 *
 * Required Convex environment variables:
 * - AI_GATEWAY_API_KEY: Vercel AI Gateway (Muse Image edits the photo,
 *   Gemini 3.5 Flash Lite detects furniture and plans comments; override with
 *   ROOM_EDIT_MODEL, ROOM_DETECT_MODEL and ROOM_PLAN_MODEL)
 * - OPENAI_API_KEY: needed when ROOM_EDIT_MODEL is an openai/ model, and for
 *   putting a bought product into the photo (ROOM_PRODUCT_EDIT_MODEL)
 * - SERPAPI_API_KEY: Amazon product search
 */
"use node";
import { createOpenAI } from "@ai-sdk/openai";
import { gateway, generateImage, generateObject, type ImageModel } from "ai";
import type { FunctionReturnType } from "convex/server";
import { v } from "convex/values";
import z from "zod";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { type ActionCtx, internalAction } from "./_generated/server";
import { type AmazonProduct, searchAmazon } from "./lib/amazonSearch";
import { type PlannedSlot, pickProducts, planComment } from "./lib/roomPlanner";
import { ROOM_STYLES, ROOM_TYPES } from "./lib/roomTaxonomy";
import { privateAction } from "./lib/utils";
import { vProduct } from "./schema";

/** Gateway id of the model that renders comment edits (override with ROOM_EDIT_MODEL). */
const DEFAULT_IMAGE_EDIT_MODEL = "meta/muse-image-1.0";
/**
 * The model that paints a bought product into the photo (override with
 * ROOM_PRODUCT_EDIT_MODEL). Not the comment editor: this call carries a second
 * image, and the gateway's Muse refuses one, while OpenAI's endpoint takes it.
 */
const DEFAULT_PRODUCT_EDIT_MODEL = "openai/gpt-image-2.5-flare";
const OPENAI_PREFIX = "openai/";
/** Gateway id of the vision model that finds furniture (override with ROOM_DETECT_MODEL). */
const DEFAULT_DETECTION_MODEL = "google/gemini-3.5-flash-lite";
const MAX_ITEMS = 12;
const PRODUCTS_PER_ITEM = 6;
const BOX_SCALE = 1000;
const PERCENT = 100;
const ERROR_PREVIEW_LENGTH = 200;
const OUTPUT_COMPRESSION = 82;
/** Image 1 is the room; the product photos are numbered from here. */
const FIRST_PRODUCT_IMAGE = 2;

/**
 * Amazon thumbnails carry their size in the file name
 * (`81nwHIyQClL._AC_UL320_.jpg`). Dropping that segment asks for the original,
 * which is what the edit model should be copying from.
 */
const AMAZON_IMAGE_SIZE_MODIFIER = /\._[A-Za-z0-9_,]+_\./;
const BYTES_PER_MB = 1_048_576;
const MAX_PRODUCT_IMAGE_MB = 8;
const MAX_PRODUCT_IMAGE_BYTES = MAX_PRODUCT_IMAGE_MB * BYTES_PER_MB;

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
function findAnchoredItem<Item extends AnchoredItem>(
  items: Item[] | undefined,
  anchor: AnchorPoint
): Item | null {
  let best: Item | null = null;
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

/** One product going into the render, and what it takes the place of. */
interface RenderSlot {
  action: "add" | "replace";
  itemId?: string;
  label: string;
  /** Where the planner said an added piece goes. */
  placement?: string;
  product: AmazonProduct;
  /** The item a swap takes out, as detected on the base version. */
  replaced?: AnchoredItem | null;
  searchQuery: string;
}

function describeRegion(box: AnchoredItem["box"]) {
  const left = Math.round(box.x * PERCENT);
  const right = Math.round((box.x + box.width) * PERCENT);
  const top = Math.round(box.y * PERCENT);
  const bottom = Math.round((box.y + box.height) * PERCENT);
  return `the region from ${left}% to ${right}% horizontally and ${top}% to ${bottom}% vertically`;
}

function describeSlot(
  slot: RenderSlot,
  imageNumber: number,
  anchor?: AnchorPoint
) {
  const label = slot.label.toLowerCase();
  const photo = `Image ${imageNumber} is a product photo of a ${label} sold online: "${slot.product.name}".`;
  if (slot.action === "replace" && slot.replaced) {
    return `${photo} Replace the ${slot.replaced.label.toLowerCase()} (${slot.replaced.description}), which occupies ${describeRegion(slot.replaced.box)}, with this exact product, placed where the current one is.`;
  }
  const where = slot.placement ? ` ${slot.placement}` : "";
  const pin = anchor
    ? ` around ${Math.round(anchor.x * PERCENT)}% from the left edge and ${Math.round(anchor.y * PERCENT)}% from the top`
    : "";
  return `${photo} Add this exact product to the room${where}${pin}, standing where such a piece naturally would.`;
}

/**
 * The room photo with a product photo per piece beside it, and the words
 * that bind each photo to its place. Numbered so the model treats every extra
 * image as a thing to copy, not as another room.
 */
function buildProductsPrompt(
  text: string,
  slots: RenderSlot[],
  anchor?: AnchorPoint
) {
  // The pin says where an added piece goes only when there is one to say it
  // about; with several, each takes the planner's words instead.
  const additions = slots.filter(
    (slot) => slot.action === "add" || !slot.replaced
  );
  const pin = additions.length === 1 ? anchor : undefined;
  const pieces = slots.map((slot, index) =>
    describeSlot(slot, index + FIRST_PRODUCT_IMAGE, pin)
  );
  const count = slots.length === 1 ? "that one item" : "those items";
  return `You are editing a photo of a real room for an interior design app.

Image 1 is the room. The user asked: "${text}"

${pieces.join("\n\n")}

Each product must look exactly like its own photo: the same shape, colour, material and proportions, scaled realistically to the room and sitting naturally in its light. Copy only the product itself: product photos are often staged, so leave out anything else in them (throws, cushions, books, cups, plants, people, other furniture). Do not invent any other furniture. Keep everything else in the room photo identical: camera angle, layout, architecture, windows, flooring, lighting and every other object. The result must be photorealistic and look like the same photo with only ${count} changed.`;
}

/** Fetch a URL, treating any failure as "not there". */
async function fetchImage(url: string): Promise<Response | null> {
  try {
    const response = await fetch(url);
    return response.ok ? response : null;
  } catch {
    return null;
  }
}

/**
 * The product's own photo, at the largest size Amazon will serve. The listing
 * hands back a thumbnail; a 320px sofa is not enough for the model to copy a
 * material off, so the size modifier is stripped and the original asked for.
 */
async function downloadProductImage(imageUrl: string): Promise<Uint8Array> {
  const fullSize = imageUrl.replace(AMAZON_IMAGE_SIZE_MODIFIER, ".");
  const response =
    (fullSize === imageUrl ? null : await fetchImage(fullSize)) ??
    (await fetchImage(imageUrl));
  if (!response) {
    throw new Error("Could not open that product's photo");
  }
  if (!(response.headers.get("content-type") ?? "").startsWith("image/")) {
    throw new Error("That product's link did not return a photo");
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > MAX_PRODUCT_IMAGE_BYTES) {
    throw new Error("That product's photo is too large to use");
  }
  return bytes;
}

interface EditModel {
  model: ImageModel;
  modelId: string;
}

/**
 * Resolve the edit model. OpenAI models go through the OpenAI provider when
 * its key is present, because the AI Gateway drops image provider options
 * (WebP output). Everything else, e.g. `meta/muse-image-1.0`, uses the gateway.
 */
function imageEditModel(): EditModel {
  const modelId = process.env.ROOM_EDIT_MODEL || DEFAULT_IMAGE_EDIT_MODEL;
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && modelId.startsWith(OPENAI_PREFIX)) {
    return {
      model: createOpenAI({ apiKey }).image(
        modelId.slice(OPENAI_PREFIX.length)
      ),
      modelId,
    };
  }
  return { model: gateway.imageModel(modelId), modelId };
}

/**
 * Resolve the model that puts a bought product in the room. Two input images
 * are the whole point here, so an openai/ id without a key is a dead end
 * rather than something to quietly fall back from.
 */
function productEditModel(): EditModel {
  const modelId =
    process.env.ROOM_PRODUCT_EDIT_MODEL || DEFAULT_PRODUCT_EDIT_MODEL;
  if (!modelId.startsWith(OPENAI_PREFIX)) {
    return { model: gateway.imageModel(modelId), modelId };
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Product previews are not set up yet");
  }
  return {
    model: createOpenAI({ apiKey }).image(modelId.slice(OPENAI_PREFIX.length)),
    modelId,
  };
}

interface EditRequest extends EditModel {
  /** The room first; a product photo second when there is one to copy. */
  images: Uint8Array[];
  prompt: string;
}

/**
 * Run the image model and store the first image it returns.
 * Throws with the model's text if no image is produced.
 */
async function renderEdit(
  ctx: ActionCtx,
  request: EditRequest
): Promise<Id<"_storage">> {
  const startedAt = Date.now();
  const result = await generateImage({
    model: request.model,
    prompt: { images: request.images, text: request.prompt },
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
    images: request.images.length,
    model: request.modelId,
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

type CommentContext = NonNullable<
  FunctionReturnType<typeof internal.rooms.internalGetCommentContext>
>;
type CommentStage = NonNullable<Doc<"roomComments">["stage"]>;
type StoredPlan = NonNullable<Doc<"roomComments">["plan"]>;

/** How long a comment waits for the upload's own survey before running one. */
const SURVEY_WAIT_MS = 8000;
const SURVEY_POLL_MS = 400;

async function setStage(
  ctx: ActionCtx,
  commentId: Id<"roomComments">,
  stage: CommentStage,
  extra: { kind?: Doc<"roomComments">["kind"]; plan?: StoredPlan } = {}
) {
  await ctx.runMutation(internal.rooms.internalSetCommentStage, {
    commentId,
    stage,
    ...extra,
  });
}

function toStoredPlan(slots: (PlannedSlot | RenderSlot)[]): StoredPlan {
  return {
    slots: slots.map((slot) => ({
      action: slot.action,
      itemId: slot.itemId,
      label: slot.label,
      product: "product" in slot ? slot.product : undefined,
      searchQuery: slot.searchQuery,
    })),
  };
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/** The version's items once its scheduled survey lands, or null if it won't. */
async function waitForItems(
  ctx: ActionCtx,
  versionId: Id<"roomVersions">,
  deadline: number
): Promise<DetectedItem[] | null> {
  const version = await ctx.runQuery(internal.rooms.internalGetVersion, {
    versionId,
  });
  if (version?.itemsStatus === "ready" && version.items) {
    return version.items;
  }
  if (version?.itemsStatus !== "pending" || Date.now() >= deadline) {
    return null;
  }
  await sleep(SURVEY_POLL_MS);
  return await waitForItems(ctx, versionId, deadline);
}

/**
 * What is in the photo the comment was left on. Usually already known: every
 * upload and every render is surveyed as it lands. A comment left seconds
 * after upload waits for that survey; one whose survey failed runs its own.
 */
async function surveyedItems(
  ctx: ActionCtx,
  commentId: Id<"roomComments">,
  version: Doc<"roomVersions">
): Promise<DetectedItem[]> {
  if (version.itemsStatus === "ready" && version.items) {
    return version.items;
  }
  await setStage(ctx, commentId, "detecting");
  const landed =
    version.itemsStatus === "pending"
      ? await waitForItems(ctx, version._id, Date.now() + SURVEY_WAIT_MS)
      : null;
  if (landed) {
    return landed;
  }
  const survey = await surveyImage(ctx, version.imageStorageId);
  await ctx.runMutation(internal.rooms.internalSetItems, {
    items: survey.items,
    status: "ready",
    versionId: version._id,
  });
  return survey.items;
}

/**
 * Products that arrive already chosen: "Add to room" plans one slot and picks
 * its product before the comment exists. Older comments carry the product
 * alone, pinned on the item it replaces.
 */
function presetSlots(
  comment: Doc<"roomComments">,
  baseVersion: Doc<"roomVersions">
): RenderSlot[] {
  const items = baseVersion.items ?? [];
  const planned = (comment.plan?.slots ?? []).flatMap((slot) =>
    slot.product
      ? [
          {
            ...slot,
            product: slot.product,
            replaced: items.find((item) => item.id === slot.itemId) ?? null,
          },
        ]
      : []
  );
  if (planned.length > 0 || !comment.product) {
    return planned;
  }
  const pinned = comment.anchor
    ? findAnchoredItem(items, comment.anchor)
    : null;
  return [
    {
      action: "replace",
      itemId: pinned?.id,
      label: pinned?.label ?? "piece of furniture",
      product: comment.product,
      replaced: pinned,
      searchQuery: pinned?.searchQuery ?? "",
    },
  ];
}

/**
 * Search every slot at once (through the shared cache), then pick one
 * listing per slot in a single call. Slots whose search fails or comes back
 * empty drop out.
 */
async function shopForSlots(
  ctx: ActionCtx,
  text: string,
  planned: PlannedSlot[],
  items: DetectedItem[]
): Promise<RenderSlot[]> {
  const searches = await Promise.allSettled(
    planned.map((slot) => searchProductsCached(ctx, slot.searchQuery))
  );
  const found = planned.flatMap((slot, index) => {
    const search = searches.at(index);
    return search?.status === "fulfilled" && search.value.length > 0
      ? [{ listings: search.value, slot }]
      : [];
  });
  if (found.length === 0) {
    return [];
  }

  const picks = await pickProducts(
    text,
    found.map(({ listings, slot }) => ({
      label: slot.label,
      listings,
      maxPrice: slot.maxPrice,
      searchQuery: slot.searchQuery,
    }))
  );
  return found.flatMap(({ listings, slot }, index) => {
    const product = listings.at(picks.at(index) ?? 0);
    if (!product) {
      return [];
    }
    return [
      {
        action: slot.action,
        itemId: slot.itemId,
        label: slot.label,
        placement: slot.placement,
        product,
        replaced: items.find((item) => item.id === slot.itemId) ?? null,
        searchQuery: slot.searchQuery,
      },
    ];
  });
}

/**
 * The Flare request for a set of products: the room, then each product's
 * own photo. A product whose photo will not download is left out; null when
 * none are left, so the caller can decide what to do instead.
 */
async function productRequest(
  comment: Doc<"roomComments">,
  baseImage: Uint8Array,
  slots: RenderSlot[]
): Promise<{ request: EditRequest; slots: RenderSlot[] } | null> {
  const downloads = await Promise.allSettled(
    slots.map((slot) => downloadProductImage(slot.product.imageUrl))
  );
  const placed: RenderSlot[] = [];
  const images: Uint8Array[] = [];
  for (const [index, download] of downloads.entries()) {
    const slot = slots.at(index);
    if (slot && download.status === "fulfilled") {
      placed.push(slot);
      images.push(download.value);
    }
  }
  if (placed.length === 0) {
    const failure = downloads.find((entry) => entry.status === "rejected");
    if (failure?.status === "rejected" && failure.reason instanceof Error) {
      // biome-ignore lint/suspicious/noConsole: surfaced when every photo fails
      console.warn("[roomsAi] product photos", failure.reason.message);
    }
    return null;
  }
  return {
    request: {
      images: [baseImage, ...images],
      ...productEditModel(),
      prompt: buildProductsPrompt(comment.text, placed, comment.anchor),
    },
    slots: placed,
  };
}

function freeformRequest(
  comment: Doc<"roomComments">,
  baseImage: Uint8Array,
  item: AnchoredItem | null
): EditRequest {
  return {
    images: [baseImage],
    ...imageEditModel(),
    prompt: buildEditPrompt(comment.text, comment.anchor, item),
  };
}

/**
 * Decide what a comment asks the image model for, moving the comment through
 * its stages on the way:
 *
 *   preset product (Add to room) ──────────────────────────────→ Flare
 *   words → survey → plan ─ freeform ──────────────────────────→ Muse
 *                          └ products → search → pick ─────────→ Flare
 *
 * A product plan that ends up with nothing renderable (no listings, no
 * photos) falls back to Muse rather than failing the comment.
 */
async function buildEditRequest(
  ctx: ActionCtx,
  { baseVersion, comment, room }: CommentContext,
  baseImage: Uint8Array
): Promise<EditRequest> {
  const preset = presetSlots(comment, baseVersion);
  if (preset.length > 0) {
    await setStage(ctx, comment._id, "rendering");
    const built = await productRequest(comment, baseImage, preset);
    if (!built) {
      throw new Error("Could not open that product's photo");
    }
    return built.request;
  }

  const items = await surveyedItems(ctx, comment._id, baseVersion);
  const anchoredItem = comment.anchor
    ? findAnchoredItem(items, comment.anchor)
    : null;

  await setStage(ctx, comment._id, "planning");
  const plan = await planComment({
    anchor: comment.anchor,
    anchoredItem,
    items,
    roomType: room.roomType,
    style: room.style,
    text: comment.text,
  });
  if (plan.kind === "freeform") {
    await setStage(ctx, comment._id, "rendering", { kind: "freeform" });
    return freeformRequest(comment, baseImage, anchoredItem);
  }

  await setStage(ctx, comment._id, "searching", {
    kind: "products",
    plan: toStoredPlan(plan.slots),
  });
  const shopped = await shopForSlots(ctx, comment.text, plan.slots, items);
  const built =
    shopped.length > 0
      ? await productRequest(comment, baseImage, shopped)
      : null;
  if (!built) {
    await setStage(ctx, comment._id, "rendering", { kind: "freeform" });
    return freeformRequest(comment, baseImage, anchoredItem);
  }

  // Written before the render so the picks show while Flare works.
  await setStage(ctx, comment._id, "rendering", {
    plan: toStoredPlan(built.slots),
  });
  return built.request;
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
    const startedAt = Date.now();

    try {
      const baseImage = await storageToBytes(ctx, baseVersion.imageStorageId);
      const request = await buildEditRequest(ctx, context, baseImage);
      const renderStartedAt = Date.now();
      const imageStorageId = await renderEdit(ctx, request);

      const versionId = await ctx.runMutation(
        internal.rooms.internalCompleteComment,
        { commentId: comment._id, imageStorageId }
      );

      // biome-ignore lint/suspicious/noConsole: end-to-end latency per comment
      console.info("[roomsAi] comment", {
        beforeRenderMs: renderStartedAt - startedAt,
        images: request.images.length,
        model: request.modelId,
        renderMs: Date.now() - renderStartedAt,
        totalMs: Date.now() - startedAt,
      });

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

/**
 * The gallery's two tags. Asked for alongside the furniture because the model
 * is already looking at the photo: one call, two answers.
 */
const roomTypeField = z
  .enum(ROOM_TYPES)
  .describe("the single best-fitting room type");
const styleField = z.enum(ROOM_STYLES).describe("the dominant decor style");

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
  roomType: roomTypeField,
  style: styleField,
});

/** Just the tags, for a room whose items were detected before tags existed. */
const classificationSchema = z.object({
  roomType: roomTypeField,
  style: styleField,
});

const clamp01 = (value: number) => Math.min(1, Math.max(0, value / BOX_SCALE));

interface DetectedItem extends AnchoredItem {
  id: string;
}

const WORD = /[a-z]+/g;
const MIN_WORD_LENGTH = 3;

/** "Area rug" and "Rug", "Sofa" and "Leather sofa": one shared word will do. */
function sameKind(a: string, b?: string): boolean {
  if (!b) {
    return false;
  }
  const words = new Set(
    (a.toLowerCase().match(WORD) ?? []).filter(
      (word) => word.length >= MIN_WORD_LENGTH
    )
  );
  return (b.toLowerCase().match(WORD) ?? []).some((word) => words.has(word));
}

/**
 * When a version came from placing products, the room already knows what is
 * in it. Hand each real listing to the item detection just found where it
 * was put, first in line ahead of the rest of that search's results, so
 * tapping it opens the thing that was chosen rather than a new search.
 *
 * Silent when nothing matches: a seeded product is a nicety, not the edit.
 */
async function seedPlacedProducts(
  ctx: ActionCtx,
  version: Doc<"roomVersions">,
  items: DetectedItem[]
): Promise<void> {
  if (!version.commentId) {
    return;
  }
  const placements = await ctx.runQuery(
    internal.rooms.internalGetCommentPlacements,
    { commentId: version.commentId }
  );

  // A rug's middle is usually under the coffee table, so each product takes
  // the item at its spot that shares its name, before any other, and no two
  // products share an item.
  const claimed = new Set<string>();
  const targets = placements.flatMap((placement) => {
    const free = items.filter((candidate) => !claimed.has(candidate.id));
    const item =
      findAnchoredItem(
        free.filter((candidate) => sameKind(candidate.label, placement.label)),
        placement.point
      ) ?? findAnchoredItem(free, placement.point);
    if (!item) {
      return [];
    }
    claimed.add(item.id);
    return [{ item, placement }];
  });

  await Promise.all(
    targets.map(async ({ item, placement }) => {
      const cached = placement.searchQuery
        ? await ctx.runQuery(internal.rooms.internalGetCachedProducts, {
            query: placement.searchQuery,
          })
        : null;
      const alternatives = (cached ?? []).filter(
        (product) => product.productUrl !== placement.product.productUrl
      );
      await ctx.runMutation(internal.rooms.internalSetItemProducts, {
        itemId: item.id,
        products: [placement.product, ...alternatives].slice(
          0,
          PRODUCTS_PER_ITEM
        ),
        status: "ready",
        versionId: version._id,
      });
    })
  );
}

interface Survey {
  items: (DetectedItem & { searchQuery: string })[];
  roomType: z.infer<typeof roomTypeField>;
  style: z.infer<typeof styleField>;
}

/** Find the furniture in a stored image, with boxes, and tag the room. */
async function surveyImage(
  ctx: ActionCtx,
  storageId: Id<"_storage">
): Promise<Survey> {
  const image = await storageToDataUrl(ctx, storageId);
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
            text: `Detect every distinct piece of furniture, lighting, rug, artwork, plant and decor in this room photo that someone could buy. Return at most ${MAX_ITEMS} items, largest and most prominent first. Skip architectural features such as walls, windows, doors, floors and ceilings. For each item give a short label, a one sentence description, a specific Amazon search query, and a tight 2D bounding box as [ymin, xmin, ymax, xmax] on a 0-1000 scale. Also classify the photo itself: the single best-fitting room type and the dominant decor style.`,
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
  return { items, roomType: object.roomType, style: object.style };
}

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
      const { items, roomType, style } = await surveyImage(
        ctx,
        version.imageStorageId
      );

      await ctx.runMutation(internal.rooms.internalSetItems, {
        items,
        status: "ready",
        versionId: version._id,
      });

      await seedPlacedProducts(ctx, version, items);

      // The photo the room started as decides what the room is. Later edits
      // only re-tag a room that has no tags yet, so an edit that repaints the
      // walls cannot quietly move a bedroom into the kitchen gallery.
      const isOriginal = version.commentId === undefined;
      const tags = await ctx.runQuery(internal.rooms.internalGetRoomTags, {
        roomId: version.roomId,
      });
      if (tags && (isOriginal || !tags.roomType)) {
        await ctx.runMutation(internal.rooms.internalSetRoomTags, {
          roomId: version.roomId,
          roomType,
          style,
        });
      }
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
 * Tag a room that has no room type, so listing it in the gallery files it
 * under the right `/ideas/[roomType]` page. Scheduled when an older room is
 * listed; rooms created since detection started tagging arrive already done.
 */
export const internalClassifyRoom = internalAction({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const target = await ctx.runQuery(
      internal.rooms.internalGetRoomToClassify,
      { roomId: args.roomId }
    );
    if (!target) {
      return null;
    }

    const image = await storageToDataUrl(ctx, target.imageStorageId);
    const startedAt = Date.now();
    const { object, usage } = await generateObject({
      messages: [
        {
          content: [
            { data: image, mediaType: "image", type: "file" },
            {
              text: "Classify this room photo: give the single best-fitting room type and the dominant decor style.",
              type: "text",
            },
          ],
          role: "user",
        },
      ],
      model: gateway.languageModel(
        process.env.ROOM_DETECT_MODEL || DEFAULT_DETECTION_MODEL
      ),
      // Same reasoning as detection: this is a lookup, not a reasoning task.
      providerOptions: {
        google: { thinkingConfig: { thinkingBudget: 0 } },
        openai: { reasoningEffort: "minimal" },
      },
      schema: classificationSchema,
    });

    // biome-ignore lint/suspicious/noConsole: usage telemetry for cost tracking
    console.info("[roomsAi] classify", {
      model: process.env.ROOM_DETECT_MODEL || DEFAULT_DETECTION_MODEL,
      ms: Date.now() - startedAt,
      usage,
    });

    await ctx.runMutation(internal.rooms.internalSetRoomTags, {
      roomId: args.roomId,
      roomType: object.roomType,
      style: object.style,
    });

    return null;
  },
  returns: v.null(),
});

/**
 * Fetch Amazon products for a detected item.
 *
 * Two caches sit in front of the paid search: the products written onto the
 * item, which makes a second click on the same sofa free, and `productSearches`
 * keyed by the query itself, which makes the first click free for everyone
 * after the first person who ever asked for a grey linen sofa.
 */
export const searchItemProducts = privateAction({
  args: { itemId: v.string(), versionId: v.id("roomVersions") },
  handler: async (ctx, args): Promise<AmazonProduct[]> => {
    const version: Doc<"roomVersions"> | null = await ctx.runQuery(
      internal.rooms.internalAssertVersionEditor,
      { userId: ctx.userId, versionId: args.versionId }
    );
    if (!version) {
      throw new Error("Version not found");
    }
    return await fetchItemProducts(ctx, version, args.itemId);
  },
  returns: v.array(vProduct),
});

/** The products for one item, from the item, the shared cache or SerpAPI. */
async function fetchItemProducts(
  ctx: ActionCtx,
  version: Doc<"roomVersions">,
  itemId: string
): Promise<AmazonProduct[]> {
  const item = version.items?.find((candidate) => candidate.id === itemId);
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
    const products = await searchProductsCached(ctx, item.searchQuery);
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
}

/**
 * Amazon results for a query: from the shared `productSearches` cache when
 * someone asked the same thing in the last fortnight, SerpAPI otherwise.
 */
async function searchProductsCached(
  ctx: ActionCtx,
  query: string
): Promise<AmazonProduct[]> {
  const startedAt = Date.now();
  const cached = await ctx.runQuery(internal.rooms.internalGetCachedProducts, {
    query,
  });
  const products = cached ?? (await searchAmazon(query, PRODUCTS_PER_ITEM));
  if (!cached) {
    await ctx.runMutation(internal.rooms.internalCacheProducts, {
      products,
      query,
    });
  }

  // biome-ignore lint/suspicious/noConsole: usage telemetry for cost tracking
  console.info("[roomsAi] products", {
    cache: cached ? "hit" : "miss",
    ms: Date.now() - startedAt,
    query,
  });
  return products;
}
