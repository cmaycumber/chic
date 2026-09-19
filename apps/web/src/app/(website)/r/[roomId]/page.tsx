import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BeforeAfterSlider } from "@/components/share/before-after-slider";
import { ShareComments } from "@/components/share/share-comments";
import { ShareShop, shoppableItems } from "@/components/share/share-shop";
import type { PublicRoom } from "@/components/share/types";
import { UploadRoomButton } from "@/components/upload-room-button";

/** A shared room is only as fresh as its owner's last change, so never cache. */
export const dynamic = "force-dynamic";

const SHARE_DESCRIPTION = "Before and after, made with comments";
const FALLBACK_TITLE = "A room";

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
    description: SHARE_DESCRIPTION,
    openGraph: {
      description: SHARE_DESCRIPTION,
      siteName: "Chic",
      title,
      type: "article",
    },
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

  return (
    <div className="pb-14">
      <section className="mx-auto w-full max-w-3xl px-4 pt-6 pb-5 sm:px-6">
        <p className="font-sans text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
          Shared on Chic
        </p>
        <h1 className="mt-1 font-serif text-3xl text-foreground leading-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
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
    </div>
  );
}
