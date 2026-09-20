import type { Route } from "next";
import Link from "next/link";
import { GalleryRoomCard } from "@/components/gallery-room-card";
import { UploadRoomButton } from "@/components/upload-room-button";
import type { GalleryCard } from "@/lib/gallery";
import { type RoomStyle, roomStyleLabel } from "@/lib/room-taxonomy";
import { cn } from "@/lib/utils";

const PRIORITY_CARDS = 3;

interface StyleFilterProps {
  activeStyle?: RoomStyle;
  basePath: Route;
  styles: RoomStyle[];
}

/**
 * Style is the one thing worth narrowing by, and the chips are links so the
 * filtered page is a page: shareable, crawlable, rendered on the server.
 */
function StyleFilter({ activeStyle, basePath, styles }: StyleFilterProps) {
  if (styles.length === 0) {
    return null;
  }

  const chip = (href: Route, label: string, isActive: boolean) => (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors",
        isActive
          ? "border-transparent bg-foreground text-background"
          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
      )}
      href={href}
      key={href}
    >
      {label}
    </Link>
  );

  return (
    <div className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
      {chip(basePath, "All styles", activeStyle === undefined)}
      {styles.map((style) =>
        chip(
          `${basePath}?style=${style}` as Route,
          roomStyleLabel(style) ?? style,
          style === activeStyle
        )
      )}
    </div>
  );
}

interface RoomIdeasGalleryProps {
  activeStyle?: RoomStyle;
  basePath: Route;
  /** What to say when there is nothing here yet, in the page's own words. */
  emptyMessage: string;
  rooms: GalleryCard[];
  styles: RoomStyle[];
}

/** The grid itself: real rooms people shared, newest first. */
export function RoomIdeasGallery({
  activeStyle,
  basePath,
  emptyMessage,
  rooms,
  styles,
}: RoomIdeasGalleryProps) {
  return (
    <section className="container mx-auto px-4 pb-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <StyleFilter
          activeStyle={activeStyle}
          basePath={basePath}
          styles={styles}
        />

        {rooms.length === 0 ? (
          <div className="rounded-2xl border border-border border-dashed px-6 py-16 text-center">
            <p className="font-serif text-2xl text-foreground">
              {emptyMessage}
            </p>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground text-sm">
              Upload a photo, comment on what you want changed, and share the
              result. Shared rooms show up here.
            </p>
            <div className="mt-6 flex justify-center">
              <UploadRoomButton label="Upload a photo" variant="compact" />
            </div>
          </div>
        ) : (
          <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((card, index) => (
              <GalleryRoomCard
                card={card}
                key={card.roomId}
                priority={index < PRIORITY_CARDS}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
