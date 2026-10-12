/**
 * Turn any product link into one that pays us.
 *
 * Amazon links carry our Associates tag. Every other retailer goes through a
 * link-wrapping network, which affiliates the click with whichever program
 * that retailer is in (and passes it through untouched when it is in none):
 *
 * - Sovrn Commerce, when SOVRN_API_KEY is set:
 *   `https://redirect.viglink.com?key=<key>&u=<encoded url>`
 *   https://knowledge.sovrn.com/how-to-implement-sovrn-commerce-apis
 * - Skimlinks, when SKIMLINKS_PUBLISHER_ID is set:
 *   `https://go.skimresources.com/?id=<publisher id>&url=<encoded url>`
 *   https://jsapi.apiary.io/apis/skimlinkslinkapi/introduction/referring-urls-with-link-wrapper.html
 *
 * With neither set, the plain link is returned.
 */
import { addAffiliateTag } from "./amazonAffiliate";

const SOVRN_REDIRECT = "https://redirect.viglink.com";
const SKIMLINKS_REDIRECT = "https://go.skimresources.com/";
const WRAPPER_HOSTS = ["redirect.viglink.com", "go.skimresources.com"];
const AMAZON_HOST = /(^|\.)amazon\.[a-z.]+$/;

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** amazon.com, www.amazon.co.uk and the like; not amazonaws.com. */
export function isAmazonUrl(url: string): boolean {
  const host = hostOf(url);
  return host !== null && AMAZON_HOST.test(host);
}

function wrap(base: string, params: Record<string, string>): string {
  return `${base}?${new URLSearchParams(params).toString()}`;
}

/** The affiliate version of a product link, or the link itself. */
export function monetize(url: string): string {
  const host = hostOf(url);
  if (!host || WRAPPER_HOSTS.includes(host)) {
    return url;
  }
  if (isAmazonUrl(url)) {
    return addAffiliateTag(url);
  }
  const sovrnKey = process.env.SOVRN_API_KEY;
  if (sovrnKey) {
    return wrap(SOVRN_REDIRECT, { key: sovrnKey, u: url });
  }
  const skimlinksId = process.env.SKIMLINKS_PUBLISHER_ID;
  if (skimlinksId) {
    return wrap(SKIMLINKS_REDIRECT, { id: skimlinksId, url });
  }
  return url;
}
