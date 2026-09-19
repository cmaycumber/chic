import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import type { NextRequest } from "next/server";
import { renderRoomOgImage } from "@/lib/room-og";

/** The card belongs to one token and one room, so there is nothing to build. */
export const dynamic = "force-dynamic";

const NOT_FOUND = 404;

/**
 * Long enough that a crawler's retries and the two or three services an
 * invite gets pasted into share one render, short enough that a room changed
 * this morning stops showing last week's photo.
 */
const CACHE_CONTROL = "public, max-age=300";

/** The token is the whole credential here; without a match there is no card. */
async function loadPreview(roomId: string, token: string) {
  try {
    return await fetchQuery(api.rooms.getInvitePreview, {
      roomId: roomId as Id<"rooms">,
      token,
    });
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  const token = request.nextUrl.searchParams.get("invite");
  if (!token) {
    return new Response(null, { status: NOT_FOUND });
  }

  const { roomId } = await context.params;
  const preview = await loadPreview(roomId, token);
  if (!preview) {
    return new Response(null, { status: NOT_FOUND });
  }

  return await renderRoomOgImage({
    afterUrl: preview.afterUrl,
    beforeUrl: preview.beforeUrl,
    cacheControl: CACHE_CONTROL,
  });
}
