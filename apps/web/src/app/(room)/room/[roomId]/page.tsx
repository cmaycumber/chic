import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { RoomScreen } from "@/components/room/room-screen";
import { siteOrigin } from "@/lib/request-origin";

/** Every invite token gets its own preview, so none of this is cacheable. */
export const dynamic = "force-dynamic";

const FALLBACK_TITLE = "A room";
const FALLBACK_INVITER = "Someone";
const OG_HEIGHT = 630;
const OG_WIDTH = 1200;

/**
 * What a room says to anyone holding no usable invite. The room itself is
 * private, and a link to it has no business in a search index.
 */
const PRIVATE_METADATA: Metadata = {
  robots: { index: false },
  title: "Room on Chic",
};

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function inviteToken(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Null for a revoked token, a room past its clock, or a backend that blinked. */
async function loadInvitePreview(roomId: string, token: string) {
  try {
    return await fetchQuery(api.rooms.getInvitePreview, {
      roomId: roomId as Id<"rooms">,
      token,
    });
  } catch {
    return null;
  }
}

/**
 * An invite is pasted into a message before it is ever clicked, and the thing
 * that gets it opened is the before-and-after card underneath it. Crawlers
 * arrive with no cookies, so the token in the link is what earns the preview.
 */
export async function generateMetadata({
  params,
  searchParams,
}: RoomPageProps): Promise<Metadata> {
  const [{ roomId }, query] = await Promise.all([params, searchParams]);
  const token = inviteToken(query.invite);
  if (!token) {
    return PRIVATE_METADATA;
  }

  const preview = await loadInvitePreview(roomId, token);
  if (!preview) {
    return PRIVATE_METADATA;
  }

  const title = `${preview.title ?? FALLBACK_TITLE} on Chic`;
  const description = `${preview.ownerName ?? FALLBACK_INVITER} invited you to edit this room. Comment to change anything.`;
  const origin = await siteOrigin();
  const image = `${origin}/og/room/${roomId}?invite=${encodeURIComponent(token)}`;

  return {
    description,
    openGraph: {
      description,
      images: [
        {
          alt: "Before and after",
          height: OG_HEIGHT,
          url: image,
          width: OG_WIDTH,
        },
      ],
      siteName: "Chic",
      title,
      type: "article",
    },
    title,
    twitter: {
      card: "summary_large_image",
      description,
      images: [image],
      title,
    },
  };
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;

  return <RoomScreen roomId={roomId as Id<"rooms">} />;
}
