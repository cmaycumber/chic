/**
 * Product search across retailers, through SerpAPI.
 *
 * - Google Lens (`engine=google_lens`, https://serpapi.com/google-lens-api):
 *   a crop of the piece itself, matched by how it looks, with the piece's name
 *   as `q` (on a bare crop Lens often answers nothing at all). Lens takes an
 *   image URL and has no crop region, hence the crop. Only matches with a
 *   dollar price on a product page are kept; the rest are blog posts, mood
 *   boards, shop home pages and 3D models.
 * - Google Shopping (`engine=google_shopping`,
 *   https://serpapi.com/google-shopping-api): the text query across merchants.
 *   Its links open Google's product panel, not the merchant, so they cannot
 *   be affiliated.
 * - Amazon (`engine=amazon`, ./amazonSearch.ts): the text query on Amazon.
 *
 * Each SerpAPI search is billed, so every provider answer is cached on its
 * own key for a fortnight, and one search runs at most MAX_PROVIDER_CALLS
 * providers.
 */

import { monetize } from "./affiliateLinks";
import { searchAmazon } from "./amazonSearch";

export interface Product {
  imageUrl: string;
  name: string;
  price: number;
  productUrl: string;
  rating?: number;
  /** The shop selling it, e.g. "Amazon", "Wayfair". */
  retailer?: string;
  reviewCount?: number;
  /** A small copy of the photo for lists; `imageUrl` is the full one. */
  thumbnailUrl?: string;
}

export type ProviderName = "amazon" | "lens" | "shopping";

const PROVIDER_NAMES: readonly ProviderName[] = ["lens", "shopping", "amazon"];

/**
 * Lens finds the piece in the photo; Amazon is where the money is (tagged
 * links, clean catalogue shots, ratings). Shopping's merchant spread comes
 * with Google links that pay nothing, so it is opt-in through
 * PRODUCT_PROVIDERS (comma-separated, in order).
 */
const DEFAULT_PROVIDERS: readonly ProviderName[] = ["lens", "amazon"];
/** Paid SerpAPI searches one product search may make on a cache miss. */
export const MAX_PROVIDER_CALLS = 2;
/** Results each provider contributes before merging. */
const PER_PROVIDER_LIMIT = 6;
/** What a merged search hands back. */
export const MAX_PRODUCTS = 8;

const ERROR_TEXT_MAX_LENGTH = 200;
const SERPAPI_URL = "https://serpapi.com/search.json";
const AMAZON_RETAILER = "Amazon";
const WHITESPACE_RUN = /\s+/g;
const NON_WORD = /[^a-z0-9]+/g;
const LIST_SEPARATOR = /[,\s]+/;
const DOLLARS = "$";
const SOURCE_TAGLINE = /\s[|–-]\s/;
/** Longer than any shop name; a `source` this long is a page title. */
const MAX_RETAILER_LENGTH = 32;
const TITLE_PREFIX_LENGTH = 20;
const WWW_PREFIX = /^www\./;
/**
 * Words of the label Lens gets as its query. A whole label ("arched floor
 * lamp") often makes Lens answer with an AI overview and no matches at all;
 * the head noun ("floor lamp", "velvet sofa") keeps it shopping.
 */
const HINT_WORDS = 2;
/** Lens matches that sell a model of the piece, not the piece. */
const NOT_FURNITURE = /\b3d model\b|\bcgtrader\b|\bturbosquid\b|\b3dsky\b/i;

// biome-ignore-start lint/style/useNamingConvention: SerpAPI uses snake_case
interface SerpLensMatch {
  image?: string;
  link?: string;
  price?: { currency?: string; extracted_value?: number; value?: string };
  rating?: number;
  reviews?: number;
  source?: string;
  thumbnail?: string;
  title?: string;
}

interface SerpShoppingResult {
  extracted_price?: number;
  product_link?: string;
  rating?: number;
  reviews?: number;
  serpapi_thumbnail?: string;
  source?: string;
  thumbnail?: string;
  title?: string;
}

interface SerpResponse {
  error?: string;
  shopping_results?: SerpShoppingResult[];
  visual_matches?: SerpLensMatch[];
}
// biome-ignore-end lint/style/useNamingConvention: SerpAPI uses snake_case

