/**
 * Search Products Tool
 *
 * Uses SerpAPI's Amazon Search API to find real furniture and decor products
 * that match a design plan, style, and budget.
 */
"use node";
import { createTool } from "@convex-dev/agent";
import z from "zod";

const DEFAULT_PRODUCTS_PER_QUERY = 2;
const MAX_PRODUCTS_PER_QUERY = 5;
const MIN_PRODUCTS_PER_QUERY = 1;
const ERROR_TEXT_MAX_LENGTH = 200;

const productSchema = z.object({
  name: z.string().describe("Product name"),
  price: z.number().describe("Product price in dollars"),
  imageUrl: z.string().describe("URL to product image"),
  productUrl: z.string().describe("Amazon product page URL"),
  rating: z.number().optional().describe("Product rating (out of 5)"),
  reviewCount: z.number().optional().describe("Number of reviews"),
  description: z.string().optional().describe("Product description"),
});

type Product = z.infer<typeof productSchema>;

type AmazonProduct = {
  position?: number;
  title?: string;
  asin?: string;
  link?: string;
  // biome-ignore lint/style/useNamingConvention: SerpAPI uses snake_case
  link_clean?: string;
  thumbnail?: string;
  rating?: number;
  reviews?: number;
  price?: string;
  // biome-ignore lint/style/useNamingConvention: SerpAPI uses snake_case
  extracted_price?: number;
  // biome-ignore lint/style/useNamingConvention: SerpAPI uses snake_case
  old_price?: string;
  // biome-ignore lint/style/useNamingConvention: SerpAPI uses snake_case
  extracted_old_price?: number;
};

type SerpApiResponse = {
  // biome-ignore lint/style/useNamingConvention: SerpAPI uses snake_case
  organic_results?: AmazonProduct[];
  // biome-ignore lint/style/useNamingConvention: SerpAPI uses snake_case
  search_information?: {
    // biome-ignore lint/style/useNamingConvention: SerpAPI uses snake_case
    query_displayed?: string;
  };
  error?: string;
};

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
    engine: "amazon",
    k: enhancedQuery, // Amazon uses 'k' for keyword search
    // biome-ignore lint/style/useNamingConvention: SerpAPI parameter
    amazon_domain: "amazon.com",
    // biome-ignore lint/style/useNamingConvention: SerpAPI parameter
    api_key: apiKey,
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
        `SerpAPI HTTP ${response.status}: ${errorText.substring(0, ERROR_TEXT_MAX_LENGTH)}`
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
      throw new Error(`SerpAPI request failed: ${error.message}`);
    }
    throw new Error("SerpAPI request failed with unknown error");
  }
}

/**
 * Searches Amazon for products that match a design plan
 */
// biome-ignore lint/style/useNamingConvention: OpenAI tool names use snake_case
export const search_products = createTool({
  description:
    "Search Amazon for real furniture and decor products using SerpAPI. Plan your queries carefully with specific details (style, color, material, size) and appropriate filters before calling this tool. Returns actual products available for purchase with images, prices, ratings, and direct Amazon links.",
  args: z.object({
    queries: z
      .array(
        z.object({
          query: z
            .string()
            .describe(
              "Specific, detailed product search query. Include ALL relevant details: style, color, material, size, type. Examples: 'modern grey velvet sectional sofa', 'round walnut coffee table 36 inch', 'geometric wool area rug 8x10 blue'. Be as specific as possible for best results."
            ),
          filters: z
            .string()
            .optional()
            .describe(
              `Optional Amazon filters in 'rh' format to refine results. Combine multiple filters with commas.
              
Common filter examples (from https://serpapi.com/amazon-filters):
- 4+ Stars: "p_72:1248897011" (RECOMMENDED for quality)
- Prime Eligible: "p_85:2470955011"
- Free Shipping: "p_76:1249146011"
- Get It by Tomorrow: "p_90:8308921011"
- All Discounts: "p_n_deal_type:23566065011"

Price range filters:
- Under $25: "p_36:1253503011"
- $25 to $50: "p_36:1253504011"
- $50 to $100: "p_36:1253505011"
- $100 to $200: "p_36:1253506011"
- $200 to $500: "p_36:1253507011"

Brand filters:
- Top Brands: "p_n_feature_forty-one_browse-bin:119653281011"
- Amazon Brands: "p_n_feature_forty-seven_browse-bin:24677333011"

Combine filters like: "p_72:1248897011,p_76:1249146011" for 4+ stars AND free shipping.
Use 4+ star filter by default for better quality products.`
            ),
          maxResults: z
            .number()
            .optional()
            .default(DEFAULT_PRODUCTS_PER_QUERY)
            .describe(
              `Number of products to return for this specific query (default: ${DEFAULT_PRODUCTS_PER_QUERY}, range: ${MIN_PRODUCTS_PER_QUERY}-${MAX_PRODUCTS_PER_QUERY})`
            ),
        })
      )
      .min(1)
      .describe(
        "Array of search query objects. Each query should be fully specified with style, color, material, size, and appropriate filters based on your design plan."
      ),
  }),
  handler: async (_ctx, args) => {
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
    const productUrl = item.link_clean || item.link;
    if (!productUrl) {
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

    products.push({
      name: item.title,
      price,
      imageUrl: item.thumbnail,
      productUrl,
      rating: item.rating,
      reviewCount: item.reviews,
      description: item.title,
    });
  }

  return products;
}
