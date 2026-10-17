/**
 * Stripe Checkout for the edits pack, and the webhook that credits it.
 *
 * Runs in Convex's default runtime: the SDK resolves to its fetch/Web Crypto
 * build there, and both are passed explicitly so a bundler picking the Node
 * build cannot quietly break signature checks.
 */
import { ConvexError, v } from "convex/values";
import Stripe from "stripe";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { billingEnabled, EDITS_PACK_CREDITS } from "./billing";
import { privateAction } from "./lib/utils";

/** Must match `EDITS_PACK.slug` in the web app. */
const EDITS_PACK_SLUG = "edits-50";

const siteUrl = process.env.SITE_URL || "http://localhost:3001";

function stripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
}

/** Only same-site paths, so checkout cannot bounce someone off the site. */
function safePath(path: string): string {
  return path.startsWith("/") && !path.startsWith("//") ? path : "/rooms";
}

/**
 * Open a Checkout Session for the edits pack and return its URL. Guests sign
 * up first: credits bought on an anonymous session would be lost with its
 * cookie.
 */
export const createCheckoutSession = privateAction({
  args: { returnTo: v.string() },
  handler: async (ctx, args) => {
    if (ctx.user.isAnonymous) {
      throw new ConvexError({
        code: "SIGN_UP_REQUIRED",
        message: "Create an account to buy edits.",
      });
    }
    const price = process.env.STRIPE_PRICE_EDITS_50;
    if (!(billingEnabled() && price)) {
      throw new ConvexError({
        code: "BILLING_DISABLED",
        message: "Edits are not on sale right now.",
      });
    }
    const back = safePath(args.returnTo);
    const session = await stripeClient().checkout.sessions.create({
      // biome-ignore lint/style/useNamingConvention: Stripe API field
      automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === "true" },
      // biome-ignore lint/style/useNamingConvention: Stripe API field
      cancel_url: `${siteUrl}${back}`,
      // biome-ignore lint/style/useNamingConvention: Stripe API field
      client_reference_id: ctx.userId,
      // biome-ignore lint/style/useNamingConvention: Stripe API field
      customer_email: ctx.user.email || undefined,
      // biome-ignore lint/style/useNamingConvention: Stripe API field
      line_items: [{ price, quantity: 1 }],
      metadata: { pack: EDITS_PACK_SLUG, userId: ctx.userId },
      mode: "payment",
      // biome-ignore lint/style/useNamingConvention: Stripe API field
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}&returnTo=${encodeURIComponent(back)}`,
    });
    if (!session.url) {
      throw new Error("Stripe returned a Checkout Session without a URL");
    }
    return { url: session.url };
  },
  returns: v.object({ url: v.string() }),
});

/** The Checkout Session a refunded charge was paid through, if any. */
async function sessionIdForCharge(charge: Stripe.Charge): Promise<string> {
  const paymentIntent =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!paymentIntent) {
    return "";
  }
  const sessions = await stripeClient().checkout.sessions.list({
    limit: 1,
    // biome-ignore lint/style/useNamingConvention: Stripe API field
    payment_intent: paymentIntent,
  });
  return sessions.data[0]?.id ?? "";
}

/**
 * POST `/stripe/webhook`. Subscribe the endpoint to
 * `checkout.session.completed`, `checkout.session.async_payment_succeeded`
 * and `charge.refunded`. Anything that throws answers 500, so Stripe retries
 * rather than marking a paid order delivered with no credits.
 */
export const webhook = httpAction(async (ctx, request) => {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing Stripe signature", { status: 400 });
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }
  let event: Stripe.Event;
  try {
    event = await Stripe.webhooks.constructEventAsync(
      await request.text(),
      signature,
      secret,
      undefined,
      Stripe.createSubtleCryptoProvider()
    );
  } catch {
    return new Response("Invalid Stripe signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      const userId = session.metadata?.userId ?? session.client_reference_id;
      // Delayed methods complete unpaid and succeed later; credit them then.
      // Sessions not made by `createCheckoutSession` are someone else's.
      if (
        session.payment_status === "paid" &&
        session.metadata?.pack === EDITS_PACK_SLUG &&
        userId
      ) {
        await ctx.runMutation(internal.billing.internalGrantPurchase, {
          credits: EDITS_PACK_CREDITS,
          ref: session.id,
          userId,
        });
      }
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object;
      const ref = await sessionIdForCharge(charge);
      if (ref) {
        await ctx.runMutation(internal.billing.internalRefundPurchase, {
          amount: charge.amount,
          amountRefunded: charge.amount_refunded,
          ref,
        });
      }
      break;
    }
    default:
      break;
  }
  return new Response(null, { status: 200 });
});
