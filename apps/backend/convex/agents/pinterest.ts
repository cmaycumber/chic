import { v } from "convex/values";
import { components, internal } from "../_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "../_generated/server";

export const runPinterestAgent = internalAction({
  args: {},
  handler: async (ctx) => {
    // 1. Get Pinterest credentials
    // Use the component's public API to get the account
    const account = await ctx.runQuery(
      components.betterAuth.functions.getPinterestAccount,
      {}
    );

    if (!account) {
      // console.log("No Pinterest account found. Skipping agent run.");
      return;
    }

    // Check if token is expired and refresh if needed (simplified for now)
    // In a real app, you'd check account.accessTokenExpiresAt and use refreshToken
    const { accessToken } = account;

    if (!accessToken) {
      // console.log("No access token found for Pinterest account.");
      return;
    }

    // 2. Get unpinned designs
    const designs = await ctx.runQuery(
      internal.agents.pinterest.getUnpinnedDesigns
    );
    if (designs.length === 0) {
      // console.log("No unpinned designs found.");
      return;
    }

    // 3. Process designs
    await Promise.all(
      designs.map(async (design) => {
        try {
          // Create or find board (simplified: using a default board for now)
          // You might want to create boards based on roomType or style
          // const boardName = "Furnish Designs";
          // This is a placeholder. You'd need to list boards and find/create one.
          // For this example, we'll assume we have a board ID or just log it.

          // Create Pin
          // POST https://api.pinterest.com/v5/pins
          // const pinData = {
          //   title: design.title,
          //   description: design.description,
          //   link: `https://furnish.app/designs/${design._id}`, // Replace with actual URL
          //   // biome-ignore lint/style/useNamingConvention: Pinterest API requires snake_case
          //   media_source: {
          //     // biome-ignore lint/style/useNamingConvention: Pinterest API requires snake_case
          //     source_type: "image_url",
          //     url:
          //       design.products?.[0]?.imageUrl ||
          //       "https://placeholder.com/image.jpg", // Use first product image or design image
          //   },
          //   // board_id: "...", // Need a board ID
          // };

          // console.log(`Creating pin for design ${design._id}`, pinData);
          // void pinData;

          // Actual API call would go here
          // const response = await fetch("https://api.pinterest.com/v5/pins", {
          //   method: "POST",
          //   headers: {
          //     Authorization: `Bearer ${accessToken}`,
          //     "Content-Type": "application/json",
          //   },
          //   body: JSON.stringify(pinData),
          // });
          // const data = await response.json();

          // Mock success
          const mockPinId = `pin_${Date.now()}`;

          // 4. Update design with pin ID
          await ctx.runMutation(internal.agents.pinterest.markDesignAsPinned, {
            designId: design._id,
            pinId: mockPinId,
          });
        } catch {
          // console.error(`Failed to pin design ${design._id}:`, error);
        }
      })
    );
  },
});

const BATCH_SIZE = 20;

export const getUnpinnedDesigns = internalQuery({
  args: {},
  handler: async (ctx) => {
    // This is inefficient if there are many designs.
    // Ideally, add an index on pinterestPinId or use a separate table for queue.
    // For now, we'll fetch recent designs and filter.
    const designs = await ctx.db
      .query("designs")
      .order("desc")
      .take(BATCH_SIZE);
    return designs.filter((d) => !d.pinterestPinId && d.isPublic);
  },
});

export const markDesignAsPinned = internalMutation({
  args: {
    designId: v.id("designs"),
    pinId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.designId, {
      pinterestPinId: args.pinId,
    });
  },
});
