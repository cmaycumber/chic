/**
 * Search Products Tool
 *
 * Uses GPT-4o with web search to find furniture and decor products
 * that match a design plan, style, and budget.
 */
"use node";
import { openai } from "@ai-sdk/openai";
import { createTool } from "@convex-dev/agent";
import { generateText } from "ai";
import z from "zod";

const JSON_ARRAY_PATTERN = /\[[\s\S]*\]/;
const MIN_PRODUCT_COUNT = 3;
const MAX_PRODUCT_COUNT = 10;
const DEFAULT_PRODUCT_COUNT = 6;

const productSchema = z.object({
  name: z.string().describe("Product name"),
  price: z.number().describe("Product price in dollars"),
  imageUrl: z.string().describe("URL to product image"),
  productUrl: z.string().optional().describe("URL to product page"),
  description: z.string().optional().describe("Product description"),
});

type Product = z.infer<typeof productSchema>;

/**
 * Searches for products that match a design plan
 */
// biome-ignore lint/style/useNamingConvention: OpenAI tool names use snake_case
export const search_products = createTool({
  description:
    "Search for furniture and decor products using web search. Use GPT-4o to find 5-8 specific products that match the design requirements. Returns an array of products with names, prices, images, and purchase links.",
  args: z.object({
    roomType: z
      .string()
      .describe("Type of room (e.g., living room, bedroom, kitchen)"),
    style: z
      .string()
      .describe(
        "Design style to match (e.g., modern, minimalist, bohemian, industrial)"
      ),
    designPlan: z
      .string()
      .describe(
        "Detailed design plan describing what products are needed, colors, materials, sizes, etc."
      ),
    budget: z
      .number()
      .optional()
      .describe(
        "Optional budget constraint in dollars to keep products within range"
      ),
    productCount: z
      .number()
      .optional()
      .default(DEFAULT_PRODUCT_COUNT)
      .describe(
        `Number of products to find (default: ${DEFAULT_PRODUCT_COUNT}, range: ${MIN_PRODUCT_COUNT}-${MAX_PRODUCT_COUNT})`
      ),
  }),
  handler: async (_ctx, args) => {
    const count = Math.min(
      Math.max(args.productCount || DEFAULT_PRODUCT_COUNT, MIN_PRODUCT_COUNT),
      MAX_PRODUCT_COUNT
    );

    const productsSearchPrompt = `Based on this interior design plan:
Room Type: ${args.roomType}
Style: ${args.style}
Design Plan: ${args.designPlan}
${args.budget ? `Budget: $${args.budget}` : ""}

Find ${count} specific furniture and decor products that would work for this design. For each product, provide:
- Product name
- Estimated price (as a number, not a string)
- Product image URL (direct link to the product image)
- Product page URL (where to buy it)
- Brief description

Focus on products that fit the style and stay within budget if provided. Return the results as a JSON array with fields: name, price, imageUrl, productUrl, description.`;

    const productResearchResult = await generateText({
      model: openai("gpt-4o"),
      prompt: productsSearchPrompt,
      tools: {
        // biome-ignore lint/style/useNamingConvention: OpenAI tool name
        web_search: openai.tools.webSearch(),
      },
    });

    const products: Product[] = [];

    try {
      const jsonMatch = productResearchResult.text.match(JSON_ARRAY_PATTERN);
      if (jsonMatch) {
        const productsData = JSON.parse(jsonMatch[0]);
        products.push(
          ...productsData.map(
            (p: {
              name: string;
              price: number;
              imageUrl?: string;
              productUrl?: string;
              description?: string;
            }) => ({
              name: p.name,
              price: p.price,
              imageUrl: p.imageUrl || "",
              productUrl: p.productUrl,
              description: p.description,
            })
          )
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to parse product search results: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    if (products.length === 0) {
      throw new Error(
        "No products found. Try adjusting the search parameters or budget."
      );
    }

    return products;
  },
});
