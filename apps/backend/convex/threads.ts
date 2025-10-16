// See the docs at https://docs.convex.dev/agents/threads

import {
  createThread,
  getThreadMetadata,
  saveMessage,
  vMessage,
} from "@convex-dev/agent";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { z } from "zod/v3";
import { components, internal } from "./_generated/api";
import {
  type ActionCtx,
  action,
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server.js";
import { designAgent } from "./agents/design";
import { getAuthUserId } from "./utils";

export const listThreads = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const threads = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      { userId: userId || undefined, paginationOpts: args.paginationOpts }
    );
    return threads;
  },
});

export const createNewThread = mutation({
  args: { title: v.optional(v.string()), initialMessage: v.optional(vMessage) },
  handler: async (ctx, { title, initialMessage }) => {
    const userId = await getAuthUserId(ctx);
    const threadId = await createThread(ctx, components.agent, {
      userId,
      title,
    });
    if (initialMessage) {
      const { messageId } = await saveMessage(ctx, components.agent, {
        threadId,
        message: initialMessage,
      });

      // Schedule the AI response to stream asynchronously
      await ctx.scheduler.runAfter(0, internal.messages.streamAsync, {
        threadId,
        promptMessageId: messageId,
      });
    }
    return threadId;
  },
});

export const getThreadDetails = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    await authorizeThreadAccess(ctx, threadId);
    const { title, summary } = await getThreadMetadata(ctx, components.agent, {
      threadId,
    });
    return { title, summary };
  },
});

export const updateThreadTitle = action({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    await authorizeThreadAccess(ctx, threadId);
    const { thread } = await designAgent.continueThread(ctx, { threadId });
    const {
      object: { title, summary },
    } = await thread.generateObject(
      {
        mode: "json",
        schemaDescription:
          "Generate a title and summary for the thread. The title should be a single sentence that captures the main topic of the thread. The summary should be a short description of the thread that could be used to describe it to someone who hasn't read it.",
        schema: z.object({
          title: z.string().describe("The new title for the thread"),
          summary: z.string().describe("The new summary for the thread"),
        }),
        prompt: "Generate a title and summary for this thread.",
      },
      { storageOptions: { saveMessages: "none" } }
    );
    await thread.updateMetadata({ title, summary });
  },
});

export const updateThreadTitleManually = mutation({
  args: { threadId: v.string(), title: v.string() },
  returns: v.null(),
  handler: async (ctx, { threadId, title }) => {
    await authorizeThreadAccess(ctx, threadId);
    await ctx.runMutation(components.agent.threads.updateThread, {
      threadId,
      patch: { title },
    });
    return null;
  },
});

export const deleteThread = action({
  args: { threadId: v.string() },
  returns: v.null(),
  handler: async (ctx, { threadId }) => {
    await authorizeThreadAccess(ctx, threadId, true);
    await ctx.runAction(components.agent.threads.deleteAllForThreadIdSync, {
      threadId,
    });
    return null;
  },
});

export async function authorizeThreadAccess(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  threadId: string,
  requireUser?: boolean
) {
  const userId = await getAuthUserId(ctx);
  if (requireUser && !userId) {
    throw new Error("Unauthorized: user is required");
  }
  const { userId: threadUserId } = await getThreadMetadata(
    ctx,
    components.agent,
    { threadId }
  );
  if (requireUser && threadUserId !== userId) {
    throw new Error("Unauthorized: user does not match thread user");
  }
}
