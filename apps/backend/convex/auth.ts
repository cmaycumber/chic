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
import type { OAuth2Tokens } from "better-auth";
import { type BetterAuthOptions, betterAuth } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";
import { admin, anonymous, genericOAuth } from "better-auth/plugins";
import type { GenericActionCtx } from "convex/server";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";
import authSchema from "./betterAuth/schema";

const siteUrl = process.env.SITE_URL || "http://localhost:3001";

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN || "",
  server: process.env.POLAR_SERVER === "production" ? "production" : "sandbox",
});

export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: {
      schema: authSchema,
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

type RunMutationCtx = Pick<GenericActionCtx<DataModel>, "runMutation">;

/**
 * Better Auth hooks run inside the Convex HTTP action that serves
 * `/api/auth/*`, so the ctx handed to `createAuthOptions` there can run
 * mutations. Query contexts (adapter reads, CLI schema generation) cannot.
 */
const canRunMutation = (
  ctx: GenericCtx<DataModel>
): ctx is GenericCtx<DataModel> & RunMutationCtx =>
  typeof (ctx as Partial<RunMutationCtx>).runMutation === "function";

/**
 * Better Auth options, split out from `createAuth` so:
 * - `betterAuth/adapter.ts` can pass this straight to `createApi` without
 *   constructing a full `betterAuth()` instance.
 * - `betterAuth/auth.ts` can call `createAuth` with a fake context for the
 *   Better Auth CLI schema generator without needing a real Convex ctx.
 */
export const createAuthOptions = (ctx: GenericCtx<DataModel>) =>
  ({
    // biome-ignore lint/style/useNamingConvention: Better auth naming convention
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      convex({
        authConfig,
        // Signing keys created by Better Auth 1.3 use an algorithm the
        // current library rejects; rotate them instead of failing token
        // generation for every session.
        jwksRotateOnTokenGenerationError: true,
      }),
      // Visitors get a real session on their first upload, so nothing is
      // gated behind sign-up. Signing up later keeps everything they made.
      anonymous({
        onLinkAccount: async ({ anonymousUser, newUser }) => {
          if (!canRunMutation(ctx)) {
            return;
          }
          await ctx.runMutation(internal.rooms.internalTransferOwnership, {
            fromUserId: anonymousUser.user.id,
            toUserId: newUser.user.id,
          });
        },
      }),
      polar({
        client: polarClient,
        // Local deployments without a Polar token can still create accounts.
        createCustomerOnSignUp: Boolean(process.env.POLAR_ACCESS_TOKEN),
        use: [
          checkout({
            authenticatedUsersOnly: true,
            successUrl:
              process.env.POLAR_SUCCESS_URL ||
              `${siteUrl}/success?checkout_id={CHECKOUT_ID}`,
          }),
          portal(),
          usage(),
          webhooks({
            secret: process.env.POLAR_WEBHOOK_SECRET || "",
          }),
        ],
      }),
      admin(),
      genericOAuth({
        config: [
          {
            authorizationUrl: "https://www.pinterest.com/oauth/",
            clientId: process.env.PINTEREST_CLIENT_ID as string,
            clientSecret: process.env.PINTEREST_CLIENT_SECRET as string,

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
                email: profile.email, // Note: Email might not be available
                emailVerified: true,
                id: profile.id,
                image: profile.profile_image,
                name: profile.username || profile.business_name,
              };
            },
            providerId: "pinterest",
            scopes: [
              "boards:read",
              "boards:write",
              "pins:read",
              "pins:write",
              "user_accounts:read",
            ],
            tokenUrl: "https://api.pinterest.com/v5/oauth/token",
            userInfoUrl: "https://api.pinterest.com/v5/user_account",
          },
        ],
      }),
      // Must stay last so cookies set by other plugins reach Next.js.
      nextCookies(),
    ],
    session: {
      cookieCache: {
        enabled: true,
        maxAge: COOKIE_CACHE_MAX_AGE,
      },
      expiresIn: SESSION_EXPIRES_IN,
      updateAge: SESSION_UPDATE_AGE,
    },
    trustedOrigins: [siteUrl],
  }) satisfies BetterAuthOptions;

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth(createAuthOptions(ctx));

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) =>
    authComponent.getAuthUser(ctx as unknown as GenericCtx<DataModel>),
});
