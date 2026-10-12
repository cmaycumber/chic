/**
 * Server-to-server entry points for the Chic app inside ChatGPT.
 *
 * The MCP server in the web app (`/mcp`) is the only caller: every function
 * takes the shared `CHATGPT_APP_SECRET` instead of a session, because a
 * ChatGPT user never signs in to Chic.
 *
 * Rooms made here belong to a service user derived from the anonymized
 * `openai/subject` ChatGPT sends with each tool call (or one shared
 * `chatgpt-app` user when it is missing). They are shared by link so the
 * `/r/{roomId}` page can show them, kept out of the gallery, and expire like
 * any guest's room.
 */
import { ConvexError, type Infer, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  type ActionCtx,
  action,
  internalMutation,
  internalQuery,
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";
import { ANONYMOUS_ROOM_TTL_DAYS, queueComment } from "./rooms";
import { vCommentStage, vItemsStatus, vProduct } from "./schema";

const MS_PER_DAY = 86_400_000;
const ROOM_TTL_MS = ANONYMOUS_ROOM_TTL_DAYS * MS_PER_DAY;

/** Owner of every room made without a ChatGPT subject. */
const SHARED_USER_ID = "chatgpt-app";
const USER_ID_PREFIX = "chatgpt:";
/** Hex characters of the hashed subject kept in the user id. */
const SUBJECT_HASH_LENGTH = 32;

const MAX_ROOMS_PER_DAY = 50;
const MAX_COMMENTS_PER_ROOM = 20;
/**
 * Spending ceilings across every ChatGPT user per UTC day. Subjects come from
 * the request and can't be trusted to rate-limit on their own, and all
 * ChatGPT traffic shares OpenAI's IPs, so these are the backstop. Override
 * with CHATGPT_DAILY_ROOM_CAP / CHATGPT_DAILY_COMMENT_CAP.
 */
const DEFAULT_DAILY_ROOM_CAP = 300;
const DEFAULT_DAILY_COMMENT_CAP = 1500;
const DAY_KEY_LENGTH = 10;
const BUSY_MESSAGE =
  "Chic is at capacity for today. Try again tomorrow, or use usechic.com.";
const MAX_COMMENT_LENGTH = 1000;
const MAX_TITLE_LENGTH = 120;
const DEFAULT_TITLE = "A room from ChatGPT";

/** Same ceiling as the web uploader. */
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 20_000;

/** Products per detected item handed back; the widget shows a strip, not a shop. */
const PRODUCTS_PER_ITEM = 3;

const HEX_RADIX = 16;
const BYTE_HEX_WIDTH = 2;

// ---------------------------------------------------------------------------
// Secret and identity
// ---------------------------------------------------------------------------

/**
 * Compare two strings in time that depends only on the expected one's length,
 * so a caller cannot learn the secret a character at a time.
 */
function constantTimeEqual(actual: string, expected: string): boolean {
  const encoder = new TextEncoder();
  const a = encoder.encode(actual);
  const b = encoder.encode(expected);
  // biome-ignore lint/suspicious/noBitwiseOperators: constant-time compare
  let diff = a.length ^ b.length;
  for (let i = 0; i < b.length; i += 1) {
    // biome-ignore lint/suspicious/noBitwiseOperators: constant-time compare
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

function assertSecret(secret: string) {
  const expected = process.env.CHATGPT_APP_SECRET;
  if (!(expected && constantTimeEqual(secret, expected))) {
    throw new ConvexError("Unauthorized");
  }
}

/**
 * The Chic user a ChatGPT user's rooms belong to. The subject is already
 * anonymized by OpenAI; hashing it again keeps ids short and uniform.
 */
async function ownerFor(subject: string | undefined): Promise<string> {
  const trimmed = subject?.trim();
  if (!trimmed) {
    return SHARED_USER_ID;
  }
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(trimmed)
  );
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(HEX_RADIX).padStart(BYTE_HEX_WIDTH, "0"))
    .join("");
  return `${USER_ID_PREFIX}${hex.slice(0, SUBJECT_HASH_LENGTH)}`;
}

function isAppOwned(room: Doc<"rooms">): boolean {
  return (
    room.userId === SHARED_USER_ID || room.userId.startsWith(USER_ID_PREFIX)
  );
}

// ---------------------------------------------------------------------------
// Image intake
// ---------------------------------------------------------------------------

const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];
const WEBP_TAG_OFFSET = 8;
const FTYP = "ftyp";
const FTYP_OFFSET = 4;
const FTYP_BRAND_OFFSET = 8;
const HEIF_BRANDS = new Set(["heic", "heix", "hevc", "heim", "heis", "mif1"]);
const TAG_LENGTH = 4;

