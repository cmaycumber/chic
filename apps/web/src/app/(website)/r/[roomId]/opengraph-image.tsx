import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import { OG_SIZE, renderRoomOgImage } from "@/lib/room-og";

export const alt = "Before and after, made with comments";
export const contentType = "image/png";
export const size = OG_SIZE;

interface SharedImages {
  afterUrl: string | null;
  beforeUrl: string | null;
}

async function loadImages(roomId: string): Promise<SharedImages> {
  try {
    const room = await fetchQuery(api.rooms.getPublic, {
      roomId: roomId as Id<"rooms">,
    });
    if (!room) {
      return { afterUrl: null, beforeUrl: null };
    }
    return {
      afterUrl: room.versions.at(-1)?.imageUrl ?? null,
      beforeUrl: room.versions.at(0)?.imageUrl ?? null,
    };
  } catch {
    return { afterUrl: null, beforeUrl: null };
  }
}

export default async function SharedRoomOpengraphImage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return await renderRoomOgImage(await loadImages(roomId));
}
