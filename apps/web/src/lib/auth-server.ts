import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

const CONVEX_CLOUD_SUFFIX = ".convex.cloud";
const CONVEX_SITE_SUFFIX = ".convex.site";
const LOCAL_CONVEX_PORT = ":3210";
const LOCAL_CONVEX_SITE_PORT = ":3211";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

/**
 * Derives the Convex HTTP actions (site) URL from the Convex deployment URL
 * when `NEXT_PUBLIC_CONVEX_SITE_URL` isn't set. Covers hosted deployments
 * (`*.convex.cloud` -> `*.convex.site`) and local anonymous dev deployments
 * (`http://127.0.0.1:3210` -> `http://127.0.0.1:3211`).
 */
const deriveConvexSiteUrl = (url: string) => {
  if (url.includes(CONVEX_CLOUD_SUFFIX)) {
    return url.replace(CONVEX_CLOUD_SUFFIX, CONVEX_SITE_SUFFIX);
  }
  if (url.includes(LOCAL_CONVEX_PORT)) {
    return url.replace(LOCAL_CONVEX_PORT, LOCAL_CONVEX_SITE_PORT);
  }
  return url;
};

const convexSiteUrl =
  process.env.NEXT_PUBLIC_CONVEX_SITE_URL || deriveConvexSiteUrl(convexUrl);

export const {
  handler,
  preloadAuthQuery,
  isAuthenticated,
  getToken,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
} = convexBetterAuthNextJs({
  basePath: "/api/auth",
  convexSiteUrl,
  convexUrl,
});

/**
 * Anonymous visitors hold a real session, so "is there a session?" cannot
 * tell them apart from someone with an account. These are the three cases.
 */
export type SessionKind = "none" | "anonymous" | "account";

const BASE64URL_CHARS = /[-_]/g;
const BASE64_GROUP_SIZE = 4;

const decodeJwtClaims = (token: string): { isAnonymous?: boolean } | null => {
  const [, segment] = token.split(".");
  if (!segment) {
    return null;
  }
  const base64 = segment.replace(BASE64URL_CHARS, (char) =>
    char === "-" ? "+" : "/"
  );
  const padding =
    (BASE64_GROUP_SIZE - (base64.length % BASE64_GROUP_SIZE)) %
    BASE64_GROUP_SIZE;
  try {
    return JSON.parse(atob(base64 + "=".repeat(padding)));
  } catch {
    return null;
  }
};

/**
 * Which kind of session this request carries, read from the Convex token's
 * claims. Only an optimistic read for redirects — pages still check auth.
 */
export const getSessionKind = async (): Promise<SessionKind> => {
  const token = await getToken();
  if (!token) {
    return "none";
  }
  return decodeJwtClaims(token)?.isAnonymous === true ? "anonymous" : "account";
};
