"use node";
/**
 * A small JPEG of a room photo for a ChatGPT or Codex tool result. Hosts that
 * don't render the widget still show (or pass to the model) an MCP `image`
 * content block, so this is how the redesigned room stays visible there.
 */
import { v } from "convex/values";
import sharp from "sharp";
import { internalAction } from "./_generated/server";

/** Long edge in pixels; sharp enough to read, small enough to inline. */
const PREVIEW_EDGE = 1024;
const JPEG_QUALITY = 80;
/**
 * Previews kept in memory by storage id. A warm instance answers repeated
 * `get_room` calls without re-reading and re-encoding the photo; a cold one
 * just encodes again, which is cheap enough not to need a stored copy.
 */
const CACHE_SIZE = 32;

const vPreview = v.object({
  data: v.string(),
  height: v.number(),
  mimeType: v.literal("image/jpeg"),
  width: v.number(),
});

type Preview = typeof vPreview.type;

const cache = new Map<string, Preview>();

export const previewImage = internalAction({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args): Promise<Preview | null> => {
    const cached = cache.get(args.storageId);
    if (cached) {
      return cached;
    }
    const blob = await ctx.storage.get(args.storageId);
    if (!blob) {
      return null;
    }
    const { data, info } = await sharp(Buffer.from(await blob.arrayBuffer()))
      .rotate()
      .resize({
        fit: "inside",
        height: PREVIEW_EDGE,
        width: PREVIEW_EDGE,
        withoutEnlargement: true,
      })
      .jpeg({ mozjpeg: true, quality: JPEG_QUALITY })
      .toBuffer({ resolveWithObject: true });
    const preview: Preview = {
      data: data.toString("base64"),
      height: info.height,
      mimeType: "image/jpeg",
      width: info.width,
    };
    if (cache.size >= CACHE_SIZE) {
      const oldest = cache.keys().next().value;
      if (oldest) {
        cache.delete(oldest);
      }
    }
    cache.set(args.storageId, preview);
    return preview;
  },
  returns: v.union(vPreview, v.null()),
});
