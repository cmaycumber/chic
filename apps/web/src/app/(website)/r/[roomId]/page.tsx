import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Article, WithContext } from "schema-dts";
import { GalleryRoomCard } from "@/components/gallery-room-card";
import { BeforeAfterSlider } from "@/components/share/before-after-slider";
import { ShareComments } from "@/components/share/share-comments";
import { ShareShop, shoppableItems } from "@/components/share/share-shop";
import type { PublicRoom } from "@/components/share/types";
import { UploadRoomButton } from "@/components/upload-room-button";
import { type GalleryCard, loadGallery } from "@/lib/gallery";
import { creditedAuthor, isRoomType, roomTypeLabel } from "@/lib/room-taxonomy";
import { siteConfig } from "@/lib/site-config";

/** A shared room is only as fresh as its owner's last change, so never cache. */
export const dynamic = "force-dynamic";

const SHARE_DESCRIPTION = "Before and after, made with comments";
const FALLBACK_TITLE = "A room";
const MORE_ROOMS = 6;

interface SharedRoomPageProps {
  params: Promise<{ roomId: string }>;
}

/** Null for a room that is private, deleted, or never existed. */
async function loadSharedRoom(roomId: string): Promise<PublicRoom | null> {
  try {
    return await fetchQuery(api.rooms.getPublic, {
      roomId: roomId as Id<"rooms">,
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: SharedRoomPageProps): Promise<Metadata> {
  const { roomId } = await params;
  const room = await loadSharedRoom(roomId);

  if (!room) {
    return { title: "Room not found" };
  }

  const title = `${room.title ?? FALLBACK_TITLE} on Chic`;

  return {
    alternates: { canonical: `${siteConfig.baseUrl}/r/${roomId}` },
    description: SHARE_DESCRIPTION,
    openGraph: {
      description: SHARE_DESCRIPTION,
      siteName: "Chic",
      title,
      type: "article",
    },
    // A room shared by link but kept out of the gallery is still a private
    // thing its owner passed to somebody. It is reachable, not publishable.
    robots: { follow: true, index: room.isListed === true },
    title,
    twitter: {
      card: "summary_large_image",
      description: SHARE_DESCRIPTION,
      title,
    },
  };
}

/** The slider needs two different photos; a room nobody has changed gets one. */
function ShareHero({
  afterUrl,
  beforeUrl,
  title,
}: {
  afterUrl: string | null;
  beforeUrl: string | null;
  title: string;
}) {
  if (!afterUrl) {
    return null;
  }

  if (!beforeUrl || beforeUrl === afterUrl) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink sm:rounded-3xl">
        <Image
          alt={title}
          className="object-cover"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 768px"
          src={afterUrl}
        />
      </div>
    );
  }

  return (
    <BeforeAfterSlider
      afterUrl={afterUrl}
      beforeUrl={beforeUrl}
      title={title}
    />
  );
}

/** Where this room sits in the gallery, for anyone who arrived by search. */
function Breadcrumb({ roomType }: { roomType: string }) {
  if (!isRoomType(roomType)) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 text-muted-foreground text-xs"
    >
      <Link className="hover:text-foreground" href="/ideas">
        Room ideas
      </Link>
      <ChevronRight aria-hidden="true" className="size-3" />
      <Link className="hover:text-foreground" href={`/ideas/${roomType}`}>
        {roomTypeLabel(roomType)}
      </Link>
    </nav>
  );
}

/** More of the same kind of room, so a visitor has somewhere to go next. */
function MoreRooms({
  heading,
  rooms,
}: {
  heading: string;
  rooms: GalleryCard[];
}) {
  if (rooms.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pt-14 sm:px-6">
      <h2 className="font-serif text-2xl text-foreground">{heading}</h2>
      <div className="mt-6 grid gap-x-5 gap-y-8 sm:grid-cols-2">
        {rooms.map((card) => (
          <GalleryRoomCard
            card={card}
            key={card.roomId}
            sizes="(max-width: 640px) 100vw, 370px"
          />
        ))}
      </div>
    </section>
  );
}

export default async function SharedRoomPage({ params }: SharedRoomPageProps) {
  const { roomId } = await params;
  const room = await loadSharedRoom(roomId);

  if (!room) {
    notFound();
  }

  const title = room.title ?? FALLBACK_TITLE;
  const before = room.versions.at(0);
  const after = room.versions.at(-1);
  const items = shoppableItems(room.versions);
  const roomType =
    room.roomType && isRoomType(room.roomType) ? room.roomType : undefined;
  const author = creditedAuthor(room.ownerName);

  const gallery = await loadGallery({ limit: MORE_ROOMS + 1, roomType });
  const more = gallery.rooms
    .filter((card) => card.roomId !== roomId)
    .slice(0, MORE_ROOMS);

  const jsonLd: WithContext<Article> = {
    "@context": "https://schema.org",
    "@type": "Article",
    author: author
      ? { "@type": "Person", name: author }
      : { "@type": "Organization", name: "Chic" },
    datePublished: new Date(before?._creationTime ?? Date.now()).toISOString(),
    description: SHARE_DESCRIPTION,
    headline: title,
    image: after?.imageUrl ?? undefined,
    mainEntityOfPage: `${siteConfig.baseUrl}/r/${roomId}`,
  };

  return (
    <div className="pb-14">
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for JSON-LD structured data for SEO
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />

      <section className="mx-auto w-full max-w-3xl px-4 pt-6 pb-5 sm:px-6">
        {room.roomType ? (
          <Breadcrumb roomType={room.roomType} />
        ) : (
          <p className="font-sans text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
            Shared on Chic
          </p>
        )}
        <h1 className="mt-2 font-serif text-3xl text-foreground leading-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          {author ? `by ${author} · ` : ""}
          {SHARE_DESCRIPTION}
        </p>
      </section>

      <div className="sm:mx-auto sm:max-w-3xl sm:px-6">
        <ShareHero
          afterUrl={after?.imageUrl ?? null}
          beforeUrl={before?.imageUrl ?? null}
          title={title}
        />
      </div>

      <ShareComments comments={room.comments} versions={room.versions} />

      <ShareShop items={items} />

      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 pt-6 text-center sm:px-6">
        <p className="font-serif text-2xl text-foreground">
          Your room, changed by asking.
        </p>
        <UploadRoomButton label="Try this on your room" variant="compact" />
      </section>

      <MoreRooms
        heading={
          roomType
            ? `More ${roomTypeLabel(roomType).toLowerCase()} ideas`
            : "More rooms on Chic"
        }
        rooms={more}
      />
    </div>
  );
}