function startsWith(bytes: Uint8Array, magic: readonly number[]): boolean {
  return magic.every((byte, index) => bytes[index] === byte);
}

function ascii(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(...bytes.slice(offset, offset + TAG_LENGTH));
}

/**
 * What the bytes are, read from the bytes. ChatGPT's file URLs do not always
 * say, and the renderer needs a type it can open: JPEG, PNG or WebP.
 */
function sniffImageType(bytes: Uint8Array): string {
  if (startsWith(bytes, JPEG_MAGIC)) {
    return "image/jpeg";
  }
  if (startsWith(bytes, PNG_MAGIC)) {
    return "image/png";
  }
  if (ascii(bytes, 0) === "RIFF" && ascii(bytes, WEBP_TAG_OFFSET) === "WEBP") {
    return "image/webp";
  }
  if (
    ascii(bytes, FTYP_OFFSET) === FTYP &&
    HEIF_BRANDS.has(ascii(bytes, FTYP_BRAND_OFFSET))
  ) {
    throw new ConvexError(
      "HEIC photos are not supported yet. Please send a JPEG or PNG."
    );
  }
  throw new ConvexError("That file is not a JPEG, PNG or WebP photo.");
}

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
const WHITESPACE = /\s/g;

async function downloadImage(
  imageUrl: string
): Promise<Uint8Array<ArrayBuffer>> {
  if (!URL.canParse(imageUrl)) {
    throw new ConvexError("That image link is not a valid URL.");
  }
  const url = new URL(imageUrl);
  if (url.protocol !== "https:") {
    throw new ConvexError("Image links must use https.");
  }

  const response = await fetch(url, {
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
  }).catch(() => null);
  if (!response) {
    throw new ConvexError("Could not download that photo.");
  }
  if (!response.ok) {
    throw new ConvexError(
      `Could not download that photo (HTTP ${response.status}).`
    );
  }
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > MAX_IMAGE_BYTES) {
    throw new ConvexError("Photos must be under 20MB.");
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new ConvexError("Photos must be under 20MB.");
  }
  return bytes;
}

/** Bytes from base64, with or without a `data:` prefix. */
function decodeBase64(data: string): Uint8Array<ArrayBuffer> {
  const payload = (
    data.includes(",") ? data.slice(data.indexOf(",") + 1) : data
  ).replace(WHITESPACE, "");
  if (!BASE64.test(payload)) {
    throw new ConvexError("That image data is not valid base64.");
  }
  const binary = atob(payload);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function readImage(args: {
  imageBase64?: string;
  imageUrl?: string;
}): Promise<Blob> {
  let bytes: Uint8Array<ArrayBuffer>;
  if (args.imageUrl) {
    bytes = await downloadImage(args.imageUrl);
  } else if (args.imageBase64) {
    bytes = decodeBase64(args.imageBase64);
  } else {
    throw new ConvexError("Send a photo of the room.");
  }
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new ConvexError("Photos must be under 20MB.");
  }
  return new Blob([bytes], { type: sniffImageType(bytes) });
}

// ---------------------------------------------------------------------------
// Rooms
// ---------------------------------------------------------------------------

type UsageKey = "comments" | "rooms";

function dailyCap(key: UsageKey): number {
  const raw =
    key === "rooms"
      ? process.env.CHATGPT_DAILY_ROOM_CAP
      : process.env.CHATGPT_DAILY_COMMENT_CAP;
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return key === "rooms" ? DEFAULT_DAILY_ROOM_CAP : DEFAULT_DAILY_COMMENT_CAP;
}

