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

/** Time constants in seconds */
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_MONTH = 30;

/** Session duration: 30 days in seconds */
const SESSION_EXPIRES_IN =
  SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY * DAYS_PER_MONTH;

/** Session update age: refresh session if older than 1 day */
const SESSION_UPDATE_AGE =
  SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY;

/** Cookie cache duration: 5 minutes in seconds */
const COOKIE_CACHE_MINUTES = 5;
const COOKIE_CACHE_MAX_AGE = SECONDS_PER_MINUTE * COOKIE_CACHE_MINUTES;

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
    session: {
      expiresIn: SESSION_EXPIRES_IN,
      updateAge: SESSION_UPDATE_AGE,
      cookieCache: {
        enabled: true,
        maxAge: COOKIE_CACHE_MAX_AGE,
      },
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
                    // biome-ignore lint/style/useNamingConvention: HTTP header names use PascalCase
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
