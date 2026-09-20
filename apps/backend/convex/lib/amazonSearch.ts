/**
 * Amazon product search via SerpAPI.
 * Docs: https://serpapi.com/amazon-search-api
 */
import { addAffiliateTag } from "./amazonAffiliate";

const ERROR_TEXT_MAX_LENGTH = 200;
/** Amazon "4 stars & up" filter. */
const DEFAULT_FILTERS = "p_72:1248897011";

export interface AmazonProduct {
  imageUrl: string;
  name: string;
  price: number;
  productUrl: string;
  rating?: number;
  reviewCount?: number;
}

interface SerpAmazonResult {
  // biome-ignore lint/style/useNamingConvention: SerpAPI uses snake_case
  extracted_price?: number;
  link?: string;
  // biome-ignore lint/style/useNamingConvention: SerpAPI uses snake_case
  link_clean?: string;
  rating?: number;
  reviews?: number;
  thumbnail?: string;
  title?: string;
}

interface SerpApiResponse {
  error?: string;
  // biome-ignore lint/style/useNamingConvention: SerpAPI uses snake_case
  organic_results?: SerpAmazonResult[];
}

const WHITESPACE_RUN = /\s+/g;

/**
 * The cache key for a search. Two detections that differ only in spacing or
 * capitalisation are the same question, and asking it twice costs real money.
 */
export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase().replace(WHITESPACE_RUN, " ");
}

function toProduct(item: SerpAmazonResult): AmazonProduct | null {
  const rawUrl = item.link_clean || item.link;
  if (
    !(item.title && rawUrl && item.thumbnail) ||
    item.extracted_price === undefined
  ) {
    return null;
  }
  return {
    imageUrl: item.thumbnail,
    name: item.title,
    price: item.extracted_price,
    productUrl: addAffiliateTag(rawUrl),
    rating: item.rating,
    reviewCount: item.reviews,
  };
}

/**
 * Search Amazon for products matching `query`. Returns up to `limit` results
 * with images, prices and affiliate-tagged links.
 */
export async function searchAmazon(
  query: string,
  limit: number,
  filters: string = DEFAULT_FILTERS
): Promise<AmazonProduct[]> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "SERPAPI_API_KEY is not set. Add it to your Convex environment variables."
    );
  }

  const params = new URLSearchParams({
    // biome-ignore lint/style/useNamingConvention: SerpAPI parameter
    amazon_domain: "amazon.com",
    // biome-ignore lint/style/useNamingConvention: SerpAPI parameter
    api_key: apiKey,
    engine: "amazon",
    k: query,
    rh: filters,
  });

  const response = await fetch(`https://serpapi.com/search?${params}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `SerpAPI HTTP ${response.status}: ${text.slice(0, ERROR_TEXT_MAX_LENGTH)}`
    );
  }

  const data = (await response.json()) as SerpApiResponse;
  if (data.error) {
    throw new Error(`SerpAPI error: ${data.error}`);
  }

  const products: AmazonProduct[] = [];
  for (const item of data.organic_results ?? []) {
    const product = toProduct(item);
    if (product) {
      products.push(product);
    }
    if (products.length >= limit) {
      break;
    }
  }
  return products;
}
