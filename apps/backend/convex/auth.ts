import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";

const siteUrl = process.env.SITE_URL || "http://localhost:3001";

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (
  ctx: GenericCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false }
) =>
  betterAuth({
    logger: {
      disabled: optionsOnly,
    },
    baseUrl: siteUrl,
    trustedOrigins: [siteUrl],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [convex(), nextCookies()],
  });

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) =>
    authComponent.getAuthUser(ctx as unknown as GenericCtx<DataModel>),
});
