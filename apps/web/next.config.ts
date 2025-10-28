import { withContentCollections } from "@content-collections/next";
import { withPostHogConfig } from "@posthog/nextjs-config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: [
      new URL("https://utmost-tapir-624.convex.cloud/**"),
      new URL("https://m.media-amazon.com/**"),
    ],
  },
  // SEO optimizations
  headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
    ];
  },
  rewrites() {
    return [
      {
        source: "/users/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/users/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default withContentCollections(
  withPostHogConfig(nextConfig, {
    personalApiKey: process.env.POSTHOG_API_KEY || "", // Personal API Key
    envId: process.env.POSTHOG_ENV_ID || "", // Environment ID
  })
);
