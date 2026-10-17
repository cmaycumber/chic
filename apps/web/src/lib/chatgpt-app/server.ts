/**
 * The Chic MCP server ChatGPT talks to: three tools and the widget that
 * renders their results. Mounted at `/mcp` by `app/mcp/route.ts`.
 *
 * Every Convex call goes through `api.chatgpt.*` with `CHATGPT_APP_SECRET`,
 * because ChatGPT users never have a Chic session.
 */
import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import type {
  CallToolResult,
  McpServer,
  ServerContext,
} from "@modelcontextprotocol/server";
import { fetchAction, fetchMutation, fetchQuery } from "convex/nextjs";
import type { FunctionReturnType } from "convex/server";
import { ConvexError } from "convex/values";
import { PostHog } from "posthog-node";
import { z } from "zod";
import { siteConfig } from "@/lib/site-config";
import { WIDGET_HTML, WIDGET_MIME_TYPE, WIDGET_URI } from "./widget";

type RoomSnapshot = NonNullable<FunctionReturnType<typeof api.chatgpt.getRoom>>;
type Product = RoomSnapshot["pickedProducts"][number];

/**
 * How long `redesign_room` waits for the render, and the furniture detection
 * that follows it, before handing back a link. With the product search after
 * it, the whole call stays inside the route's 60 s.
 */
const RENDER_WAIT_MS = 38_000;
const POLL_INTERVAL_MS = 2500;
/** Products in the strip; enough to scroll, few enough to read. */
const MAX_PRODUCTS = 8;
const MAX_REQUEST_LENGTH = 1000;
const MAX_TITLE_LENGTH = 120;
/**
 * A paint or lighting change picks no products, but the card should still be
 * shoppable: search this many of the room's items, this many results each,
 * and stop waiting after the budget. A search still running then finishes in
 * Convex and lands on the item, where the next `get_room` picks it up.
 */
const SHOP_ITEMS = 3;
const SHOP_PRODUCTS_PER_ITEM = 2;
const SHOP_BUDGET_MS = 14_000;

const UTM = "utm_source=chatgpt&utm_medium=app&utm_campaign=chatgpt_app";

/** Said wherever product links are, in text and in the widget. */
const AFFILIATE_NOTE =
  "Links go to third-party retailers; Chic may earn a commission on qualifying purchases.";

const TRAILING_SLASH = /\/$/;
const WWW_PREFIX = /^www\./;

export const SERVER_INSTRUCTIONS =
  "Chic redesigns a photo of a real interior room (living room, bedroom, kitchen, office and so on) and makes it shoppable. When the user shares a room photo and asks for a change (paint, furniture, decor, layout, style), call redesign_room with the photo and their request in their words. To change the same room again, pass the roomId from the last result instead of the photo. If status is rendering, call get_room with the roomId rather than calling redesign_room again. Use shop_item to find products for one piece of furniture in the room. Do not use Chic for photos that are not of a room (selfies, people, pets, products, outdoor scenes, documents), for general decorating advice without a photo, or to add people, weapons, drugs or explicit content to a photo. Product links go to third-party retailers, and Chic may earn a commission on purchases. Give the user the roomUrl so they can open the room on usechic.com.";

/**
 * Requests Chic declines before spending a render: putting people into the
 * photo, and things ChatGPT apps may not depict or sell (weapons, drugs and
 * tobacco, explicit or hateful content). Kept narrow on purpose; ordinary
 * decor words like "nude tones", "kids' room" or "gunmetal" pass.
 */
const PERSON_WORDS =
  "person|people|man|woman|men|women|child|children|kid|kids|baby|boy|girl|guy|lady|myself|me|us|family|wife|husband|son|daughter|mom|dad|mother|father|friend|girlfriend|boyfriend|celebrity";
