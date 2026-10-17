import { httpRouter } from "convex/server";
import type { Id } from "./_generated/dataModel";
import { httpAction } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
import { webhook as stripeWebhook } from "./stripe";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

// Credits edit packs paid through Stripe Checkout.
http.route({
  handler: stripeWebhook,
  method: "POST",
  path: "/stripe/webhook",
});

// Serve files from storage
http.route({
  handler: httpAction(async (ctx, request) => {
    const { searchParams } = new URL(request.url);
    const storageId = searchParams.get("id");

    if (!storageId) {
      return new Response("Missing storage ID", { status: 400 });
    }

    const blob = await ctx.storage.get(storageId as Id<"_storage">);

    if (blob === null) {
      return new Response("File not found", { status: 404 });
    }

    return new Response(blob);
  }),
  method: "GET",
  path: "/storage",
});

export default http;
