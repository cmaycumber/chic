import { abortStream } from "@convex-dev/agent";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { mutation } from "./_generated/server";
import { authorizeThreadAccess } from "./threads";

export const abortStreamByOrder = mutation({
  args: { order: v.number(), threadId: v.string() },
  handler: async (ctx, { threadId, order }) => {
    await authorizeThreadAccess(ctx, threadId);
    await abortStream(ctx, components.agent, {
      order,
      reason: "User requested to stop the stream",
      threadId,
    });
    return null;
  },
  returns: v.null(),
});