const ADD_PERSON = new RegExp(
  `\\b(?:add|put|place|insert|include|draw|render|paint|photoshop)\\s+(?:(?:a|an|the|some|two|three|several|my|our|\\d+)\\s+)?(?:(?:young|old|little|small|happy|smiling|naked|nude)\\s+)?(?:${PERSON_WORDS})\\b(?![-'’])(?=\\s*$|\\s*[.,!?;]|\\s+(?:sitting|standing|lying|sleeping|reading|cooking|posing|walking|relaxing|working|playing|on|in|at|by|next|near|to|into|who|with|and)\\b)`,
  "i"
);
const DISALLOWED: readonly RegExp[] = [
  ADD_PERSON,
  /\b(?:selfie|face swap|my face)\b/i,
  /\b(?:guns?|firearms?|rifles?|pistols?|shotguns?|handguns?|revolvers?|ammo|ammunition|grenades?|explosives?|ar-?15)\b(?!\s*metal)/i,
  /(?<!bath\s)\bbombs?\b/i,
  /\b(?:naked|nudity|porn\w*|sex|sexual|erotic\w*|nsfw|topless|genitals?|fetish\w*|bdsm|dildos?)\b/i,
  /\bnude\s+(?:person|people|man|woman|men|women|figure|body|bodies|model|photo|picture)/i,
  /\b(?:bongs?|marijuana|cannabis|cocaine|heroin|meth|crack pipes?|cigarettes?|vapes?|vaping|hookahs?|drug paraphernalia)\b/i,
  /\b(?:swastikas?|nazi\w*|kkk|corpses?|dead bod(?:y|ies)|gore|gory)\b/i,
];

const DECLINED =
  "Chic only changes the room itself: paint, furniture, decor, lighting and layout. It does not add people, weapons, drugs or tobacco, or explicit or hateful content to photos. Ask the user for a different change to the room.";

function isDisallowedRequest(text: string): boolean {
  return DISALLOWED.some((pattern) => pattern.test(text));
}

/** Convex document ids: lowercase base32, around 32 characters. */
const ROOM_ID = /^[a-z0-9]{20,48}$/;

function secret(): string {
  const value = process.env.CHATGPT_APP_SECRET;
  if (!value) {
    throw new Error("CHATGPT_APP_SECRET is not set");
  }
  return value;
}

/** Where share links point: the deployment's canonical site in production. */
function siteUrl(): string {
  return (process.env.SITE_URL ?? siteConfig.baseUrl).replace(
    TRAILING_SLASH,
    ""
  );
}

export function shareUrl(roomId: string): string {
  return `${siteUrl()}/r/${roomId}?${UTM}`;
}

/**
 * Where product photos come from: Amazon's CDN, and Google Shopping and Lens
 * thumbnails served by Google and SerpAPI. A Lens result's full-size photo can
 * live on any retailer's host; the widget uses its thumbnail instead.
 */
const PRODUCT_IMAGE_DOMAINS = [
  "https://m.media-amazon.com",
  "https://serpapi.com",
  "https://encrypted-tbn0.gstatic.com",
  "https://encrypted-tbn1.gstatic.com",
  "https://encrypted-tbn2.gstatic.com",
  "https://encrypted-tbn3.gstatic.com",
];

/** Retailer links go out through these: Amazon, Google, and the affiliate redirects. */
const RETAIL_REDIRECT_DOMAINS = [
  "https://www.amazon.com",
  "https://amazon.com",
  "https://www.google.com",
  "https://redirect.viglink.com",
  "https://go.skimresources.com",
];

/** Origins the widget loads images from: Convex storage and product photos. */
function widgetResourceDomains(): string[] {
  const domains = [...PRODUCT_IMAGE_DOMAINS];
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (convexUrl) {
    domains.unshift(new URL(convexUrl).origin);
  }
  return domains;
}

/** Where the widget may send people: Chic itself and the retailers. */
function widgetRedirectDomains(): string[] {
  return [
    ...new Set([
      siteUrl(),
      siteConfig.baseUrl,
      `https://${siteConfig.domain}`,
      ...RETAIL_REDIRECT_DOMAINS,
    ]),
  ];
}

const AMAZON_HOST = /(^|\.)amazon\.[a-z.]+$/;

function retailerOf(product: Product): string {
  if (product.retailer) {
    return product.retailer;
  }
  try {
    const host = new URL(product.productUrl).hostname;
    return AMAZON_HOST.test(host) ? "Amazon" : host.replace(WWW_PREFIX, "");
  } catch {
    return "";
  }
}

