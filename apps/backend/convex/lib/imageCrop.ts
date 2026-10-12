/**
 * Cut one piece of furniture out of a room photo, for searching by picture.
 * Uses sharp, so only "use node" actions may import this (sharp is an external
 * package in convex.json: it ships native libvips binaries).
 */
"use node";
import sharp from "sharp";

/** Normalized (0..1) box, as detection stores it. */
export interface CropBox {
  height: number;
  width: number;
  x: number;
  y: number;
}

/** Room context around the piece, as a share of its box on each side. */
const CROP_PADDING = 0.08;
/** Lens reads small pictures fine; bigger ones only cost upload time. */
const MAX_CROP_EDGE = 1024;
const MIN_CROP_EDGE = 16;
const CROP_QUALITY = 85;
const BOX_KEY_DECIMALS = 3;

/** The same box on the same photo always gives the same key. */
export function cropKey(storageId: string, box: CropBox): string {
  const parts = [box.x, box.y, box.width, box.height].map((value) =>
    value.toFixed(BOX_KEY_DECIMALS)
  );
  return `${storageId}@${parts.join(",")}`;
}

const clamp = (value: number, max: number) =>
  Math.min(max, Math.max(0, Math.round(value)));

/** A JPEG of `box` (plus a little margin) out of `image`. */
export async function cropImage(
  image: Uint8Array,
  box: CropBox
): Promise<Blob> {
  const source = sharp(image).rotate();
  const { height = 0, width = 0 } = await source.metadata();
  if (width < MIN_CROP_EDGE || height < MIN_CROP_EDGE) {
    throw new Error("Image is too small to crop");
  }
  const padX = box.width * CROP_PADDING;
  const padY = box.height * CROP_PADDING;
  const left = clamp((box.x - padX) * width, width - MIN_CROP_EDGE);
  const top = clamp((box.y - padY) * height, height - MIN_CROP_EDGE);
  const right = clamp((box.x + box.width + padX) * width, width);
  const bottom = clamp((box.y + box.height + padY) * height, height);
  const bytes = await source
    .extract({
      height: Math.max(MIN_CROP_EDGE, bottom - top),
      left,
      top,
      width: Math.max(MIN_CROP_EDGE, right - left),
    })
    .resize({
      fit: "inside",
      height: MAX_CROP_EDGE,
      width: MAX_CROP_EDGE,
      withoutEnlargement: true,
    })
    .jpeg({ quality: CROP_QUALITY })
    .toBuffer();
  return new Blob([new Uint8Array(bytes)], { type: "image/jpeg" });
}
