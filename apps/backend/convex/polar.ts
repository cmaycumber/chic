import { Polar } from "@polar-sh/sdk";
import { v } from "convex/values";
import { action } from "./_generated/server";

const POLAR_CLIENT = {
  server:
    process.env.POLAR_SERVER === "production"
      ? "production"
      : ("sandbox" as const),
};

const POLAR_CREDIT_PRODUCT_ID =
  POLAR_CLIENT.server === "production"
    ? "44bb9b7c-120b-4c26-b173-0b22e330754d"
    : "5755b067-9c03-42dd-a3f6-b0fcd0ffc03e";

const CREDIT_PRICE_CENTS = 10; // $0.10 per credit
const MIN_INCREMENT = 10; // $1 increments

export const createCreditCheckout = action({
  args: {
    credits: v.number(),
    successUrl: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const polar = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN ?? "",
      server: POLAR_CLIENT.server as "production" | "sandbox",
    });

    const requestedCredits = args.credits ?? MIN_INCREMENT;
    // Quantize to MIN_INCREMENT
    const normalizedCredits = Math.max(
      MIN_INCREMENT,
      Math.round(requestedCredits / MIN_INCREMENT) * MIN_INCREMENT
    );

    const amountCents = normalizedCredits * CREDIT_PRICE_CENTS;

    const successUrl = args.successUrl ?? process.env.POLAR_SUCCESS_URL;

    if (!successUrl) {
      throw new Error("Success URL is required");
    }

    // Create checkout session with ad-hoc pricing
    const checkout = await polar.checkouts.create({
      metadata: {
        amountCents,
        credits: normalizedCredits,
      },
      prices: {
        [POLAR_CREDIT_PRODUCT_ID]: [
          {
            amountType: "fixed",
            priceAmount: amountCents,
            priceCurrency: "usd",
          },
        ],
      },
      products: [POLAR_CREDIT_PRODUCT_ID],
      successUrl,
    });

    return {
      id: checkout.id,
      url: checkout.url,
    };
  },
});
