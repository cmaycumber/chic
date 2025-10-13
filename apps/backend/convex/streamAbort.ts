import { abortStream } from "@convex-dev/agent";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { mutation } from "./_generated/server";
import { authorizeThreadAccess } from "./threads";

export const abortStreamByOrder = mutation({
  args: { threadId: v.string(), order: v.number() },
  returns: v.null(),
  handler: async (ctx, { threadId, order }) => {
    await authorizeThreadAccess(ctx, threadId);
    await abortStream(ctx, components.agent, {
      threadId,
      order,
      reason: "User requested to stop the stream",
    });
    return null;
  },
});
