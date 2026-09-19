import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// EXIF orientation values (1-8)
const exifOrientation = {
  dimensionSwapThreshold: 5,
  flipHorizontal: 2,
  flipHorizontalRotate90: 7,
  flipHorizontalRotate270: 5,
  flipVertical: 4,
  max: 8,
  min: 1,
  normal: 1,
  rotate90: 6,
  rotate180: 3,
  rotate270: 8,
} as const;

// JPEG/EXIF binary format markers
const jpegMarkers = {
  app1Marker: 0xff_e1,
  endOfImage: 0xff_d9,
  magic: 0xff_d8,
  startOfScan: 0xff_da,
} as const;

const exifHeader = {
  headerSize: 6,
  ifdEntrySize: 12,
  littleEndian: 0x49_49,
  orientationTag: 0x01_12,
  orientationValueOffset: 8,
  stringLength: 4,
} as const;

interface ExifSegmentData {
  ifdOffset: number;
  littleEndian: boolean;
  tiffOffset: number;
}

/**
 * Apply canvas transform based on EXIF orientation
 */
function applyOrientationTransform(
  ctx: CanvasRenderingContext2D,
  orientation: number,
  width: number,
  height: number
): void {
  const transforms: Record<number, () => void> = {
    [exifOrientation.flipHorizontal]: () =>
      ctx.transform(-1, 0, 0, 1, width, 0),
    [exifOrientation.rotate180]: () =>
      ctx.transform(-1, 0, 0, -1, width, height),
    [exifOrientation.flipVertical]: () => ctx.transform(1, 0, 0, -1, 0, height),
    [exifOrientation.flipHorizontalRotate270]: () =>
      ctx.transform(0, 1, 1, 0, 0, 0),
    [exifOrientation.rotate90]: () => ctx.transform(0, 1, -1, 0, height, 0),
    [exifOrientation.flipHorizontalRotate90]: () =>
      ctx.transform(0, -1, -1, 0, height, width),
    [exifOrientation.rotate270]: () => ctx.transform(0, -1, 1, 0, 0, width),
  };

  const transformFn = transforms[orientation];
  if (transformFn) {
    transformFn();
  }
}

/**
 * Draw corrected image to canvas and convert to file
 */
function createCorrectedFile(
  img: HTMLImageElement,
  orientation: number,
  originalFile: File
): Promise<File> {
  return new Promise((resolve) => {
    let { width, height } = img;

    // Orientations 5-8 swap width and height
    if (orientation >= exifOrientation.dimensionSwapThreshold) {
      [width, height] = [height, width];
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve(originalFile);
      return;
    }

    applyOrientationTransform(ctx, orientation, width, height);
    ctx.drawImage(img, 0, 0);

    const jpegQuality = 0.95;
    canvas.toBlob(
      (resultBlob) => {
        if (resultBlob) {
          const correctedFile = new File([resultBlob], originalFile.name, {
            lastModified: originalFile.lastModified,
            type: originalFile.type || "image/jpeg",
          });
          resolve(correctedFile);
        } else {
          resolve(originalFile);
        }
      },
      originalFile.type || "image/jpeg",
      jpegQuality
    );
  });
}

/**
 * Load image from blob and apply orientation correction
 */
function loadAndCorrectImage(
  arrayBuffer: ArrayBuffer,
  orientation: number,
  originalFile: File
): Promise<File> {
  return new Promise((resolve) => {
    const blob = new Blob([arrayBuffer], { type: originalFile.type });
    const imageUrl = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(imageUrl);
      createCorrectedFile(img, orientation, originalFile).then(resolve);
    };

    img.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      resolve(originalFile);
    };

    img.src = imageUrl;
  });
}

/**
 * Fix image orientation based on EXIF data
 * Returns a new File with correct orientation applied via canvas
 */
