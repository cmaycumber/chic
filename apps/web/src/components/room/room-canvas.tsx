"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import { type SyntheticEvent, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { RoomHotspots } from "./room-hotspots";
import { RoomPins } from "./room-pins";
import type { Anchor, CommentPin, RoomMode, RoomVersion } from "./types";
import { type NaturalSize, useImageRect } from "./use-image-rect";
import { clamp01 } from "./utils";

/** Matches the Tailwind `duration-500` used on the incoming image layer. */
const FADE_MS = 500;
/** Tapping within this fraction of the pin clears it instead of moving it. */
const SAME_SPOT_THRESHOLD = 0.03;
const CENTER = 0.5;

interface RoomCanvasProps {
  isGenerating: boolean;
  mode: RoomMode;
  onPickAnchor: (anchor: Anchor | null) => void;
  onSelectItem: (itemId: string) => void;
  onSelectPin: (commentId: string) => void;
  pendingAnchor: Anchor | null;
  pins: CommentPin[];
  selectedItemId: string | null;
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
  isGenerating,
  mode,
  onPickAnchor,
  onSelectItem,
  onSelectPin,
  pendingAnchor,
  pins,
  selectedItemId,
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

    onPickAnchor(isSameSpot ? null : { x, y });
  };

  const showPrevious = displayUrl !== null && displayUrl !== imageUrl;
  const canInteract = rect.width > 0 && !isGenerating;

  return (
    <div className="absolute inset-0 overflow-hidden bg-ink" ref={containerRef}>
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

      {Boolean(isGenerating) && (
        <output className="liquid-glass liquid-glass-frost absolute top-24 left-1/2 flex -translate-x-1/2 items-center gap-2.5 rounded-full py-2 pr-4 pl-3 font-sans text-sm text-white shadow-lg">
          <Loader2 className="size-4 animate-spin text-[var(--accent-brass)]" />
          Rendering your change…
        </output>
      )}
    </div>
  );
}
