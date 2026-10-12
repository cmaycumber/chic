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

const TRAILING_SLASH = /\/$/;
const WWW_PREFIX = /^www\./;

export const SERVER_INSTRUCTIONS =
  "Chic redesigns a photo of a real room and makes it shoppable. When the user shares a room photo and asks for a change (paint, furniture, style), call redesign_room with the photo and their request in their words. To change the same room again, pass the roomId from the last result instead of the photo. If status is rendering, wait and call get_room with the roomId. Use shop_item to find products for one piece of furniture in the room. Always give the user the roomUrl so they can open the room on usechic.com.";

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
      ? ` ${count} shoppable ${count === 1 ? "product is" : "products are"} in the card.`
      : "";
  return `Here is the room after "${out.request ?? "the change"}".${shop} Open it on Chic: ${out.roomUrl}`;
}

function roomResult(out: RoomOut): CallToolResult {
  return {
    content: [{ text: summary(out), type: "text" }],
    structuredContent: out,
  };
}

function errorResult(error: unknown): CallToolResult {
  const text =
    error instanceof ConvexError
      ? String(error.data)
      : "Chic could not do that right now. Please try again.";
  if (!(error instanceof ConvexError)) {
    // biome-ignore lint/suspicious/noConsole: surfaces unexpected tool failures in server logs
    console.error("[mcp] tool failed", error);
  }
  return { content: [{ text, type: "text" }], isError: true };
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

const notFound: CallToolResult = {
  content: [{ text: "That room was not found or has expired.", type: "text" }],
  isError: true,
};

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
        "Use this when the user shares a photo of a room and asks to change it: paint, furniture, decor, style. Renders the change into their photo with Chic, returns before/after images and real products to buy, and creates a public link to the room on usechic.com. To change the same room again, pass roomId instead of image.",
      inputSchema: z.object({
        image: openAiFile
          .optional()
          .describe(
            "The room photo the user attached. Required without roomId."
          ),
        request: z
          .string()
          .min(1)
          .max(MAX_REQUEST_LENGTH)
          .describe("What to change, in the user's words"),
        roomId: z
          .string()
          .optional()
          .describe("A roomId from an earlier result, to keep editing it"),
        title: z
          .string()
          .max(MAX_TITLE_LENGTH)
          .optional()
          .describe("Short name for the room, e.g. 'Living room'"),
      }),
      outputSchema: roomOut,
      title: "Redesign a room",
    },
    async ({ image, request, roomId, title }, ctx) => {
      const subject = subjectOf(ctx);
      try {
        let id = roomId;
        if (!id) {
          if (!image) {
            return {
              content: [
                {
                  text: "Ask the user to attach a photo of their room first.",
                  type: "text",
                },
              ],
              isError: true,
            };
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
        return roomResult(out);
      } catch (error) {
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
        "Use this to check on a room from redesign_room, for example when its status was rendering. Returns the latest before/after images, products and the room link.",
      inputSchema: z.object({
        roomId: z.string().describe("The roomId from redesign_room"),
      }),
      outputSchema: roomOut,
      title: "Get a room",
    },
    async ({ roomId }) => {
      try {
        const room = await loadRoom(roomId);
        return room ? roomResult(toRoomOut(room)) : notFound;
      } catch (error) {
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
        "Use this when the user wants to buy a specific piece of furniture or decor seen in a Chic room, such as the sofa or the rug. Returns real products with prices and links.",
      inputSchema: z.object({
        item: z
          .string()
          .min(1)
          .describe("The item's label from the room's items, e.g. 'sofa'"),
        roomId: z.string().describe("The roomId from redesign_room"),
      }),
      outputSchema: shopOut,
      title: "Shop an item",
    },
    async ({ item, roomId }) => {
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
        return {
          content: [
            {
              text: `Products for the ${out.item}:\n${lines.join("\n")}`,
              type: "text",
            },
          ],
          structuredContent: out,
        };
      } catch (error) {
        return errorResult(error);
      }
    }
  );
}
