import { withContentCollections } from "@content-collections/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: [new URL("https://utmost-tapir-624.convex.cloud/**")],
  },
};

export default withContentCollections(nextConfig);