async function serpApi(params: Record<string, string>): Promise<SerpResponse> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "SERPAPI_API_KEY is not set. Add it to your Convex environment variables."
    );
  }
  const search = new URLSearchParams({
    ...params,
    // biome-ignore lint/style/useNamingConvention: SerpAPI parameter
    api_key: apiKey,
  });
  const response = await fetch(`${SERPAPI_URL}?${search}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `SerpAPI HTTP ${response.status}: ${text.slice(0, ERROR_TEXT_MAX_LENGTH)}`
    );
  }
  const data = (await response.json()) as SerpResponse;
  // Lens answers "no results" as an error; that is an empty search, not a failure.
  if (data.error && !data.error.startsWith("Google Lens hasn't returned")) {
    throw new Error(`SerpAPI error: ${data.error}`);
  }
  return data;
}

/** A page about one thing, not a shop's front door. */
function isProductPage(url: string): boolean {
  try {
    return new URL(url).pathname.replaceAll("/", "").length > 0;
  } catch {
    return false;
  }
}

/**
 * The shop behind a Lens match. `source` is usually its name, sometimes with
 * a tagline ("Dandy Home and Ranch | Home Decor, Clothing, and Gifts") and
 * sometimes the page title itself; then the link's host names the shop.
 */
function lensRetailer(
  source: string | undefined,
  title: string,
  link: string
): string | undefined {
  const parts = (source ?? "")
    .split(SOURCE_TAGLINE)
    .map((part) => part.trim())
    .filter(Boolean);
  const name = parts.reduce<string | undefined>(
    (shortest, part) =>
      shortest === undefined || part.length < shortest.length ? part : shortest,
    undefined
  );
  const looksLikeTitle =
    !name ||
    name.length > MAX_RETAILER_LENGTH ||
    title.startsWith(name.slice(0, TITLE_PREFIX_LENGTH));
  if (!looksLikeTitle) {
    return name;
  }
  try {
    return new URL(link).hostname.replace(WWW_PREFIX, "");
  } catch {
    return name;
  }
}

function lensProduct(match: SerpLensMatch): Product | null {
  const price = match.price?.extracted_value;
  const image = match.image || match.thumbnail;
  if (
    !(match.title && match.link && image) ||
    price === undefined ||
    (match.price?.currency ?? DOLLARS) !== DOLLARS ||
    !isProductPage(match.link) ||
    NOT_FURNITURE.test(`${match.title} ${match.source ?? ""}`)
  ) {
    return null;
  }
  return {
    imageUrl: image,
    name: match.title,
    price,
    productUrl: monetize(match.link),
    rating: match.rating,
    retailer: lensRetailer(match.source, match.title, match.link),
    reviewCount: match.reviews,
    thumbnailUrl: match.thumbnail,
  };
}

/**
 * Products that look like the piece in `imageUrl` (a public image URL).
 * `hint` names it ("coffee table") so Lens shops for that and not the rug
 * that made it into the crop.
 */
export async function searchLens(
  imageUrl: string,
  hint?: string,
  limit: number = PER_PROVIDER_LIMIT
): Promise<Product[]> {
  const data = await serpApi({
    country: "us",
    engine: "google_lens",
    hl: "en",
    type: "all",
    url: imageUrl,
    ...(hint ? { q: hint } : {}),
  });
  return (data.visual_matches ?? [])
    .flatMap((match) => lensProduct(match) ?? [])
    .slice(0, limit);
}

function shoppingProduct(result: SerpShoppingResult): Product | null {
  const image = result.thumbnail || result.serpapi_thumbnail;
  if (
    !(result.title && result.product_link && image) ||
    result.extracted_price === undefined
  ) {
    return null;
  }
  return {
    imageUrl: image,
    name: result.title,
    price: result.extracted_price,
    productUrl: monetize(result.product_link),
    rating: result.rating,
    retailer: result.source,
    reviewCount: result.reviews,
  };
}

/** Google Shopping results for a text query, across merchants. */
export async function searchShopping(
  query: string,
  limit: number = PER_PROVIDER_LIMIT
): Promise<Product[]> {
  const data = await serpApi({
    engine: "google_shopping",
    gl: "us",
    hl: "en",
    q: query,
  });
  return (data.shopping_results ?? [])
    .flatMap((result) => shoppingProduct(result) ?? [])
    .slice(0, limit);
}

/** Amazon results for a text query, labelled with their retailer. */
async function searchAmazonProducts(
  query: string,
  limit: number = PER_PROVIDER_LIMIT
): Promise<Product[]> {
  const products = await searchAmazon(query, limit);
  return products.map((product) => ({
    ...product,
    retailer: AMAZON_RETAILER,
  }));
}

/** The providers to ask, in order: PRODUCT_PROVIDERS, else the default. */
export function configuredProviders(
  setting: string | undefined = process.env.PRODUCT_PROVIDERS
): ProviderName[] {
  const named = (setting ?? "")
    .toLowerCase()
    .split(LIST_SEPARATOR)
    .filter((name): name is ProviderName =>
      PROVIDER_NAMES.includes(name as ProviderName)
    );
  return named.length > 0 ? [...new Set(named)] : [...DEFAULT_PROVIDERS];
}

/** The cache key for a text search; Amazon keeps the bare query it always had. */
export function textCacheKey(provider: ProviderName, query: string): string {
  const normalized = query.trim().toLowerCase().replace(WHITESPACE_RUN, " ");
  return provider === "amazon" ? normalized : `${provider}:${normalized}`;
}

/** Where a product-search answer is kept between calls. */
export interface ProductCache {
  get: (key: string) => Promise<Product[] | null>;
  set: (key: string, products: Product[]) => Promise<void>;
}

/** A picture of the piece to search by, made only when it is needed. */
export interface SearchImage {
  /** Stable for the same pixels, so a repeat search is a cache hit. */
  cacheKey: string;
  /** What the piece is, e.g. "Coffee table". */
  hint?: string;
  /** A public URL of the picture; may upload it, so called at most once. */
  resolveUrl: () => Promise<string>;
}

export interface ProductSearch {
  image?: SearchImage;
  providers?: ProviderName[];
  query: string;
}

/** "Arched Floor Lamp" → "floor lamp". */
export function lensHint(label?: string): string | undefined {
  const words = (label ?? "")
    .toLowerCase()
    .split(WHITESPACE_RUN)
    .filter(Boolean);
  return words.length > 0 ? words.slice(-HINT_WORDS).join(" ") : undefined;
}

/** One provider's answer and what it cost. */
export interface ProviderRun {
  cache: "hit" | "miss";
  count: number;
  error?: string;
  ms: number;
  products: Product[];
  provider: ProviderName;
}

interface Step {
  key: string;
  provider: ProviderName;
  run: () => Promise<Product[]>;
}

function plannedSteps(search: ProductSearch): Step[] {
  const providers = search.providers ?? configuredProviders();
  const { image, query } = search;
  const steps = providers.flatMap((provider): Step[] => {
    if (provider === "lens") {
      const hint = lensHint(image?.hint);
      return image
        ? [
            {
              key: `lens:${image.cacheKey}${hint ? `:${hint}` : ""}`,
              provider,
              run: async () => searchLens(await image.resolveUrl(), hint),
            },
          ]
        : [];
    }
    if (!query.trim()) {
      return [];
    }
    return [
      {
        key: textCacheKey(provider, query),
        provider,
        run: () =>
          provider === "shopping"
            ? searchShopping(query)
            : searchAmazonProducts(query),
      },
    ];
  });
  return steps.slice(0, MAX_PROVIDER_CALLS);
}

async function runStep(step: Step, cache: ProductCache): Promise<ProviderRun> {
  const startedAt = Date.now();
  const cached = await cache.get(step.key);
  let products = cached;
  let error: string | undefined;
  if (!products) {
    try {
      products = await step.run();
      // Lens sometimes answers a crop with nothing and the same crop with
      // dozens a minute later; an empty answer is not worth keeping.
      if (products.length > 0) {
        await cache.set(step.key, products);
      }
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught);
      products = [];
    }
  }
  const run: ProviderRun = {
    cache: cached ? "hit" : "miss",
    count: products.length,
    error,
    ms: Date.now() - startedAt,
    products,
    provider: step.provider,
  };
  // biome-ignore lint/suspicious/noConsole: usage telemetry for cost tracking
  console.info("[roomsAi] products", {
    cache: run.cache,
    count: run.count,
    key: step.key,
    ms: run.ms,
    provider: run.provider,
    ...(error ? { error: error.slice(0, ERROR_TEXT_MAX_LENGTH) } : {}),
  });
  return run;
}

/** host + path, lower-cased: the same listing behind different tracking. */
function listingKey(url: string): string {
  try {
    const parsed = new URL(url);
    const inner =
      parsed.searchParams.get("u") ?? parsed.searchParams.get("url");
    const target = inner ? new URL(inner) : parsed;
    return `${target.hostname}${target.pathname}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

const titleKey = (name: string) => name.toLowerCase().replace(NON_WORD, " ");

/** Each listing once, in provider order, up to `limit`. */
export function mergeProducts(
  lists: Product[][],
  limit: number = MAX_PRODUCTS
): Product[] {
  const seen = new Set<string>();
  const merged: Product[] = [];
  for (const product of lists.flat()) {
    const keys = [listingKey(product.productUrl), titleKey(product.name)];
    if (keys.some((key) => seen.has(key))) {
      continue;
    }
    for (const key of keys) {
      seen.add(key);
    }
    merged.push(product);
    if (merged.length >= limit) {
      break;
    }
  }
  return merged;
}

/**
 * Products for one piece: what looks like it first, then what the words find.
 * A provider that fails drops out; the search fails only when all of them do.
 */
export async function searchProducts(
  search: ProductSearch,
  cache: ProductCache
): Promise<{ products: Product[]; runs: ProviderRun[] }> {
  const steps = plannedSteps(search);
  const runs = await Promise.all(steps.map((step) => runStep(step, cache)));
  const failed = runs.filter((run) => run.error);
  if (runs.length > 0 && failed.length === runs.length) {
    throw new Error(failed.at(0)?.error ?? "Product search failed");
  }
  return {
    products: mergeProducts(runs.map((run) => run.products)),
    runs,
  };
}
