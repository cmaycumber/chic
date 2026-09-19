import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MAX_UPLOAD_EDGE = 2048;
const UPLOAD_JPEG_QUALITY = 0.9;
const JPEG_EXTENSION_REGEX = /\.[^./]+$/;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image"));
    img.src = url;
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement, name: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not encode the image"));
          return;
        }
        const baseName = name.replace(JPEG_EXTENSION_REGEX, "") || "room";
        resolve(new File([blob], `${baseName}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      UPLOAD_JPEG_QUALITY
    );
  });
}

/**
 * Normalize a photo for upload: bake the EXIF orientation into the pixels,
 * strip metadata, and cap the longest edge at 2048px.
 *
 * Browsers already honour EXIF when decoding, so drawing the decoded image
 * to a canvas yields upright pixels. AI models and other clients read the
 * raw bytes, which is why un-normalized phone photos came back sideways.
 * Falls back to the original file if decoding fails (e.g. unsupported format).
 */
export async function fixImageOrientation(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(
      1,
      MAX_UPLOAD_EDGE / Math.max(img.naturalWidth, img.naturalHeight)
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return file;
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await canvasToJpeg(canvas, file.name);
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}
