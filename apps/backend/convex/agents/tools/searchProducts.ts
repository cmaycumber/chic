/**
 * Search Products Tool
 *
 * Uses SerpAPI's Amazon Search API to find real furniture and decor products
 * that match a design plan, style, and budget.
 *
 * Best practices:
 * - Use specific, detailed queries (style, color, material, size)
 * - Apply 4+ star filter by default for quality
 * - Use price filters when budget-conscious
 */
"use node";
import { createTool } from "@convex-dev/agent";
import z from "zod";
import { addAffiliateTag } from "../../lib/amazonAffiliate";
import type { Product } from "./index";

const DEFAULT_PRODUCTS_PER_QUERY = 2;
const MAX_PRODUCTS_PER_QUERY = 5;
const MIN_PRODUCTS_PER_QUERY = 1;
const MAX_QUERIES_PER_CALL = 10;
const ERROR_TEXT_MAX_LENGTH = 200;

interface AmazonProduct {
  asin?: string;
  // biome-ignore lint/style/useNamingConvention: SerpAPI uses snake_case
  extracted_old_price?: number;
  // biome-ignore lint/style/useNamingConvention: SerpAPI uses snake_case
  extracted_price?: number;
  link?: string;
  // biome-ignore lint/style/useNamingConvention: SerpAPI uses snake_case
  link_clean?: string;
  // biome-ignore lint/style/useNamingConvention: SerpAPI uses snake_case
  old_price?: string;
  position?: number;
  price?: string;
  rating?: number;
  reviews?: number;
  thumbnail?: string;
  title?: string;
}

interface SerpApiResponse {
  error?: string;
  // biome-ignore lint/style/useNamingConvention: SerpAPI uses snake_case
  organic_results?: AmazonProduct[];
  // biome-ignore lint/style/useNamingConvention: SerpAPI uses snake_case
  search_information?: {
    // biome-ignore lint/style/useNamingConvention: SerpAPI uses snake_case
    query_displayed?: string;
  };
}

/**
 * Parse price from Amazon product data
 * SerpAPI provides extracted_price as a number, which is what we want
 */
function parsePrice(product: AmazonProduct): number | null {
  // SerpAPI provides extracted_price as the numeric value
  if (product.extracted_price !== undefined) {
    return product.extracted_price;
  }

  return null;
}

/**
 * Custom SerpAPI client for Amazon Search
 * Based on: https://serpapi.com/amazon-search-api
 * Filters docs: https://serpapi.com/amazon-filters
 */
async function fetchAmazonProducts(
  apiKey: string,
  searchQuery: string,
  rhFilters?: string
): Promise<AmazonProduct[]> {
  // Queries should already be fully detailed; just add category for Amazon's algorithm
  const enhancedQuery = `${searchQuery} furniture home decor`;

  // Build the query parameters exactly like the curl command
  const params = new URLSearchParams({
    // biome-ignore lint/style/useNamingConvention: SerpAPI parameter
    amazon_domain: "amazon.com",
    // biome-ignore lint/style/useNamingConvention: SerpAPI parameter
    api_key: apiKey,
    engine: "amazon",
    k: enhancedQuery, // Amazon uses 'k' for keyword search
  });

  // Add rh filters if provided (e.g., "p_72:1248897011,p_76:1249146011")
  if (rhFilters) {
    params.append("rh", rhFilters);
  }

  const url = `https://serpapi.com/search?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `SerpAPI HTTP ${response.status}: ${errorText.slice(0, ERROR_TEXT_MAX_LENGTH)}`
      );
    }

    const data: SerpApiResponse = await response.json();

    // Check for API-level errors
    if ("error" in data && data.error) {
      throw new Error(`SerpAPI error: ${data.error}`);
    }

    const organicResults = data.organic_results;

    if (!organicResults || organicResults.length === 0) {
      throw new Error(
        `No products found for "${searchQuery}". Try a different design plan or style.`
      );
    }

    return organicResults;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`SerpAPI request failed: ${error.message}`, {
        cause: error,
      });
    }
    throw new Error("SerpAPI request failed with unknown error", {
      cause: error,
    });
  }
}

/**
 * Searches Amazon for products that match a design plan
 */
// biome-ignore lint/style/useNamingConvention: OpenAI tool names use snake_case
export const search_products = createTool({
  description:
    "Find real furniture and decor on Amazon. Returns products with images, prices, ratings, and purchase links. Always use the 4+ star filter for quality.",
  execute: async (_ctx, args) => {
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "SERPAPI_API_KEY environment variable is not set. Please add it to your Convex environment variables."
      );
    }

    // Search for each query in parallel
    const searchPromises = args.queries.map(async (queryObj) => {
      const maxResults = Math.min(
        Math.max(
          queryObj.maxResults || DEFAULT_PRODUCTS_PER_QUERY,
          MIN_PRODUCTS_PER_QUERY
        ),
        MAX_PRODUCTS_PER_QUERY
      );

      // Add "furniture home decor" to help Amazon understand the category
      const enhancedQuery = `${queryObj.query} furniture home decor`;
      const results = await fetchAmazonProducts(
        apiKey,
        enhancedQuery,
        queryObj.filters
      );

      // Parse products for this specific query
      return parseProductsFromResults(results, maxResults, undefined);
    });

    const allProductArrays = await Promise.all(searchPromises);

    // Flatten all results into a single array
    const allProducts = allProductArrays.flat();

    if (allProducts.length === 0) {
      throw new Error(
        "No products found matching the queries. Try different search terms or adjust the filters."
      );
    }

    return allProducts;
  },
  inputSchema: z.object({
    queries: z
      .array(
        z.object({
          filters: z
            .string()
            .optional()
            .describe(
              `Amazon rh filters. Common: "p_72:1248897011" (4+ stars, RECOMMENDED), "p_36:1253506011" ($100-200). Combine with commas.`
            ),
          maxResults: z
            .number()
            .optional()
            .default(DEFAULT_PRODUCTS_PER_QUERY)
            .describe(
              `Products per query (default: ${DEFAULT_PRODUCTS_PER_QUERY}, max: ${MAX_PRODUCTS_PER_QUERY})`
            ),
          query: z
            .string()
            .describe(
              "Detailed search: include style, color, material, size. Example: 'modern grey velvet sectional sofa 90 inch'"
            ),
        })
      )
      .min(1)
      .max(MAX_QUERIES_PER_CALL)
      .describe("Search queries with specific product details"),
  }),
});

/**
 * Parse products from Amazon search results
 */
function parseProductsFromResults(
  results: AmazonProduct[],
  count: number,
  maxPrice: number | undefined
): Product[] {
  const products: Product[] = [];

  for (const item of results) {
    if (products.length >= count) {
      break;
    }

    const price = parsePrice(item);

    // Skip items without required fields
    if (!item.title) {
      continue;
    }
    // Prefer link_clean over link for cleaner URLs
    const rawProductUrl = item.link_clean || item.link;
    if (!rawProductUrl) {
      continue;
    }
    if (!item.thumbnail) {
      continue;
    }
    if (price === null) {
      continue;
    }

    // Apply budget filter if specified
    if (maxPrice !== undefined && price > maxPrice) {
      continue;
    }

    // Add affiliate tag to product URL
    const productUrl = addAffiliateTag(rawProductUrl);

    products.push({
      description: item.title,
      imageUrl: item.thumbnail,
      name: item.title,
      price,
      productUrl,
      rating: item.rating,
      reviewCount: item.reviews,
    });
  }

  return products;
}