function toProduct(product: Product) {
  return {
    imageUrl: product.thumbnailUrl ?? product.imageUrl,
    name: product.name,
    price: product.price,
    retailer: retailerOf(product),
    url: product.productUrl,
  };
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

/**
 * The file object ChatGPT passes for a `openai/fileParams` field. All four
 * properties are declared and only `download_url` and `file_id` required,
 * exactly as the Apps SDK reference demands.
 */
const openAiFile = z
  .object({
    download_url: z.string(),
    file_id: z.string(),
    file_name: z.string().optional(),
    mime_type: z.string().optional(),
  })
  .strict();

const productOut = z.object({
  imageUrl: z.string(),
  name: z.string(),
  price: z.number(),
  retailer: z.string(),
  url: z.string(),
});

const roomOut = z.object({
  afterUrl: z.string().nullable(),
  beforeUrl: z.string().nullable(),
  items: z
    .array(z.object({ id: z.string(), label: z.string() }))
    .describe(
      "Furniture found in the current photo; pass a label to shop_item"
    ),
  message: z.string().optional(),
  products: z.array(productOut),
  request: z.string().optional(),
  roomId: z.string(),
  roomUrl: z.string().describe("Public link to the room on usechic.com"),
  stage: z.string().optional(),
  status: z.enum(["rendering", "ready", "failed"]),
  title: z.string().optional(),
});

type RoomOut = z.infer<typeof roomOut>;

const shopOut = z.object({
  item: z.string(),
  products: z.array(productOut),
  roomId: z.string(),
  roomUrl: z.string(),
});

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

function toRoomOut(room: RoomSnapshot, request?: string): RoomOut {
  const picked = room.pickedProducts;
  const fromItems = room.items.flatMap((item) => item.products.slice(0, 1));
  const products = (picked.length > 0 ? picked : fromItems)
    .slice(0, MAX_PRODUCTS)
    .map(toProduct);

  let message: string | undefined;
  if (room.status === "failed") {
    message =
      room.error ?? "That change did not work. Try describing it differently.";
  } else if (room.status === "rendering") {
    message =
      "Still rendering. Call get_room with this roomId in a little while.";
  }

  return {
    afterUrl: room.afterUrl,
    beforeUrl: room.beforeUrl,
    items: room.items.map((item) => ({ id: item.id, label: item.label })),
    message,
    products,
    request: request ?? room.latestComment?.text,
    roomId: room.roomId,
    roomUrl: shareUrl(room.roomId),
    stage: room.stage,
    status: room.status,
    title: room.title,
  };
}

function summary(out: RoomOut): string {
  if (out.status === "rendering") {
    return `Chic is still rendering "${out.request ?? "the change"}". Room: ${out.roomUrl}`;
  }
  if (out.status === "failed") {
    return `The change failed: ${out.message}. Room: ${out.roomUrl}`;
  }
  const count = out.products.length;
  const shop =
    count > 0
      ? ` ${count} shoppable ${count === 1 ? "product is" : "products are"} in the card. ${AFFILIATE_NOTE}`
      : "";
  return `Here is the room after "${out.request ?? "the change"}".${shop} Open it on Chic: ${out.roomUrl}`;
}

function roomResult(out: RoomOut): CallToolResult {
  return {
    content: [{ text: summary(out), type: "text" }],
    structuredContent: out,
  };
}

const NOT_FOUND_TEXT =
  "That room was not found. It may have expired, or it was started in another ChatGPT account. Ask the user to attach the room photo again to start a new room.";

function textError(text: string): CallToolResult {
  return { content: [{ text, type: "text" }], isError: true };
}

function errorResult(error: unknown): CallToolResult {
  if (!(error instanceof ConvexError)) {
    // biome-ignore lint/suspicious/noConsole: surfaces unexpected tool failures in server logs
    console.error("[mcp] tool failed", error);
    return textError("Chic could not do that right now. Please try again.");
  }
  const text = String(error.data);
  return textError(text === "Room not found" ? NOT_FOUND_TEXT : text);
}

// ---------------------------------------------------------------------------
// Convex calls
// ---------------------------------------------------------------------------

async function loadRoom(roomId: string): Promise<RoomSnapshot | null> {
  return await fetchQuery(api.chatgpt.getRoom, {
    roomId: roomId as Id<"rooms">,
    secret: secret(),
  });
}

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Still worth waiting for: the render itself, or, for a change that picked no
 * products, the detection that finds furniture to shop for in the new photo.
 */
function stillSettling(room: RoomSnapshot | null): boolean {
  if (!room) {
    return false;
  }
  if (room.status === "rendering") {
    return true;
  }
  return (
    room.status === "ready" &&
    room.pickedProducts.length === 0 &&
    room.itemsStatus === "pending"
  );
}

/** Poll until the room settles or the wait runs out, whichever is first. */
async function waitForRender(
  roomId: string,
  deadline = Date.now() + RENDER_WAIT_MS
): Promise<RoomSnapshot | null> {
  const room = await loadRoom(roomId);
  if (!stillSettling(room) || Date.now() >= deadline) {
    return room;
  }
  await sleep(POLL_INTERVAL_MS);
  return await waitForRender(roomId, deadline);
}

/** Resolve after `ms` with `fallback`, for racing a slow search. */
const after = <T>(ms: number, fallback: T) =>
  new Promise<T>((resolve) => {
    setTimeout(() => resolve(fallback), ms);
  });

/**
 * Products for the first few distinct items in the photo, through the same
 * cached search as tapping them on usechic.com. A search that fails or runs
 * past the budget just contributes nothing.
 */
async function shopTopItems(
  room: RoomSnapshot
): Promise<ReturnType<typeof toProduct>[]> {
  const labels = [...new Set(room.items.map((item) => item.label))].slice(
    0,
    SHOP_ITEMS
  );
  const searches = labels.map((label) =>
    fetchAction(api.chatgpt.shopItem, {
      item: label,
      roomId: room.roomId,
      secret: secret(),
    })
      .then((found) => found.products.slice(0, SHOP_PRODUCTS_PER_ITEM))
      .catch(() => [])
  );
  const results = await Promise.race([
    Promise.all(searches),
    after(SHOP_BUDGET_MS, [] as Product[][]),
  ]);
  return results.flat().slice(0, MAX_PRODUCTS).map(toProduct);
}

/** The anonymized ChatGPT user id OpenAI attaches to each tool call. */
function subjectOf(ctx: ServerContext): string | undefined {
  const subject = ctx.mcpReq._meta?.["openai/subject"];
  return typeof subject === "string" ? subject : undefined;
}

const notFound = textError(NOT_FOUND_TEXT);

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

/** Mirrors `ownerFor`'s hash in `convex/chatgpt.ts`, so a subject's distinct_id
 * lines up with the Convex `userId` their rooms are stored under. */
const SUBJECT_HASH_LENGTH = 32;
const HEX_RADIX = 16;
const BYTE_HEX_WIDTH = 2;
/**
 * Unlike `ownerFor`'s shared `chatgpt-app` id, a subjectless call here gets
 * its own distinct_id rather than sharing one with every other anonymous
 * caller, so PostHog doesn't fold them all into a single "user".
 */
const ANON_DISTINCT_ID = "chatgpt-anon";

async function chatgptDistinctId(subject: string | undefined): Promise<string> {
  const trimmed = subject?.trim();
  if (!trimmed) {
    return ANON_DISTINCT_ID;
  }
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(trimmed)
  );
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(HEX_RADIX).padStart(BYTE_HEX_WIDTH, "0"))
    .join("");
  return `chatgpt:${hex.slice(0, SUBJECT_HASH_LENGTH)}`;
}

