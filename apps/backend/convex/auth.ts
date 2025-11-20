import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import {
  checkout,
  polar,
  portal,
  usage,
  webhooks,
} from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { betterAuth, type OAuth2Tokens } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin, genericOAuth } from "better-auth/plugins";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authSchema from "./betterAuth/schema";

const siteUrl = process.env.SITE_URL || "http://localhost:3001";

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN || "",
  server: process.env.POLAR_SERVER === "production" ? "production" : "sandbox",
});

// biome-ignore lint/suspicious/noExplicitAny: Schema compatibility issue
export const authComponent = createClient<DataModel, any>(
  components.betterAuth,
  {
    local: {
      // biome-ignore lint/suspicious/noExplicitAny: Schema compatibility issue
      schema: authSchema as any,
    },
  }
);

export const createAuth = (
  ctx: GenericCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false }
) =>
  betterAuth({
    logger: {
      disabled: optionsOnly,
    },
    // biome-ignore lint/style/useNamingConvention: Better auth naming convention
    baseURL: siteUrl,
    trustedOrigins: [siteUrl],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      convex(),
      polar({
        client: polarClient,
        createCustomerOnSignUp: true,
        use: [
          checkout({
            successUrl:
              process.env.POLAR_SUCCESS_URL ||
              `${siteUrl}/success?checkout_id={CHECKOUT_ID}`,
            authenticatedUsersOnly: true,
          }),
          portal(),
          usage(),
          webhooks({
            secret: process.env.POLAR_WEBHOOK_SECRET || "",
          }),
        ],
      }),
      nextCookies(),
      admin(),
      genericOAuth({
        config: [
          {
            providerId: "pinterest",
            clientId: process.env.PINTEREST_CLIENT_ID as string,
            clientSecret: process.env.PINTEREST_CLIENT_SECRET as string,
            authorizationUrl: "https://www.pinterest.com/oauth/",
            tokenUrl: "https://api.pinterest.com/v5/oauth/token",
            userInfoUrl: "https://api.pinterest.com/v5/user_account",
            scopes: [
              "boards:read",
              "boards:write",
              "pins:read",
              "pins:write",
              "user_accounts:read",
            ],

            getUserInfo: async (tokens: OAuth2Tokens) => {
              const response = await fetch(
                "https://api.pinterest.com/v5/user_account",
                {
                  headers: {
                    Authorization: `Bearer ${tokens.accessToken}`,
                  },
                }
              );

              const profile = await response.json();
              return {
                emailVerified: true,
                name: profile.username || profile.business_name,
                email: profile.email, // Note: Email might not be available
                image: profile.profile_image,
                id: profile.id,
              };
            },
          },
        ],
      }),
    ],
  });

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) =>
    authComponent.getAuthUser(ctx as unknown as GenericCtx<DataModel>),
});
