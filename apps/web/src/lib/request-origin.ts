import { headers } from "next/headers";

const DEV_HOST = "localhost:3000";

/**
 * Where this request reached us, so a route can call back into our own app —
 * the image optimizer, for one — without being told its own address.
 */
export async function requestOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("host") ?? DEV_HOST;
  const protocol =
    headerList.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

/**
 * The origin to put in a link somebody else will open. A deployment that
 * knows its own canonical address says so; otherwise the request that got
 * here is the best guess available.
 */
export async function siteOrigin(): Promise<string> {
  return process.env.SITE_URL ?? (await requestOrigin());
}
