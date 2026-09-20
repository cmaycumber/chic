import { ROOM_TYPES } from "@furnish/backend/convex/lib/roomTaxonomy";
import type { Metadata, Route } from "next";
import { notFound } from "next/navigation";
import { RoomDesignerCta } from "@/components/room-designer-cta";
import { RoomIdeasGallery } from "@/components/room-ideas-gallery";
import { RoomIdeasHero } from "@/components/room-ideas-hero";
import { loadGallery } from "@/lib/gallery";
import {
  isRoomType,
  parseStyleParam,
  type RoomType,
  roomTypeLabel,
  roomTypeTitle,
} from "@/lib/room-taxonomy";
import { siteConfig } from "@/lib/site-config";

/** The gallery moves at the speed people share rooms, which is not fast. */
export const revalidate = 300;

const GALLERY_LIMIT = 24;

interface RoomIdeasPageProps {
  params: Promise<{ roomType: string }>;
  searchParams: Promise<{ style?: string }>;
}

/** The nine pages exist whether or not anyone has shared one of these yet. */
export function generateStaticParams() {
  return ROOM_TYPES.map((roomType) => ({ roomType }));
}

/** "living room", the way it reads mid-sentence. */
function lowerLabel(roomType: RoomType): string {
  return roomTypeLabel(roomType).toLowerCase();
}

function describe(roomType: RoomType): string {
  const label = lowerLabel(roomType);
  return `Real ${label} photos on Chic, before and after. Every one started as somebody's own ${label}: comment to change it, tap any piece to shop it on Amazon.`;
}

export async function generateMetadata({
  params,
}: RoomIdeasPageProps): Promise<Metadata> {
  const { roomType } = await params;

  if (!isRoomType(roomType)) {
    return { title: "Room not found" };
  }

  const label = roomTypeLabel(roomType);
  const lower = lowerLabel(roomType);
  const title = `${label} ideas from real rooms, before and after`;
  const description = describe(roomType);

  return {
    alternates: { canonical: `${siteConfig.baseUrl}/ideas/${roomType}` },
    description,
    keywords: [
      `${lower} ideas`,
      `${lower} before and after`,
      `${lower} makeover`,
      `real ${lower} redesigns`,
      `shoppable ${lower} design`,
    ],
    openGraph: {
      description,
      siteName: "Chic",
      title,
      type: "website",
    },
    title: `${roomTypeTitle(roomType)} Ideas: Real Rooms, Before and After | Chic`,
    twitter: {
      card: "summary_large_image",
      description,
      title,
    },
  };
}

export default async function RoomIdeasPage({
  params,
  searchParams,
}: RoomIdeasPageProps) {
  const { roomType } = await params;

  if (!isRoomType(roomType)) {
    notFound();
  }

  const style = parseStyleParam((await searchParams).style);
  const gallery = await loadGallery({
    limit: GALLERY_LIMIT,
    roomType,
    style,
  });

  const label = roomTypeLabel(roomType);
  const lower = lowerLabel(roomType);

  return (
    <div className="min-h-screen">
      <RoomIdeasHero
        description={describe(roomType)}
        roomCount={gallery.total}
        title={`${label} ideas from real rooms, before and after`}
      />

      <RoomIdeasGallery
        activeStyle={style}
        basePath={`/ideas/${roomType}` as Route}
        emptyMessage={`Be the first to share a ${lower}.`}
        rooms={gallery.rooms}
        styles={gallery.styles}
      />

      <section className="container mx-auto px-4 pb-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl space-y-8 text-muted-foreground">
            <div className="space-y-3">
              <h2 className="font-serif text-2xl text-foreground">
                Why these {lower} photos look like {lower}s
              </h2>
              <p>
                Because they are. Every {lower} here began as a photo of a real
                one, with its real proportions, its real windows and its real
                awkward corner. The person who uploaded it pinned a comment on
                the part they wanted different, and the photo changed around the
                comment. Nothing was generated from scratch, so nothing has that
                showroom look that turns out to be unbuildable in your actual
                room.
              </p>
            </div>
            <div className="space-y-3">
              <h2 className="font-serif text-2xl text-foreground">
                Steal the pieces, not just the look
              </h2>
              <p>
                Open any {lower} above and tap the furniture in it. Chic finds
                each piece on Amazon, so a {lower} you like is a shopping list
                rather than a mood board. The count on each card says how many
                pieces in that room are already matched.
              </p>
            </div>
          </div>
        </div>
      </section>

      <RoomDesignerCta roomLabel={lower} />
    </div>
  );
}
