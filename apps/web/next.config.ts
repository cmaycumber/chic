import { withContentCollections } from "@content-collections/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SEO optimizations
  headers() {
    return [
      {
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
        source: "/:path*",
      },
    ];
  },
  images: {
    // Local anonymous Convex serves images from 127.0.0.1 during development.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    remotePatterns: [
      new URL(`${process.env.NEXT_PUBLIC_CONVEX_URL}/**`),
      new URL("https://m.media-amazon.com/**"),
    ],
  },
  // The design gallery these paths served is gone; the room gallery replaced
  // it, so every old link lands on the nearest thing that still exists.
  redirects() {
    return [
      { destination: "/ideas", permanent: true, source: "/explore" },
      { destination: "/ideas", permanent: true, source: "/explore/:designId" },
      { destination: "/ideas", permanent: true, source: "/design/:designId" },
      { destination: "/rooms", permanent: true, source: "/saved" },
    ];
  },
  rewrites() {
    return [
      {
        destination: "https://us-assets.i.posthog.com/static/:path*",
        source: "/users/static/:path*",
      },
      {
        destination: "https://us.i.posthog.com/:path*",
        source: "/users/:path*",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  typedRoutes: true,
};

export default withContentCollections(nextConfig);

// export default withPostHogConfig(nextConfig, {
//   personalApiKey: process.env.POSTHOG_API_KEY ?? "", // Personal API Key
//   envId: process.env.POSTHOG_ENV_ID ?? "", // Environment ID
// });
