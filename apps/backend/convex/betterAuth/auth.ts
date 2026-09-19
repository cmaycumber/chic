import { createAuth } from "../auth";

// Export a static instance for Better Auth schema generation.
// This file should ONLY export `auth` — the Better Auth CLI
// (`npx auth generate`, run from convex/betterAuth) reads it directly.
// The fake context is never used at runtime: schema generation only
// introspects the returned Auth instance's plugins/options.
// biome-ignore lint/suspicious/noExplicitAny: fake ctx for CLI-time schema generation only, per @convex-dev/better-auth docs.
export const auth = createAuth({} as any);
