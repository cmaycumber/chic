/**
 * Amazon Affiliate URL utilities for client-side
 *
 * Handles building cart URLs from products
 */

const AFFILIATE_TAG = "fitvivo-20";
const DEFAULT_AMAZON_DOMAIN = "www.amazon.com";

// Regex pattern for extracting ASIN from Amazon URLs
const ASIN_PATTERN = /\/(?:dp|gp\/product)\/([A-Z0-9]{10})/;

/**
 * Extract ASIN from Amazon product URL
 * ASINs are typically in the format /dp/ASIN or /gp/product/ASIN
 */
function extractAsin(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(ASIN_PATTERN);
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}

interface CartItem {
  asin?: string;
  offerListingId?: string;
  qty: number;
  sellerId?: string;
}

/**
 * Build Amazon Add-to-Cart URL with multiple items
 *
 * @param items - Array of items to add to cart
 * @param options - Configuration options
 * @returns Amazon cart URL
 *
 * @example
 * ```ts
 * const cartUrl = buildAmazonCartUrl([
 *   { asin: "B08N5WRWNW", qty: 1 },
 *   { asin: "B07YNK87NZ", qty: 2 }
 * ]);
 * ```
 */
export function buildAmazonCartUrl(
  items: CartItem[],
  {
    domain = DEFAULT_AMAZON_DOMAIN,
    associateTag = AFFILIATE_TAG,
  }: { domain?: string; associateTag?: string } = {}
): string {
  const params = new URLSearchParams();

  for (const [index, item] of items.entries()) {
    const n = index + 1;
    if (item.asin) {
      params.set(`ASIN.${n}`, item.asin);
    }
    if (item.offerListingId) {
      params.set(`OfferListingId.${n}`, item.offerListingId);
    }
    if (item.sellerId) {
      params.set(`SellerId.${n}`, item.sellerId);
    }
    params.set(`Quantity.${n}`, String(item.qty));
  }

  // SerpAPI uses the tag parameter instead of AssociateTag
  if (associateTag) {
    params.set("tag", associateTag);
  }

  return `https://${domain}/gp/aws/cart/add.html?${params.toString()}`;
}

/**
 * Build Amazon cart URL from product URLs
 * Extracts ASINs from the URLs and builds a cart link
 *
 * @example
 * ```ts
 * const products = [
 *   { productUrl: "https://www.amazon.com/dp/B08N5WRWNW" },
 *   { productUrl: "https://www.amazon.com/dp/B07YNK87NZ" }
 * ];
 * const cartUrl = buildCartUrlFromProducts(products);
 * ```
 */
export function buildCartUrlFromProducts(
  products: { productUrl?: string }[],
  {
    domain = DEFAULT_AMAZON_DOMAIN,
    associateTag = AFFILIATE_TAG,
  }: { domain?: string; associateTag?: string } = {}
): string | null {
  const items: CartItem[] = [];

  for (const product of products) {
    if (!product.productUrl) {
      continue;
    }

    const asin = extractAsin(product.productUrl);
    if (asin) {
      items.push({ asin, qty: 1 });
    }
  }

  if (items.length === 0) {
    return null;
  }

  return buildAmazonCartUrl(items, { associateTag, domain });
}
