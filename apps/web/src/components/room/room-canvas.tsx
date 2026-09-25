"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import type { ReactNode, SyntheticEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { PIN_POPOVER_WIDTH, placePinPopover } from "./pin-placement";
import { RoomHotspots } from "./room-hotspots";
import { RoomPins } from "./room-pins";
import type { Anchor, CommentPin, RoomMode, RoomVersion } from "./types";
import {
  type ImageRect,
  type NaturalSize,
  useImageRect,
} from "./use-image-rect";
import { clamp01 } from "./utils";

/** Matches the Tailwind `duration-500` used on the incoming image layer. */
const FADE_MS = 500;
/** Tapping within this fraction of the pin clears it instead of moving it. */
const SAME_SPOT_THRESHOLD = 0.03;
const CENTER = 0.5;
/** A phone keyboard covers roughly the lower half; a pin above it stays seen. */
const KEYBOARD_SAFE_FRACTION = 0.42;
/** What a phone bottom sheet leaves of the screen, as a fraction of it. */
const SHEET_VISIBLE_FRACTION = 0.4;
/** The photo never slides up under the floating top bar. */
const TOP_SAFE_PX = 88;

/**
 * How far to slide the photo up so a bottom sheet does not sit on top of the
 * thing it is about. A letterboxed landscape photo is centred in a portrait
 * screen, which is exactly where the sheet opens.
 */
function sheetLift(rect: ImageRect, isSheetOpen: boolean): number {
  if (!(isSheetOpen && rect.height > 0)) {
    return 0;
  }
  const overlap =
    rect.top + rect.height - rect.containerHeight * SHEET_VISIBLE_FRACTION;
  if (overlap <= 0) {
    return 0;
  }
  return Math.min(overlap, Math.max(0, rect.top - TOP_SAFE_PX));
}

interface RoomCanvasProps {
  /** Rendered beside a fresh pin. The canvas owns where it goes. */
  anchorPopover: ReactNode;
  isGenerating: boolean;
  /** A phone bottom sheet is covering the lower part of the screen. */
  isSheetOpen: boolean;
  mode: RoomMode;
  onPickAnchor: (anchor: Anchor | null, isAboveKeyboard: boolean) => void;
  onSelectItem: (itemId: string) => void;
  onSelectPin: (commentId: string) => void;
  pendingAnchor: Anchor | null;
  pins: CommentPin[];
  selectedItemId: string | null;
  /** What the in-flight comment's stage says. `null` shows the default text. */
  stageText: string | null;
  version: RoomVersion | null;
}

interface ImageLayerProps {
  alt: string;
  className?: string;
  onReady?: (size: NaturalSize) => void;
  src: string;
}

function ImageLayer({ alt, className, onReady, src }: ImageLayerProps) {
  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const { naturalHeight, naturalWidth } = event.currentTarget;
    onReady?.({ height: naturalHeight, width: naturalWidth });
  };

  return (
    <Image
      alt={alt}
      className={cn("object-contain", className)}
      draggable={false}
      fill
      onLoad={handleLoad}
      priority
      sizes="100vw"
      src={src}
    />
  );
}

function imageOpacityClass(isReady: boolean, isGenerating: boolean): string {
  if (!isReady) {
    return "opacity-0";
  }
  if (isGenerating) {
    return "opacity-70";
  }
  return "opacity-100";
}

/**
 * The photo, full screen. Everything that maps to the image (pins, hotspots,
 * the tap target for pinning) lives in an overlay sized to the rendered image
 * rather than the container, because `object-contain` letterboxes.
 */
