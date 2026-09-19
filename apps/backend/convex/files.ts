import { getFile, storeFile } from "@convex-dev/agent";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { privateAction, privateMutation, privateQuery } from "./lib/utils";

/**
 * Upload a file to Convex storage and save a reference in the agent component.
 * Returns the fileId that can be used to reference the file in messages.
 */
export const uploadFile = privateAction({
  args: {
    data: v.bytes(), // File data as bytes
    filename: v.optional(v.string()),
    mimeType: v.string(),
  },
  handler: async (ctx, args): Promise<string> =>
    await ctx.runAction(internal.files.internalUploadFile, args),
  returns: v.string(), // Returns the fileId
});

export const internalUploadFile = internalAction({
  args: {
    data: v.bytes(), // File data as bytes
    filename: v.optional(v.string()),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate and normalize mime type
    const mimeType = args.mimeType?.includes("/")
      ? args.mimeType
      : "application/octet-stream";

    // Store the file using the agent's storeFile utility
    const { file } = await storeFile(
      ctx,
      components.agent,
      new Blob([args.data], { type: mimeType }),
      {
        filename: args.filename,
      }
    );

    return file.fileId;
  },
});

/**
 * Get file metadata and URL for a given fileId.
 * Used to retrieve file information when displaying messages.
 */
export const getFileMetadata = privateAction({
  args: {
    fileId: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    url: string | null;
    storageId: string;
    filename?: string;
  }> => await ctx.runAction(internal.files.internalGetFileMetadata, args),
  returns: v.object({
    filename: v.optional(v.string()),
    storageId: v.string(),
    url: v.union(v.string(), v.null()),
  }),
});

export const internalGetFileMetadata = internalAction({
  args: {
    fileId: v.string(),
  },
  handler: async (ctx, args) => {
    const { file } = await getFile(ctx, components.agent, args.fileId);
    return {
      filename: file.filename,
      storageId: file.storageId,
      url: file.url,
    };
  },
});

/**
 * Generate an upload URL for direct file uploads from the client.
 */
export const generateUploadUrl = privateMutation({
  args: {},
  handler: async (ctx): Promise<string> =>
    await ctx.runMutation(internal.files.internalGenerateUploadUrl, {}),
  returns: v.string(),
});

export const internalGenerateUploadUrl = internalMutation({
  args: {},
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
});

/**
 * Get a temporary URL for a storage ID.
 */
export const getStorageUrl = privateQuery({
  args: {
    storageId: v.string(),
  },
  handler: async (ctx, args): Promise<string | null> =>
    await ctx.runQuery(internal.files.internalGetStorageUrl, args),
  returns: v.union(v.string(), v.null()),
});

export const internalGetStorageUrl = internalQuery({
  args: {
    storageId: v.string(),
  },
  handler: async (ctx, args) => await ctx.storage.getUrl(args.storageId),
});
