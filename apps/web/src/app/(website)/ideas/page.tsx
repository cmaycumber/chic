import { api } from "@furnish/backend/convex/_generated/api";
import { ROOM_TYPES } from "@furnish/backend/convex/lib/roomTaxonomy";
import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import { RoomDesignerCta } from "@/components/room-designer-cta";
import { RoomIdeasGallery } from "@/components/room-ideas-gallery";
import { RoomIdeasHero } from "@/components/room-ideas-hero";
import { loadGallery } from "@/lib/gallery";
import { parseStyleParam, roomTypeLabel } from "@/lib/room-taxonomy";
import { siteConfig } from "@/lib/site-config";

/** The gallery moves at the speed people share rooms, which is not fast. */
export const revalidate = 300;

const GALLERY_LIMIT = 24;

const DESCRIPTION =
  "Real rooms people uploaded to Chic, before and after. Every room was changed by commenting on the photo, and every piece in it is tappable to shop on Amazon.";

export const metadata: Metadata = {
  alternates: { canonical: `${siteConfig.baseUrl}/ideas` },
  description: DESCRIPTION,
  keywords: [
    "room ideas",
    "before and after room makeover",
    "real room redesigns",
    "interior design ideas",
    "shoppable room design",
  ],
  openGraph: {
    description:
      "Before and after photos of real rooms. Comment to change yours, tap to shop it.",
    siteName: "Chic",
    title: "Room ideas from real rooms, before and after",
    type: "website",
  },
  title: "Room Ideas From Real Rooms, Before and After | Chic",
  twitter: {
    card: "summary_large_image",
    description:
      "Before and after photos of real rooms. Comment to change yours, tap to shop it.",
    title: "Room ideas from real rooms, before and after",
  },
};

interface IdeasPageProps {
  searchParams: Promise<{ style?: string }>;
}

/** How many listed rooms each type has, or nothing if the gallery is down. */
async function loadCounts(): Promise<Map<string, number>> {
  try {
    const { counts } = await fetchQuery(api.rooms.galleryCounts, {});
    return new Map(counts.map((entry) => [entry.roomType, entry.count]));
  } catch {
    return new Map();
  }
}

export default async function IdeasPage({ searchParams }: IdeasPageProps) {
  const style = parseStyleParam((await searchParams).style);
  const [gallery, counts] = await Promise.all([
    loadGallery({ limit: GALLERY_LIMIT, style }),
    loadCounts(),
  ]);

  const stocked = ROOM_TYPES.filter(
    (roomType) => (counts.get(roomType) ?? 0) > 0
  );

  return (
    <div className="min-h-screen">
      <RoomIdeasHero
        description={DESCRIPTION}
        roomCount={gallery.total}
        title="Room ideas from real rooms, before and after"
      />

      {stocked.length > 0 ? (
        <section className="container mx-auto px-4 pb-8 sm:px-6">
          <div className="-mx-4 mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-1 sm:mx-auto sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
            {stocked.map((roomType) => (
              <Link
                className="shrink-0 rounded-full border border-border px-3.5 py-1.5 text-muted-foreground text-sm transition-colors hover:border-foreground/30 hover:text-foreground"
                href={`/ideas/${roomType}`}
                key={roomType}
              >
                {roomTypeLabel(roomType)}
                <span className="ml-1.5 text-muted-foreground/60">
                  {counts.get(roomType)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <RoomIdeasGallery
        activeStyle={style}
        basePath="/ideas"
        emptyMessage="No rooms here yet. Be the first."
        rooms={gallery.rooms}
        styles={gallery.styles}
      />

      <section className="container mx-auto px-4 pb-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl space-y-8 text-muted-foreground">
            <div className="space-y-3">
              <h2 className="font-serif text-2xl text-foreground">
                What you are looking at
              </h2>
              <p>
                None of these are renders of imaginary rooms. Each one started
                as a photo somebody took of the room they actually live in. They
                pinned a comment on it, something like "swap this sofa for a
                green velvet one", and the photo changed around the comment in
                about twenty seconds. The before and after on every card is the
                same room, twenty seconds apart.
              </p>
            </div>
            <div className="space-y-3">
              <h2 className="font-serif text-2xl text-foreground">
                Everything in them is shoppable
              </h2>
              <p>
                A redesign you cannot buy from is just a picture. Open any room
                and tap a piece of furniture in it to see what it is and where
                to get it on Amazon. The item count on each card is how many
                pieces in that room are already matched to something you can
                order.
              </p>
            </div>
            <div className="space-y-3">
              <h2 className="font-serif text-2xl text-foreground">
                Browse by room
              </h2>
              <p className="flex flex-wrap gap-x-3 gap-y-1">
                {ROOM_TYPES.map((roomType) => (
                  <Link
                    className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
                    href={`/ideas/${roomType}`}
                    key={roomType}
                  >
                    {roomTypeLabel(roomType)} ideas
                  </Link>
                ))}
              </p>
            </div>
          </div>
        </div>
      </section>

      <RoomDesignerCta />
    </div>
  );
}