export function fixImageOrientation(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Failed to read file"));

    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const orientation = getExifOrientation(arrayBuffer);

        if (orientation === exifOrientation.normal) {
          resolve(file);
          return;
        }

        loadAndCorrectImage(arrayBuffer, orientation, file).then(resolve);
      } catch {
        resolve(file);
      }
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Get EXIF orientation from image file
 * Returns orientation value 1-8, or 1 (normal) if not found
 */
function getExifOrientation(arrayBuffer: ArrayBuffer): number {
  const view = new DataView(arrayBuffer);
  const length = view.byteLength;

  if (!isValidJpeg(view)) {
    return exifOrientation.normal;
  }

  const exifData = findExifSegment(view, length);
  if (!exifData) {
    return exifOrientation.normal;
  }

  return parseOrientationFromExif(view, exifData, length);
}

function isValidJpeg(view: DataView): boolean {
  return view.byteLength >= 2 && view.getUint16(0, false) === jpegMarkers.magic;
}

function findExifSegment(
  view: DataView,
  length: number
): ExifSegmentData | null {
  let offset = 2;

  while (offset < length) {
    if (offset + 2 > length) {
      return null;
    }

    const marker = view.getUint16(offset, false);
    offset += 2;

    if (marker === jpegMarkers.app1Marker) {
      return parseExifHeaderData(view, offset, length);
    }

    if (
      marker === jpegMarkers.endOfImage ||
      marker === jpegMarkers.startOfScan
    ) {
      return null;
    }

    if (offset + 2 > length) {
      return null;
    }
    offset += view.getUint16(offset, false);
  }

  return null;
}

function parseExifHeaderData(
  view: DataView,
  startOffset: number,
  length: number
): ExifSegmentData | null {
  const segmentLengthSize = 2;
  const headerCheckSize = exifHeader.headerSize + segmentLengthSize;
  if (startOffset + headerCheckSize > length) {
    return null;
  }

  let currentOffset = startOffset + segmentLengthSize; // Skip segment length

  const exifHeaderBytes: number[] = [];
  for (let i = 0; i < exifHeader.stringLength; i += 1) {
    exifHeaderBytes.push(view.getUint8(currentOffset + i));
  }

  const exifHeaderStr = String.fromCharCode(...exifHeaderBytes);

  if (exifHeaderStr !== "Exif") {
    return null;
  }

  currentOffset += exifHeader.headerSize;
  const tiffOffset = currentOffset;

  if (currentOffset + 2 > length) {
    return null;
  }

  const byteOrder = view.getUint16(currentOffset, false);
  const littleEndian = byteOrder === exifHeader.littleEndian;

  const tiffHeaderSize = 4;
  currentOffset += tiffHeaderSize;

  const ifdOffsetSize = 4;
  if (currentOffset + ifdOffsetSize > length) {
    return null;
  }

  const ifdOffset = view.getUint32(currentOffset, littleEndian);

  return { ifdOffset, littleEndian, tiffOffset };
}

function parseOrientationFromExif(
  view: DataView,
  exifData: ExifSegmentData,
  length: number
): number {
  const { tiffOffset, littleEndian, ifdOffset } = exifData;
  let offset = tiffOffset + ifdOffset;

  if (offset + 2 > length) {
    return exifOrientation.normal;
  }

  const numEntries = view.getUint16(offset, littleEndian);
  offset += 2;

  for (let i = 0; i < numEntries; i += 1) {
    if (offset + exifHeader.ifdEntrySize > length) {
      return exifOrientation.normal;
    }

    const tag = view.getUint16(offset, littleEndian);

    if (tag === exifHeader.orientationTag) {
      const orientation = view.getUint16(
        offset + exifHeader.orientationValueOffset,
        littleEndian
      );
      const isValidOrientation =
        orientation >= exifOrientation.min &&
        orientation <= exifOrientation.max;
      return isValidOrientation ? orientation : exifOrientation.normal;
    }

    offset += exifHeader.ifdEntrySize;
  }

  return exifOrientation.normal;
}
