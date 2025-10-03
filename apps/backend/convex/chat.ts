import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, mutation, query } from "./_generated/server";

// Queries
export const list = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.userId) {
      return await ctx.db
        .query("chats")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();
    }
    return await ctx.db.query("chats").collect();
  },
});

export const getMessages = query({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) =>
    await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect(),
});

// Mutations
export const createChat = mutation({
  args: {
    title: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) =>
    await ctx.db.insert("chats", {
      title: args.title,
      userId: args.userId,
    }),
});

export const insertMessage = internalMutation({
  args: {
    chatId: v.id("chats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    parts: v.optional(v.any()),
    files: v.optional(v.any()),
  },
  handler: async (ctx, args) =>
    await ctx.db.insert("messages", {
      chatId: args.chatId,
      role: args.role,
      content: args.content,
      parts: args.parts,
      files: args.files,
    }),
});

// Actions for AI integration
const MAX_TITLE_LENGTH = 50;

export const streamChat = action({
  args: {
    chatId: v.optional(v.id("chats")),
    messages: v.array(
      v.object({
        id: v.string(),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        parts: v.optional(v.any()),
      })
    ),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { chatId, messages, model = "openai/gpt-4o" } = args;

    // Create a new chat if needed
    let activeChatId = chatId;
    if (!activeChatId) {
      activeChatId = await ctx.runMutation(internal.chat.createChat, {
        title:
          messages.at(0)?.content.substring(0, MAX_TITLE_LENGTH) || "New Chat",
      });
    }

    // Save user message
    const lastMessage = messages.at(-1);
    if (lastMessage) {
      await ctx.runMutation(internal.chat.insertMessage, {
        chatId: activeChatId,
        role: "user",
        content: lastMessage.content,
        parts: lastMessage.parts,
      });
    }

    // For now, return a simple response structure
    // You'll integrate with AI SDK stream in the Next.js route handler
    return {
      chatId: activeChatId,
      model,
      messages,
    };
  },
});