let posthogClient: PostHog | null = null;

/** `null` when PostHog is not configured, so callers can no-op cleanly. */
function posthogForServer(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) {
    return null;
  }
  posthogClient ??= new PostHog(key, { host: "https://us.i.posthog.com" });
  return posthogClient;
}

/**
 * Records one ChatGPT tool call. Awaited and flushed immediately rather than
 * left on `posthog-node`'s usual timer, because this route runs in a
 * serverless function that can freeze right after the response goes out.
 * Never throws: a PostHog outage must not fail `redesign_room`, `get_room`
 * or `shop_item`.
 */
async function trackToolCall(
  tool: string,
  subject: string | undefined,
  outcome: { isError: boolean; ms: number; products?: number }
): Promise<void> {
  const client = posthogForServer();
  if (!client) {
    return;
  }
  try {
    client.capture({
      distinctId: await chatgptDistinctId(subject),
      event: "chatgpt_tool_called",
      properties: {
        isError: outcome.isError,
        ms: outcome.ms,
        products: outcome.products,
        status: outcome.isError ? "error" : "ok",
        tool,
      },
    });
    await client.flush();
  } catch {
    // Analytics must never break a tool call.
  }
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const widgetMeta = {
  "openai/outputTemplate": WIDGET_URI,
  ui: { resourceUri: WIDGET_URI },
};

export function registerChicApp(server: McpServer) {
  server.registerResource(
    "chic-room-widget",
    WIDGET_URI,
    {
      description: "Before/after card for a Chic room with shoppable products",
      mimeType: WIDGET_MIME_TYPE,
      title: "Chic room",
    },
    () => {
      const resourceDomains = widgetResourceDomains();
      return {
        contents: [
          {
            _meta: {
              "openai/widgetCSP": {
                connect_domains: [],
                redirect_domains: widgetRedirectDomains(),
                resource_domains: resourceDomains,
              },
              "openai/widgetDescription":
                "Shows the user's room before and after the change with a comparison slider, real products they can buy, and a link to open the room on Chic. No need to repeat the products or images in text.",
              "openai/widgetPrefersBorder": true,
              ui: {
                csp: { connectDomains: [], resourceDomains },
                prefersBorder: true,
              },
            },
            mimeType: WIDGET_MIME_TYPE,
            text: WIDGET_HTML,
            uri: WIDGET_URI,
          },
        ],
      };
    }
  );

  server.registerTool(
    "redesign_room",
    {
      _meta: {
        ...widgetMeta,
        "openai/fileParams": ["image"],
        "openai/toolInvocation/invoked": "Room redesigned",
        "openai/toolInvocation/invoking": "Redesigning your room…",
      },
      annotations: {
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        readOnlyHint: false,
      },
      description:
        "Use this when the user shares a photo of an interior room (living room, bedroom, kitchen, office and so on) and asks to change it: wall colour, furniture, decor, lighting, layout or style. Renders the change into their photo, returns before/after images and real products to buy, and saves the room at a link anyone with it can open on usechic.com (it expires after a few days). To change the same room again, pass roomId instead of image. Each call renders a new version and counts toward daily limits, so if status is rendering, call get_room instead of calling this again. Do not use this for photos that are not of a room (selfies, people, pets, single products, outdoor scenes, documents), without a photo, for decorating advice that needs no image, or to add people, weapons, drugs or explicit content.",
      inputSchema: z.object({
        image: openAiFile
          .optional()
          .describe(
            "The photo of the room the user attached in this conversation (JPEG, PNG or WebP, under 20 MB). Required when there is no roomId. Never pass a photo of a person."
          ),
        request: z
          .string()
          .min(1)
          .max(MAX_REQUEST_LENGTH)
          .describe(
            "The change to make, in the user's own words, e.g. 'paint the walls sage green and swap the sofa for a leather one'"
          ),
        roomId: z
          .string()
          .optional()
          .describe(
            "The roomId from an earlier redesign_room result in this conversation, to change that room again. Omit when starting from a new photo."
          ),
        title: z
          .string()
          .max(MAX_TITLE_LENGTH)
          .optional()
          .describe(
            "Short name for a new room, e.g. 'Living room'. Ignored with roomId."
          ),
      }),
      outputSchema: roomOut,
      title: "Redesign a room",
    },
    async ({ image, request, roomId, title }, ctx) => {
      const subject = subjectOf(ctx);
      const startedAt = Date.now();
      if (isDisallowedRequest(request)) {
        return textError(DECLINED);
      }
      if (roomId && !ROOM_ID.test(roomId)) {
        return notFound;
      }
      try {
        let id = roomId;
        if (!id) {
          if (!image) {
            return textError(
              "No room photo was attached. Ask the user to attach a photo of the room they want to change (JPEG, PNG or WebP), then try again."
            );
          }
          const created = await fetchAction(api.chatgpt.createRoomFromImage, {
            imageUrl: image.download_url,
            secret: secret(),
            subject,
            title,
          });
          id = created.roomId;
        }

        await fetchMutation(api.chatgpt.addComment, {
          roomId: id as Id<"rooms">,
          secret: secret(),
          subject,
          text: request,
        });

        const room = await waitForRender(id);
        if (!room) {
          return notFound;
        }
        const out = toRoomOut(room, request);
        if (out.status === "ready" && out.products.length === 0) {
          out.products = await shopTopItems(room);
        }
        await trackToolCall("redesign_room", subject, {
          isError: false,
          ms: Date.now() - startedAt,
          products: out.products.length,
        });
        return roomResult(out);
      } catch (error) {
        await trackToolCall("redesign_room", subject, {
          isError: true,
          ms: Date.now() - startedAt,
        });
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "get_room",
    {
      _meta: {
        ...widgetMeta,
        "openai/toolInvocation/invoked": "Room loaded",
        "openai/toolInvocation/invoking": "Checking your room…",
        "openai/widgetAccessible": true,
      },
      annotations: {
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
        readOnlyHint: true,
      },
      description:
        "Use this to check on a room that redesign_room returned in this conversation, for example when its status was rendering, or to show it again. Returns the latest before/after images, products and the room link. Read-only: it never changes the room. Do not use this to find or browse other people's rooms.",
      inputSchema: z.object({
        roomId: z
          .string()
          .describe("The roomId from an earlier redesign_room result"),
      }),
      outputSchema: roomOut,
      title: "Check a room",
    },
    async ({ roomId }, ctx) => {
      const subject = subjectOf(ctx);
      const startedAt = Date.now();
      if (!ROOM_ID.test(roomId)) {
        return notFound;
      }
      try {
        const room = await loadRoom(roomId);
        if (!room) {
          return notFound;
        }
        const out = toRoomOut(room);
        await trackToolCall("get_room", subject, {
          isError: false,
          ms: Date.now() - startedAt,
          products: out.products.length,
        });
        return roomResult(out);
      } catch (error) {
        await trackToolCall("get_room", subject, {
          isError: true,
          ms: Date.now() - startedAt,
        });
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    "shop_item",
    {
      _meta: {
        "openai/toolInvocation/invoked": "Found products",
        "openai/toolInvocation/invoking": "Finding products…",
      },
      annotations: {
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
        readOnlyHint: true,
      },
      description:
        "Use this when the user wants to buy, or see options for, one specific piece of furniture or decor in a room from redesign_room, such as the sofa or the rug. Returns real products with prices and links to third-party retailers; purchases happen on the retailer's site, and Chic may earn a commission. Do not use this for general shopping without a Chic room, or for items not in the room's items list.",
      inputSchema: z.object({
        item: z
          .string()
          .min(1)
          .max(MAX_TITLE_LENGTH)
          .describe(
            "The item's label from the room's items list, e.g. 'sofa' or 'area rug'"
          ),
        roomId: z
          .string()
          .describe("The roomId from an earlier redesign_room result"),
      }),
      outputSchema: shopOut,
      title: "Shop an item in a room",
    },
    async ({ item, roomId }, ctx) => {
      const subject = subjectOf(ctx);
      const startedAt = Date.now();
      if (!ROOM_ID.test(roomId)) {
        return notFound;
      }
      try {
        const found = await fetchAction(api.chatgpt.shopItem, {
          item,
          roomId: roomId as Id<"rooms">,
          secret: secret(),
        });
        const out = {
          item: found.item.label,
          products: found.products.slice(0, MAX_PRODUCTS).map(toProduct),
          roomId,
          roomUrl: shareUrl(roomId),
        };
        const lines = out.products.map(
          (product) =>
            `- ${product.name} — $${product.price.toFixed(2)} (${product.retailer}): ${product.url}`
        );
        await trackToolCall("shop_item", subject, {
          isError: false,
          ms: Date.now() - startedAt,
          products: out.products.length,
        });
        return {
          content: [
            {
              text:
                lines.length > 0
                  ? `Products for the ${out.item}:\n${lines.join("\n")}\n${AFFILIATE_NOTE}`
                  : `No products were found for the ${out.item} right now. Try again shortly, or open the room on Chic: ${out.roomUrl}`,
              type: "text",
            },
          ],
          structuredContent: out,
        };
      } catch (error) {
        await trackToolCall("shop_item", subject, {
          isError: true,
          ms: Date.now() - startedAt,
        });
        return errorResult(error);
      }
    }
  );
}
