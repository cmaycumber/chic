/**
 * Amazon Affiliate URL utilities
 *
 * Handles adding affiliate tags to Amazon product URLs and building cart URLs
 */

const AFFILIATE_TAG = "fitvivo-20";
const DEFAULT_AMAZON_DOMAIN = "www.amazon.com";

// Regex pattern for extracting ASIN from Amazon URLs
const ASIN_PATTERN = /\/(?:dp|gp\/product)\/([A-Z0-9]{10})/;

/**
 * Add affiliate tag to an Amazon product URL
 * Preserves existing query parameters and handles various Amazon URL formats
 */
export function addAffiliateTag(
  url: string,
  affiliateTag: string = AFFILIATE_TAG
): string {
  try {
    const urlObj = new URL(url);

    // Only process Amazon URLs
    if (!urlObj.hostname.includes("amazon.")) {
      return url;
    }

    // Add or replace the tag parameter
    urlObj.searchParams.set("tag", affiliateTag);

    return urlObj.toString();
  } catch {
    // If URL parsing fails, return original
    return url;
  }
}

/**
 * Extract ASIN from Amazon product URL
 * ASINs are typically in the format /dp/ASIN or /gp/product/ASIN
 */
export function extractAsin(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(ASIN_PATTERN);
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}

type CartItem = {
  asin?: string;
  offerListingId?: string;
  qty: number;
  sellerId?: string;
};

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

  if (associateTag) {
    params.set("tag", associateTag);
  }

  return `https://${domain}/gp/aws/cart/add.html?${params.toString()}`;
}

/**
 * Build Amazon cart URL from product URLs
 * Extracts ASINs from the URLs and builds a cart link
 */
export function buildCartUrlFromProductUrls(
  productUrls: string[],
  {
    domain = DEFAULT_AMAZON_DOMAIN,
    associateTag = AFFILIATE_TAG,
  }: { domain?: string; associateTag?: string } = {}
): string | null {
  const items: CartItem[] = [];

  for (const url of productUrls) {
    const asin = extractAsin(url);
    if (asin) {
      items.push({ asin, qty: 1 });
    }
  }

  if (items.length === 0) {
    return null;
  }

  return buildAmazonCartUrl(items, { domain, associateTag });
}
