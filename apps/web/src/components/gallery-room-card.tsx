"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { GalleryCard } from "@/lib/gallery";
import {
  creditedAuthor,
  roomStyleLabel,
  roomTypeLabel,
} from "@/lib/room-taxonomy";
import { cn } from "@/lib/utils";

/** "3 changes · 5 shoppable items", with the plurals sorted out. */
function cardMeta(commentCount: number, itemCount: number): string {
  const changes = `${commentCount} ${commentCount === 1 ? "change" : "changes"}`;
  const items = `${itemCount} shoppable ${itemCount === 1 ? "item" : "items"}`;
  return `${changes} · ${items}`;
}

interface GalleryRoomCardProps {
  card: GalleryCard;
  /** The first row is above the fold on every gallery page. */
  priority?: boolean;
  sizes?: string;
}

const DEFAULT_SIZES =
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

/**
 * A card is the whole story of a room in one tile: the after photo, the photo
 * it started as one tap away, and how much asking it took to get there.
 */
export function GalleryRoomCard({
  card,
  priority = false,
  sizes = DEFAULT_SIZES,
}: GalleryRoomCardProps) {
  const [showBefore, setShowBefore] = useState(false);
  const title = card.title ?? roomTypeLabel(card.roomType);
  const style = roomStyleLabel(card.style);
  const hasBefore = card.beforeUrl !== null && card.beforeUrl !== card.afterUrl;
  const author = creditedAuthor(card.ownerName);

  return (
    <article className="group relative">
      <Link className="block" href={`/r/${card.roomId}`} prefetch={false}>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-greige/40">
          {card.afterUrl ? (
            <Image
              alt={title}
              className={cn(
                "object-cover transition-all duration-500 group-hover:scale-[1.03]",
                showBefore ? "opacity-0" : "opacity-100"
              )}
              fill
              priority={priority}
              sizes={sizes}
              src={card.afterUrl}
            />
          ) : null}
          {hasBefore && card.beforeUrl ? (
            <Image
              alt={`${title}, before`}
              className={cn(
                "object-cover transition-opacity duration-500",
                showBefore ? "opacity-100" : "opacity-0"
              )}
              fill
              sizes={sizes}
              src={card.beforeUrl}
            />
          ) : null}
        </div>

        <div className="mt-3 space-y-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 font-serif text-foreground text-lg leading-snug">
              {title}
            </h3>
            {style ? (
              <span className="mt-0.5 shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                {style}
              </span>
            ) : null}
          </div>
          <p className="text-muted-foreground text-sm">
            {cardMeta(card.commentCount, card.itemCount)}
          </p>
          {author ? (
            <p className="text-muted-foreground/80 text-xs">by {author}</p>
          ) : null}
        </div>
      </Link>

      {hasBefore ? (
        <button
          aria-pressed={showBefore}
          className="absolute top-3 left-3 rounded-full bg-ink/70 px-2.5 py-1 font-medium text-[11px] text-white backdrop-blur-sm transition-colors hover:bg-ink/85"
          onClick={() => setShowBefore((current) => !current)}
          type="button"
        >
          {showBefore ? "After" : "Before"}
        </button>
      ) : null}
    </article>
  );
}
