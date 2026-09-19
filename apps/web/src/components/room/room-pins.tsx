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
        <div
          className="group pointer-events-none absolute"
          key={pin.commentId}
          style={{
            left: toPercent(pin.anchor.x),
            top: toPercent(pin.anchor.y),
            transform: PIN_TRANSFORM,
          }}
        >
          <button
            className={cn(
              "liquid-glass liquid-glass-dark glass-press pointer-events-auto flex size-7 items-center justify-center rounded-full font-medium text-[11px] text-white",
              pin.status === "failed" && "text-[var(--accent-coral)]",
              pin.status === "pending" && "animate-pulse"
            )}
            onClick={() => onSelectPin(pin.commentId)}
            type="button"
          >
            {pin.number}
            <span className="sr-only">
              Open comment {pin.number}
              {pin.authorName ? ` from ${pin.authorName}` : ""}
            </span>
          </button>

          {/* In a shared room the pin says who asked, so a photo covered in
              numbers still reads as a conversation. */}
          {pin.authorInitial === null ? null : (
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full font-medium text-[8px] text-white ring-1 ring-black/30",
                pin.authorIsOwner
                  ? "bg-[var(--accent-brass)]"
                  : "liquid-glass liquid-glass-frost"
              )}
            >
              {pin.authorInitial}
            </span>
          )}

          {/* The comment itself, on hover, so the numbers mean something. */}
          <span
            aria-hidden="true"
            className="liquid-glass liquid-glass-frost pointer-events-none absolute bottom-full left-1/2 mb-2 line-clamp-3 w-max max-w-52 -translate-x-1/2 rounded-xl px-2.5 py-1.5 text-[11px] text-white leading-snug opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
          >
            {pin.authorInitial === null ||
            pin.authorName === undefined ? null : (
              <span className="mb-0.5 block font-medium text-white/60">
                {pin.authorName}
              </span>
            )}
            {pin.text}
          </span>
        </div>
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
