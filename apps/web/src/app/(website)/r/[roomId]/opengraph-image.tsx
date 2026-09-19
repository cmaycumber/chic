import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import { headers } from "next/headers";
import { ImageResponse } from "next/og";

export const alt = "Before and after, made with comments";
export const contentType = "image/png";
export const size = { height: 630, width: 1200 };

const HALF_WIDTH = 600;
const DIVIDER_WIDTH = 2;
const INK = "#161617";
const BRASS = "#b08d57";
const BONE = "#faf8f4";
const SOURCE_WIDTH = 1200;
const SOURCE_QUALITY = 75;

interface SharedImages {
  afterUrl: string | null;
  beforeUrl: string | null;
}

/** Where this request reached us, so the route can call our own optimizer. */
async function requestOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol =
    headerList.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

/**
 * Rendered versions are stored as WebP and the image renderer only decodes
 * PNG and JPEG, so every photo goes through the optimizer on its way in.
 */
function decodable(origin: string, url: string | null): string | null {
  if (!url) {
    return null;
  }
  const source = encodeURIComponent(url);
  return `${origin}/_next/image?url=${source}&w=${SOURCE_WIDTH}&q=${SOURCE_QUALITY}`;
}

async function loadImages(roomId: string): Promise<SharedImages> {
  try {
    const [room, origin] = await Promise.all([
      fetchQuery(api.rooms.getPublic, { roomId: roomId as Id<"rooms"> }),
      requestOrigin(),
    ]);
    if (!room) {
      return { afterUrl: null, beforeUrl: null };
    }
    return {
      afterUrl: decodable(origin, room.versions.at(-1)?.imageUrl ?? null),
      beforeUrl: decodable(origin, room.versions.at(0)?.imageUrl ?? null),
    };
  } catch {
    return { afterUrl: null, beforeUrl: null };
  }
}

function Panel({
  imageUrl,
  label,
}: {
  imageUrl: string | null;
  label: string;
}) {
  return (
    <div
      style={{
        alignItems: "flex-end",
        backgroundColor: INK,
        display: "flex",
        height: size.height,
        justifyContent: "flex-start",
        position: "relative",
        width: HALF_WIDTH,
      }}
    >
      {imageUrl ? (
        // biome-ignore lint/performance/noImgElement: satori renders a raw <img>; next/image cannot run inside ImageResponse.
        <img
          alt=""
          height={size.height}
          src={imageUrl}
          style={{ height: size.height, objectFit: "cover", width: HALF_WIDTH }}
          width={HALF_WIDTH}
        />
      ) : null}
      <div
        style={{
          backgroundColor: "rgba(0,0,0,0.55)",
          borderRadius: 999,
          color: BONE,
          display: "flex",
          fontSize: 22,
          left: 36,
          letterSpacing: 4,
          padding: "8px 20px",
          position: "absolute",
          textTransform: "uppercase",
          top: 36,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default async function SharedRoomOpengraphImage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const { afterUrl, beforeUrl } = await loadImages(roomId);

  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        backgroundColor: INK,
        display: "flex",
        height: size.height,
        position: "relative",
        width: size.width,
      }}
    >
      <Panel imageUrl={beforeUrl} label="Before" />
      <div
        style={{
          backgroundColor: BRASS,
          display: "flex",
          height: size.height,
          width: DIVIDER_WIDTH,
        }}
      />
      <Panel imageUrl={afterUrl} label="After" />

      <div
        style={{
          alignItems: "center",
          backgroundColor: INK,
          borderRadius: 999,
          bottom: 40,
          color: BONE,
          display: "flex",
          fontSize: 30,
          left: "50%",
          letterSpacing: 6,
          padding: "10px 28px",
          position: "absolute",
          transform: "translateX(-50%)",
        }}
      >
        chic
      </div>
    </div>,
    { ...size }
  );
}
