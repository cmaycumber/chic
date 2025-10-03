import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
  }),
  chats: defineTable({
    userId: v.optional(v.string()),
    title: v.optional(v.string()),
  }).index("by_user", ["userId"]),
  messages: defineTable({
    chatId: v.id("chats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    parts: v.optional(
      v.array(
        v.union(
          v.object({
            type: v.literal("text"),
            text: v.string(),
          }),
          v.object({
            type: v.literal("reasoning"),
            text: v.string(),
          }),
          v.object({
            type: v.literal("source-url"),
            url: v.string(),
          }),
          v.object({
            type: v.literal("image"),
            url: v.string(),
            alt: v.optional(v.string()),
          })
        )
      )
    ),
    files: v.optional(
      v.array(
        v.object({
          type: v.literal("file"),
          url: v.string(),
          mediaType: v.optional(v.string()),
          filename: v.optional(v.string()),
        })
      )
    ),
  }).index("by_chat", ["chatId"]),
});