function today(): string {
  return new Date().toISOString().slice(0, DAY_KEY_LENGTH);
}

async function usageToday(ctx: QueryCtx, key: UsageKey) {
  return await ctx.db
    .query("chatgptUsage")
    .withIndex("by_key_day", (q) => q.eq("key", key).eq("day", today()))
    .unique();
}

/** Count one more of `key` today, or refuse once the day's cap is reached. */
async function consumeDaily(ctx: MutationCtx, key: UsageKey) {
  const row = await usageToday(ctx, key);
  const used = row?.count ?? 0;
  if (used >= dailyCap(key)) {
    throw new ConvexError(BUSY_MESSAGE);
  }
  if (row) {
    await ctx.db.patch(row._id, { count: used + 1 });
  } else {
    await ctx.db.insert("chatgptUsage", { count: 1, day: today(), key });
  }
}

async function roomsMadeToday(ctx: QueryCtx, userId: string): Promise<number> {
  const since = Date.now() - MS_PER_DAY;
  const recent = await ctx.db
    .query("rooms")
    .withIndex("by_user", (q) =>
      q.eq("userId", userId).gt("_creationTime", since)
    )
    .take(MAX_ROOMS_PER_DAY);
  return recent.length;
}

export const internalRoomQuotaLeft = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const globalLeft =
      dailyCap("rooms") - ((await usageToday(ctx, "rooms"))?.count ?? 0);
    const ownerLeft =
      MAX_ROOMS_PER_DAY - (await roomsMadeToday(ctx, args.userId));
    return { globalLeft, ownerLeft };
  },
  returns: v.object({ globalLeft: v.number(), ownerLeft: v.number() }),
});

/**
 * Version 0 and the room around it, shared by link but unlisted, with the
 * guest clock on it. Detection starts at once so the photo is shoppable.
 */
export const internalCreateRoom = internalMutation({
  args: {
    imageStorageId: v.id("_storage"),
    title: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Checked again here, where it cannot race another upload.
    if ((await roomsMadeToday(ctx, args.userId)) >= MAX_ROOMS_PER_DAY) {
      await ctx.storage.delete(args.imageStorageId);
      throw new ConvexError("Daily room limit reached. Try again tomorrow.");
    }
    try {
      await consumeDaily(ctx, "rooms");
    } catch (error) {
      await ctx.storage.delete(args.imageStorageId);
      throw error;
    }

    const roomId = await ctx.db.insert("rooms", {
      expiresAt: Date.now() + ROOM_TTL_MS,
      isListed: false,
      isPublic: true,
      originalImageStorageId: args.imageStorageId,
      status: "ready",
      title: args.title?.trim().slice(0, MAX_TITLE_LENGTH) || DEFAULT_TITLE,
      userId: args.userId,
    });
    const versionId = await ctx.db.insert("roomVersions", {
      imageStorageId: args.imageStorageId,
      itemsStatus: "pending",
      roomId,
      summary: "Original photo",
    });
    await ctx.db.patch(roomId, { currentVersionId: versionId });
    await ctx.scheduler.runAfter(0, internal.roomsAi.detectItems, {
      versionId,
    });
    return roomId;
  },
  returns: v.id("rooms"),
});

/**
 * Make a room from a photo the ChatGPT user attached: `imageUrl` is the
 * temporary `download_url` ChatGPT hands the tool, `imageBase64` a fallback
 * for clients that inline the bytes.
 */
