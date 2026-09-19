/**
 * Shared schemas and types for agent tools
 *
 * This ensures consistency across all tools that work with products.
 */
import z from "zod";

/**
 * Full product schema - used when storing products in designs
 * Matches the output from search_products
 */
export const productSchema = z.object({
  description: z.string().optional().describe("Product description"),
  imageUrl: z.string().describe("URL to product image"),
  name: z.string().describe("Product name"),
  price: z.number().describe("Product price in dollars"),
  productUrl: z.string().optional().describe("URL to product page"),
  rating: z.number().optional().describe("Product rating (out of 5)"),
  reviewCount: z.number().optional().describe("Number of reviews"),
});

export type Product = z.infer<typeof productSchema>;

/**
 * Minimal product schema for image generation
 * Only needs name and optional image URL for visual reference
 */
export const imageGenProductSchema = z.object({
  description: z.string().optional().describe("Product description"),
  imageUrl: z
    .string()
    .optional()
    .describe("Product image URL to use as visual reference"),
  name: z.string().describe("Product name"),
});

export type ImageGenProduct = z.infer<typeof imageGenProductSchema>;
