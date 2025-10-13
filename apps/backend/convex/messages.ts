import { listUIMessages, syncStreams, vStreamArgs } from "@convex-dev/agent";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { internalAction, mutation, query } from "./_generated/server";
import { designAgent } from "./agents/design";
import { authorizeThreadAccess } from "./threads";

/**
 * Initiate async streaming for interior design consultation.
 * Saves the user's message first, then schedules the AI response to stream asynchronously.
 * This enables optimistic updates on the client for better UX.
 */
export const initiateAsyncStreaming = mutation({
  args: { prompt: v.string(), threadId: v.string() },
  returns: v.null(),
  handler: async (ctx, { prompt, threadId }) => {
    await authorizeThreadAccess(ctx, threadId);

    const { messageId } = await designAgent.saveMessage(ctx, {
      threadId,
      prompt,
      skipEmbeddings: true,
    });

    await ctx.scheduler.runAfter(0, internal.messages.streamAsync, {
      threadId,
      promptMessageId: messageId,
    });

    return null;
  },
});

/**
 * Internal action that generates the AI response with streaming.
 * Streams word-by-word with 100ms throttle for natural reading experience.
 */
export const streamAsync = internalAction({
  args: { promptMessageId: v.string(), threadId: v.string() },
  returns: v.null(),
  handler: async (ctx, { promptMessageId, threadId }) => {
    const result = await designAgent.streamText(
      ctx,
      { threadId },
      { promptMessageId },
      { saveStreamDeltas: { chunking: "word", throttleMs: 100 } }
    );

    await result.consumeStream();
    return null;
  },
});

/**
 * Query to list thread messages with streaming support.
 * Returns paginated messages and active streams for real-time updates.
 */
export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const { threadId, streamArgs } = args;
    await authorizeThreadAccess(ctx, threadId);

    const streams = await syncStreams(ctx, components.agent, {
      threadId,
      streamArgs,
    });

    const paginated = await listUIMessages(ctx, components.agent, args);

    return {
      ...paginated,
      streams,
    };
  },
});
