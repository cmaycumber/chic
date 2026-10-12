"use node";
/**
 * Make an uploaded photo safe to edit: turn it upright from its EXIF
 * orientation (phones store sideways pixels plus a flag), cap the long edge
 * like the web uploader does, and re-encode as JPEG so every editor accepts it.
 */
import { v } from "convex/values";
import sharp from "sharp";
import { internalAction } from "./_generated/server";

const MAX_EDGE = 2048;
const JPEG_QUALITY = 90;

export const normalizeUpload = internalAction({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const blob = await ctx.storage.get(args.storageId);
    if (!blob) {
      throw new Error("Uploaded photo is missing");
    }
    const output = await sharp(Buffer.from(await blob.arrayBuffer()))
      .rotate()
      .resize({
        fit: "inside",
        height: MAX_EDGE,
        width: MAX_EDGE,
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();
    const normalized = await ctx.storage.store(
      new Blob([new Uint8Array(output)], { type: "image/jpeg" })
    );
    await ctx.storage.delete(args.storageId);
    return normalized;
  },
  returns: v.id("_storage"),
});
