// See the docs at https://docs.convex.dev/agents/threads

import {
  createThread,
  getFile,
  getThreadMetadata,
  saveMessage,
  vMessage,
} from "@convex-dev/agent";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { z } from "zod/v3";
import { components, internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import {
  type ActionCtx,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server.js";
import { designAgent } from "./agents/design";
import { privateAction, privateMutation, privateQuery } from "./lib/utils";
import { getAuthUserId } from "./utils";

export const listThreads = privateQuery({
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

export const createNewThread = privateMutation({
  args: {
    title: v.optional(v.string()),
    initialMessage: v.optional(vMessage),
    fileIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { title, initialMessage, fileIds }) => {
    const userId = await getAuthUserId(ctx);
    const threadId = await createThread(ctx, components.agent, {
      userId,
      title,
    });
    if (initialMessage) {
      // If there are fileIds, we need to modify the message content to include them
      let messageToSave = initialMessage;

      if (fileIds && fileIds.length > 0) {
        // Ensure the message content is an array
        const textContent =
          typeof initialMessage.content === "string"
            ? initialMessage.content
            : initialMessage.content.find((c) => c.type === "text")?.text || "";

        // Build content with file parts
        // biome-ignore lint/suspicious/noExplicitAny: getFile returns FilePart/ImagePart which are compatible with content
        const content: any[] = [];

        for (const fileId of fileIds) {
          const { filePart, imagePart } = await getFile(
            ctx,
            components.agent,
            fileId
          );
          // Prefer imagePart for images, otherwise use filePart
          content.push(imagePart ?? filePart);
        }

        content.push({ type: "text" as const, text: textContent });

        messageToSave = {
          role: "user",
          // biome-ignore lint/suspicious/noExplicitAny: FilePart/ImagePart types are compatible but don't match exactly
          content: content as any,
        };
      }

      const { messageId } = await saveMessage(ctx, components.agent, {
        threadId,
        message: messageToSave,
        metadata: fileIds && fileIds.length > 0 ? { fileIds } : undefined,
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

export const getThreadDetails = privateQuery({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    await authorizeThreadAccess(ctx, threadId);
    const { title, summary } = await getThreadMetadata(ctx, components.agent, {
      threadId,
    });
    return { title, summary };
  },
});

export const updateThreadTitle = privateAction({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    await authorizeThreadAccess(ctx, threadId);
    const { thread } = await designAgent.continueThread(ctx, { threadId });
    const {
      object: { title, summary },
    } = await thread.generateObject(
      {
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

export const updateThreadTitleManually = privateMutation({
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

export const deleteThread = privateAction({
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

/**
 * Query to fetch designs for a thread with their image storage IDs
 */
export const getThreadDesigns = internalQuery({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    const artifacts = await ctx.db
      .query("artifacts")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .collect();

    const designs: Doc<"designs">[] = [];

    for (const artifact of artifacts) {
      if (artifact.artifact.type === "design") {
        const design = await ctx.db.get(artifact.artifact.designId);
        if (design) {
          designs.push(design);
        }
      }
    }

    return designs;
  },
});