export const createRoomFromImage = action({
  args: {
    imageBase64: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    secret: v.string(),
    subject: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx: ActionCtx, args): Promise<{ roomId: Id<"rooms"> }> => {
    assertSecret(args.secret);
    const userId = await ownerFor(args.subject);

    // Refuse before paying for a download nobody will keep.
    const quotaLeft = await ctx.runQuery(
      internal.chatgpt.internalRoomQuotaLeft,
      { userId }
    );
    if (quotaLeft.globalLeft <= 0) {
      throw new ConvexError(BUSY_MESSAGE);
    }
    if (quotaLeft.ownerLeft <= 0) {
      throw new ConvexError("Daily room limit reached. Try again tomorrow.");
    }

    const image = await readImage(args);
    const uploadedId = await ctx.storage.store(image);
    const imageStorageId = await ctx.runAction(
      internal.imageNormalize.normalizeUpload,
      { storageId: uploadedId }
    );
    const screen = await ctx.runAction(internal.roomsAi.internalScreenUpload, {
      storageId: imageStorageId,
    });
    if (!screen.isRoom || screen.hasPeople) {
      await ctx.storage.delete(imageStorageId);
      throw new ConvexError(
        screen.isRoom
          ? "Chic only edits rooms without people in them. Send a photo of the room with nobody in it."
          : "That photo doesn't look like a room. Send a photo of a room you'd like to redesign."
      );
    }
    const roomId = await ctx.runMutation(internal.chatgpt.internalCreateRoom, {
      imageStorageId,
      title: args.title,
      userId,
    });
    return { roomId };
  },
  returns: v.object({ roomId: v.id("rooms") }),
});

/**
 * Ask for a change, exactly as a comment on the room page does. Only the
 * ChatGPT user who made the room can change it.
 */
export const addComment = mutation({
  args: {
    roomId: v.id("rooms"),
    secret: v.string(),
    subject: v.optional(v.string()),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    assertSecret(args.secret);
    const room = await ctx.db.get(args.roomId);
    const userId = await ownerFor(args.subject);
    if (!(room && isAppOwned(room) && room.userId === userId)) {
      throw new ConvexError("Room not found");
    }
    const text = args.text.trim().slice(0, MAX_COMMENT_LENGTH);
    if (!text) {
      throw new ConvexError("Say what to change in the room.");
    }
    if (!room.currentVersionId) {
      throw new ConvexError("Room has no image yet");
    }
    if (room.status === "generating") {
      throw new ConvexError(
        "The last change is still rendering. Check the room again shortly."
      );
    }
    const existing = await ctx.db
      .query("roomComments")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .take(MAX_COMMENTS_PER_ROOM);
    if (existing.length >= MAX_COMMENTS_PER_ROOM) {
      throw new ConvexError(
        "This room has reached its change limit. Start a new room with the latest photo."
      );
    }
    await consumeDaily(ctx, "comments");

    const commentId = await queueComment(
      ctx,
      room,
      { name: "ChatGPT", userId },
      { baseVersionId: room.currentVersionId, text }
    );
    return { commentId };
  },
  returns: v.object({ commentId: v.id("roomComments") }),
});

// ---------------------------------------------------------------------------
// Reading a room back
// ---------------------------------------------------------------------------

const vStatus = v.union(
  v.literal("rendering"),
  v.literal("ready"),
  v.literal("failed")
);

const vRoomOut = v.object({
  afterUrl: v.union(v.string(), v.null()),
  beforeUrl: v.union(v.string(), v.null()),
  commentCount: v.number(),
  error: v.optional(v.string()),
  items: v.array(
    v.object({
      id: v.string(),
      label: v.string(),
      products: v.array(vProduct),
    })
  ),
  itemsStatus: vItemsStatus,
  latestComment: v.union(
    v.object({
      stage: v.optional(vCommentStage),
      status: v.union(
        v.literal("pending"),
        v.literal("applied"),
        v.literal("failed")
      ),
      text: v.string(),
    }),
    v.null()
  ),
  /** The real listings the latest change rendered into the photo. */
  pickedProducts: v.array(vProduct),
  roomId: v.id("rooms"),
  stage: v.optional(vCommentStage),
  status: vStatus,
  title: v.optional(v.string()),
});

function roomStatus(
  room: Doc<"rooms">,
  latest: Doc<"roomComments"> | null
): "failed" | "ready" | "rendering" {
  if (room.status === "generating" || latest?.status === "pending") {
    return "rendering";
  }
  return latest?.status === "failed" ? "failed" : "ready";
}

function pickedProducts(comment: Doc<"roomComments"> | null) {
  if (comment?.status !== "applied") {
    return [];
  }
  const picked = (comment.plan?.slots ?? []).flatMap((slot) =>
    slot.product ? [slot.product] : []
  );
  if (comment.product) {
    picked.push(comment.product);
  }
  const seen = new Set<string>();
  return picked.filter((product) => {
    if (seen.has(product.productUrl)) {
      return false;
    }
    seen.add(product.productUrl);
    return true;
  });
}

