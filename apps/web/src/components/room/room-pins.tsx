"use client";

import { cn } from "@/lib/utils";
import type { Anchor, CommentPin } from "./types";
import { toPercent } from "./utils";

interface RoomPinsProps {
  onSelectPin: (commentId: string) => void;
  pendingAnchor: Anchor | null;
  pins: CommentPin[];
}

const PIN_TRANSFORM = "translate(-50%, -50%)";

/** Numbered pins for anchored comments, plus the spot being pinned right now. */
export function RoomPins({ onSelectPin, pendingAnchor, pins }: RoomPinsProps) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {pins.map((pin) => (
        <button
          className={cn(
            "liquid-glass liquid-glass-dark glass-press pointer-events-auto absolute flex size-7 items-center justify-center rounded-full font-medium text-[11px] text-white",
            pin.status === "failed" && "text-[var(--accent-coral)]",
            pin.status === "pending" && "animate-pulse"
          )}
          key={pin.commentId}
          onClick={() => onSelectPin(pin.commentId)}
          style={{
            left: toPercent(pin.anchor.x),
            top: toPercent(pin.anchor.y),
            transform: PIN_TRANSFORM,
          }}
          type="button"
        >
          {pin.number}
          <span className="sr-only">Open comment {pin.number}</span>
        </button>
      ))}

      {pendingAnchor ? (
        <span
          aria-hidden="true"
          className="liquid-glass liquid-glass-brass absolute flex size-7 items-center justify-center rounded-full"
          style={{
            left: toPercent(pendingAnchor.x),
            top: toPercent(pendingAnchor.y),
            transform: PIN_TRANSFORM,
          }}
        >
          <span className="size-2.5 animate-ping rounded-full bg-white/80" />
        </span>
      ) : null}
    </div>
  );
}
