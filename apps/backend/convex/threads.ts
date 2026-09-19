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
      { paginationOpts: args.paginationOpts, userId: userId || undefined }
    );
    return threads;
  },
});

export const createNewThread = privateMutation({
  args: {
    fileIds: v.optional(v.array(v.string())),
    initialMessage: v.optional(vMessage),
    title: v.optional(v.string()),
  },
  handler: async (ctx, { title, initialMessage, fileIds }) => {
    const userId = await getAuthUserId(ctx);
    const threadId = await createThread(ctx, components.agent, {
      title,
      userId,
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

        const fileParts = await Promise.all(
          fileIds.map(async (fileId) => {
            const { filePart, imagePart } = await getFile(
              ctx,
              components.agent,
              fileId
            );
            // Prefer imagePart for images, otherwise use filePart
            return imagePart ?? filePart;
          })
        );
        content.push(...fileParts);

        content.push({ text: textContent, type: "text" as const });

        messageToSave = {
          // biome-ignore lint/suspicious/noExplicitAny: FilePart/ImagePart types are compatible but don't match exactly
          content: content as any,
          role: "user",
        };
      }

      const { messageId } = await saveMessage(ctx, components.agent, {
        message: messageToSave,
        metadata: fileIds && fileIds.length > 0 ? { fileIds } : undefined,
        threadId,
      });

      // Schedule the AI response to stream asynchronously
      await ctx.scheduler.runAfter(0, internal.messages.streamAsync, {
        promptMessageId: messageId,
        threadId,
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
    return { summary, title };
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
        prompt: "Generate a title and summary for this thread.",
        schema: z.object({
          summary: z.string().describe("The new summary for the thread"),
          title: z.string().describe("The new title for the thread"),
        }),
      },
      { storageOptions: { saveMessages: "none" } }
    );
    await thread.updateMetadata({ summary, title });
  },
});

export const updateThreadTitleManually = privateMutation({
  args: { threadId: v.string(), title: v.string() },
  handler: async (ctx, { threadId, title }) => {
    await authorizeThreadAccess(ctx, threadId);
    await ctx.runMutation(components.agent.threads.updateThread, {
      patch: { title },
      threadId,
    });
    return null;
  },
  returns: v.null(),
});

export const deleteThread = privateAction({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    await authorizeThreadAccess(ctx, threadId, true);

    await ctx.runAction(components.agent.threads.deleteAllForThreadIdSync, {
      threadId,
    });
    return null;
  },
  returns: v.null(),
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

    const fetchedDesigns = await Promise.all(
      artifacts.map((artifact) =>
        artifact.artifact.type === "design"
          ? ctx.db.get(artifact.artifact.designId)
          : null
      )
    );
    const designs: Doc<"designs">[] = fetchedDesigns.filter(
      (design): design is Doc<"designs"> => design !== null
    );

    return designs;
  },
});