/** Before, after, progress and what can be bought, for a public room. */
export const getRoom = query({
  args: { roomId: v.id("rooms"), secret: v.string() },
  handler: async (ctx, args) => {
    assertSecret(args.secret);
    const room = await ctx.db.get(args.roomId);
    if (!(room?.isPublic && room.currentVersionId)) {
      return null;
    }

    const original = await ctx.db
      .query("roomVersions")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .first();
    const current = await ctx.db.get(room.currentVersionId);
    if (!(original && current)) {
      return null;
    }

    const comments = await ctx.db
      .query("roomComments")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .order("desc")
      .take(MAX_COMMENTS_PER_ROOM + 1);
    const latest = comments[0] ?? null;

    const [beforeUrl, afterUrl] = await Promise.all([
      ctx.storage.getUrl(original.imageStorageId),
      ctx.storage.getUrl(current.imageStorageId),
    ]);

    return {
      afterUrl,
      beforeUrl,
      commentCount: comments.length,
      error: latest?.status === "failed" ? room.error : undefined,
      items: (current.items ?? []).map((item) => ({
        id: item.id,
        label: item.label,
        products: (item.products ?? []).slice(0, PRODUCTS_PER_ITEM),
      })),
      itemsStatus: current.itemsStatus,
      latestComment: latest
        ? { stage: latest.stage, status: latest.status, text: latest.text }
        : null,
      pickedProducts: pickedProducts(latest),
      roomId: room._id,
      stage: latest?.status === "pending" ? latest.stage : undefined,
      status: roomStatus(room, latest),
      title: room.title,
    };
  },
  returns: v.union(vRoomOut, v.null()),
});

export const internalGetShoppableItem = internalQuery({
  args: { item: v.string(), roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!(room?.isPublic && room.currentVersionId)) {
      return null;
    }
    const version = await ctx.db.get(room.currentVersionId);
    const items = version?.items ?? [];
    const wanted = args.item.trim().toLowerCase();
    const item =
      items.find((candidate) => candidate.id === args.item) ??
      items.find((candidate) => candidate.label.toLowerCase() === wanted) ??
      items.find(
        (candidate) =>
          candidate.label.toLowerCase().includes(wanted) ||
          wanted.includes(candidate.label.toLowerCase())
      );
    return {
      item: item ? { id: item.id, label: item.label } : null,
      labels: items.map((candidate) => candidate.label),
      versionId: room.currentVersionId,
    };
  },
  returns: v.union(
    v.object({
      item: v.union(v.object({ id: v.string(), label: v.string() }), v.null()),
      labels: v.array(v.string()),
      versionId: v.id("roomVersions"),
    }),
    v.null()
  ),
});

/**
 * Products for one piece of furniture in the room's current photo, matched by
 * item id or by its label ("sofa", "rug"). Goes through the same cached search
 * as tapping the item on usechic.com, so links carry the same tags.
 */
export const shopItem = action({
  args: { item: v.string(), roomId: v.id("rooms"), secret: v.string() },
  handler: async (
    ctx,
    args
  ): Promise<{
    item: { id: string; label: string };
    products: Infer<typeof vProduct>[];
  }> => {
    assertSecret(args.secret);
    const found = await ctx.runQuery(
      internal.chatgpt.internalGetShoppableItem,
      {
        item: args.item,
        roomId: args.roomId,
      }
    );
    if (!found) {
      throw new ConvexError("Room not found");
    }
    if (!found.item) {
      const labels = found.labels.join(", ");
      throw new ConvexError(
        labels
          ? `No "${args.item}" in this room. Items: ${labels}.`
          : "Furniture in this room has not been found yet. Try again shortly."
      );
    }
    const products = await ctx.runAction(
      internal.roomsAi.internalSearchItemProducts,
      { itemId: found.item.id, versionId: found.versionId }
    );
    return { item: found.item, products };
  },
  returns: v.object({
    item: v.object({ id: v.string(), label: v.string() }),
    products: v.array(vProduct),
  }),
});
