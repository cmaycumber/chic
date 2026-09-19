"use client";

import type { SyntheticEvent } from "react";
import { amazonSearchUrl, formatPrice } from "@/components/room/utils";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import type { ShowcaseHotspot } from "@/lib/showcase";
import { cn } from "@/lib/utils";

const DOT_SIZE = 28;
const CARD_WIDTH_CLASS = "w-56";
const CARD_RADIUS = 20;

type HotspotEventHandler = (event: SyntheticEvent<HTMLButtonElement>) => void;

interface HomeShowcaseHotspotProps {
  /** Card position in container pixels, already clamped to the viewport. */
  cardLeft: number;
  cardTop: number;
  hotspot: ShowcaseHotspot;
  isOpen: boolean;
  onEnter: HotspotEventHandler;
  onLeave: HotspotEventHandler;
  onToggle: HotspotEventHandler;
  reduceMotion: boolean;
  x: number;
  y: number;
}

/**
 * One tappable frost-glass dot over the photo, plus its product card. The
 * card is a sibling of the dot rather than a child, so it can be placed in
 * container coordinates and never hang off an edge on a narrow screen.
 */
export function HomeShowcaseHotspot({
  cardLeft,
  cardTop,
  hotspot,
  isOpen,
  onEnter,
  onLeave,
  onToggle,
  reduceMotion,
  x,
  y,
}: HomeShowcaseHotspotProps) {
  return (
    <>
      <div
        className="pointer-events-auto absolute"
        style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
      >
        {reduceMotion ? null : (
          <span
            aria-hidden="true"
            className="showcase-hotspot-pulse absolute inset-0 rounded-full bg-white/70"
          />
        )}

        <button
          aria-expanded={isOpen}
          className={cn(
            "liquid-glass liquid-glass-frost glass-press relative flex items-center justify-center rounded-full",
            isOpen && "ring-2 ring-white/80"
          )}
          data-hotspot-id={hotspot.id}
          onBlur={onLeave}
          onClick={onToggle}
          onFocus={onEnter}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          style={{ height: DOT_SIZE, width: DOT_SIZE }}
          type="button"
        >
          <span aria-hidden="true" className="size-2 rounded-full bg-white" />
          <span className="sr-only">Shop {hotspot.label}</span>
        </button>
      </div>

      {isOpen ? (
        <div
          className={cn("pointer-events-auto absolute z-10", CARD_WIDTH_CLASS)}
          style={{ left: cardLeft, top: cardTop }}
        >
          <LiquidGlass
            className="flex flex-col gap-1 p-3.5"
            cornerRadius={CARD_RADIUS}
            hostClassName={CARD_WIDTH_CLASS}
            tone="frost"
          >
            <p className="font-serif text-sm text-white leading-snug">
              {hotspot.label}
            </p>
            <p className="font-medium text-sm text-white">
              {formatPrice(hotspot.price)}
            </p>
            <p className="text-white/70 text-xs leading-snug">
              {hotspot.detail}
            </p>
            <a
              className="mt-1 w-fit text-brass text-xs underline-offset-4 hover:underline"
              href={amazonSearchUrl(hotspot.searchQuery)}
              rel="noopener noreferrer"
              target="_blank"
            >
              Shop on Amazon
            </a>
          </LiquidGlass>
        </div>
      ) : null}
    </>
  );
}