export function RoomCanvas({
  anchorPopover,
  isGenerating,
  isSheetOpen,
  mode,
  onPickAnchor,
  onSelectItem,
  onSelectPin,
  pendingAnchor,
  pins,
  selectedItemId,
  stageText,
  version,
}: RoomCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState<NaturalSize | null>(null);
  const [readyUrl, setReadyUrl] = useState<string | null>(null);
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const rect = useImageRect(containerRef, natural);

  const imageUrl = version?.imageUrl ?? null;
  const isReady = imageUrl !== null && readyUrl === imageUrl;

  // Keep the previous version on screen until the new one has painted.
  useEffect(() => {
    if (!(imageUrl && readyUrl === imageUrl)) {
      return;
    }
    const timer = setTimeout(() => setDisplayUrl(imageUrl), FADE_MS);
    return () => clearTimeout(timer);
  }, [imageUrl, readyUrl]);

  const handleReady = (size: NaturalSize) => {
    setNatural((previous) => {
      if (
        previous &&
        previous.width === size.width &&
        previous.height === size.height
      ) {
        return previous;
      }
      return size;
    });
    setReadyUrl(imageUrl);
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const isKeyboard = event.detail === 0;
    const x = isKeyboard
      ? CENTER
      : clamp01((event.clientX - bounds.left) / bounds.width);
    const y = isKeyboard
      ? CENTER
      : clamp01((event.clientY - bounds.top) / bounds.height);

    const isSameSpot =
      pendingAnchor !== null &&
      Math.abs(pendingAnchor.x - x) < SAME_SPOT_THRESHOLD &&
      Math.abs(pendingAnchor.y - y) < SAME_SPOT_THRESHOLD;

    const isAboveKeyboard =
      rect.top + y * rect.height <
      rect.containerHeight * KEYBOARD_SAFE_FRACTION;

    onPickAnchor(isSameSpot ? null : { x, y }, isAboveKeyboard);
  };

  const showPrevious = displayUrl !== null && displayUrl !== imageUrl;
  const canInteract = rect.width > 0 && !isGenerating;
  const lift = sheetLift(rect, isSheetOpen);

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-ink transition-transform duration-300 ease-out"
      ref={containerRef}
      style={lift === 0 ? undefined : { transform: `translateY(${-lift}px)` }}
    >
      {/* Transitional only: the incoming layer carries the description. */}
      {showPrevious ? <ImageLayer alt="" src={displayUrl} /> : null}

      {imageUrl ? (
        <ImageLayer
          alt="Your room"
          className={cn(
            "transition-opacity duration-500",
            imageOpacityClass(isReady, isGenerating)
          )}
          key={imageUrl}
          onReady={handleReady}
          src={imageUrl}
        />
      ) : null}

      {!imageUrl && (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-white/60">
          This room has no photo yet.
        </p>
      )}

      {rect.width > 0 && (
        <div
          className="pointer-events-none absolute"
          style={{
            height: rect.height,
            left: rect.left,
            top: rect.top,
            width: rect.width,
          }}
        >
          {mode === "comment" && canInteract && (
            <button
              className="pointer-events-auto absolute inset-0 cursor-crosshair"
              onClick={handleOverlayClick}
              type="button"
            >
              <span className="sr-only">
                Pin your comment to a spot on the photo
              </span>
            </button>
          )}

          {canInteract && version ? (
            <RoomHotspots
              items={version.items}
              itemsStatus={version.itemsStatus}
              mode={mode}
              onSelect={onSelectItem}
              selectedItemId={selectedItemId}
            />
          ) : null}

          {!isGenerating && (
            <RoomPins
              onSelectPin={onSelectPin}
              pendingAnchor={pendingAnchor}
              pins={pins}
            />
          )}
        </div>
      )}

      {pendingAnchor !== null && anchorPopover !== null && rect.width > 0 ? (
        <div
          className="pointer-events-auto absolute z-10"
          style={{
            ...placePinPopover(pendingAnchor, rect),
            width: PIN_POPOVER_WIDTH,
          }}
        >
          {anchorPopover}
        </div>
      ) : null}

      {Boolean(isGenerating) && (
        <output className="liquid-glass liquid-glass-frost absolute top-24 left-1/2 flex -translate-x-1/2 items-center gap-2.5 rounded-full py-2 pr-4 pl-3 font-sans text-sm text-white shadow-lg">
          <Loader2 className="size-4 animate-spin text-[var(--accent-brass)]" />
          {stageText ?? "Rendering your change…"}
        </output>
      )}
    </div>
  );
}
