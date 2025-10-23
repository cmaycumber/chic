import { getFile, storeFile } from "@convex-dev/agent";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { action } from "./_generated/server";

/**
 * Upload a file to Convex storage and save a reference in the agent component.
 * Returns the fileId that can be used to reference the file in messages.
 */
export const uploadFile = action({
  args: {
    data: v.bytes(), // File data as bytes
    mimeType: v.string(),
    filename: v.optional(v.string()),
  },
  returns: v.string(), // Returns the fileId
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
export const getFileMetadata = action({
  args: {
    fileId: v.string(),
  },
  returns: v.object({
    url: v.union(v.string(), v.null()),
    storageId: v.string(),
    filename: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const { file } = await getFile(ctx, components.agent, args.fileId);
    return {
      url: file.url,
      storageId: file.storageId,
      filename: file.filename,
    };
  },
});
