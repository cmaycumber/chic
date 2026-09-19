"use client";

import { Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RoomItem, RoomMode, RoomVersion } from "./types";
import { toPercent } from "./utils";

const BOX_CENTER = 2;

interface RoomHotspotsProps {
  items: RoomItem[];
  itemsStatus: RoomVersion["itemsStatus"];
  mode: RoomMode;
  onSelect: (itemId: string) => void;
  selectedItemId: string | null;
}

/**
 * A tappable glass dot at the centre of every detected piece of furniture.
 * Prominent while shopping, faded back while commenting so the pins stay
 * readable.
 */
export function RoomHotspots({
  items,
  itemsStatus,
  mode,
  onSelect,
  selectedItemId,
}: RoomHotspotsProps) {
  if (itemsStatus === "pending") {
    return (
      <output className="liquid-glass liquid-glass-frost absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full py-1.5 pr-3 pl-2.5 text-white text-xs">
        <Loader2 className="size-3.5 animate-spin text-[var(--accent-brass)]" />
        Finding furniture…
      </output>
    );
  }

  if (itemsStatus !== "ready") {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0">
      {items.map((item) => {
        const isSelected = selectedItemId === item.id;
        return (
          <div
            className="group pointer-events-auto absolute"
            key={item.id}
            style={{
              left: toPercent(item.box.x + item.box.width / BOX_CENTER),
              top: toPercent(item.box.y + item.box.height / BOX_CENTER),
              transform: "translate(-50%, -50%)",
            }}
          >
            <Button
              aria-pressed={isSelected}
              className={cn(
                // A thumb needs 40px; a cursor is happy with less.
                "size-10 transition-opacity md:size-8",
                mode === "comment" && "opacity-50 hover:opacity-100",
                isSelected &&
                  "opacity-100 ring-2 ring-[var(--accent-brass)] ring-offset-0"
              )}
              onClick={() => onSelect(item.id)}
              size="icon-sm"
              type="button"
              variant="glass-dark"
            >
              <Tag className="size-4 md:size-3.5" />
              <span className="sr-only">Shop {item.label}</span>
            </Button>
            <span className="liquid-glass liquid-glass-dark pointer-events-none absolute top-full left-1/2 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
