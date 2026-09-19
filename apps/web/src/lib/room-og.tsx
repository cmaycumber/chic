import { ImageResponse } from "next/og";
import { requestOrigin } from "./request-origin";

/** The card every link preview gets: two photos, side by side. */
export const OG_SIZE = { height: 630, width: 1200 } as const;

const HALF_WIDTH = 600;
const DIVIDER_WIDTH = 2;
const INK = "#161617";
const BRASS = "#b08d57";
const BONE = "#faf8f4";
const SOURCE_WIDTH = 1200;
const SOURCE_QUALITY = 75;

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
        height: OG_SIZE.height,
        justifyContent: "flex-start",
        position: "relative",
        width: HALF_WIDTH,
      }}
    >
      {imageUrl ? (
        // biome-ignore lint/performance/noImgElement: satori renders a raw <img>; next/image cannot run inside ImageResponse.
        <img
          alt=""
          height={OG_SIZE.height}
          src={imageUrl}
          style={{
            height: OG_SIZE.height,
            objectFit: "cover",
            width: HALF_WIDTH,
          }}
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

/**
 * The before-and-after card, for whoever needs one: the public share page's
 * static preview and the per-token preview an invite link unfurls into.
 */
export async function renderRoomOgImage({
  afterUrl,
  beforeUrl,
  cacheControl,
}: {
  afterUrl: string | null;
  beforeUrl: string | null;
  cacheControl?: string;
}): Promise<ImageResponse> {
  const origin = await requestOrigin();

  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        backgroundColor: INK,
        display: "flex",
        height: OG_SIZE.height,
        position: "relative",
        width: OG_SIZE.width,
      }}
    >
      <Panel imageUrl={decodable(origin, beforeUrl)} label="Before" />
      <div
        style={{
          backgroundColor: BRASS,
          display: "flex",
          height: OG_SIZE.height,
          width: DIVIDER_WIDTH,
        }}
      />
      <Panel imageUrl={decodable(origin, afterUrl)} label="After" />

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
    {
      ...OG_SIZE,
      headers: cacheControl ? { "Cache-Control": cacheControl } : undefined,
    }
  );
}
