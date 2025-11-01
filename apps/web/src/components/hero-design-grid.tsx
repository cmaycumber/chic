import { api } from "@furnish/backend/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import Image from "next/image";
import Link from "next/link";

const HERO_DESIGNS_COUNT = 24;

// Grid layout configuration for bento-style display
// Designed to perfectly tile in a 6-column grid
const gridLayout = [
  { span: "col-span-2 row-span-2" }, // Large square
  { span: "col-span-2 row-span-1" }, // Wide rectangle
  { span: "col-span-2 row-span-1" }, // Wide rectangle
  { span: "col-span-1 row-span-1" }, // Small square
  { span: "col-span-1 row-span-1" }, // Small square
  { span: "col-span-2 row-span-2" }, // Large square
  { span: "col-span-2 row-span-1" }, // Wide rectangle
  { span: "col-span-2 row-span-1" }, // Wide rectangle
  { span: "col-span-1 row-span-2" }, // Tall rectangle
  { span: "col-span-1 row-span-2" }, // Tall rectangle
  { span: "col-span-2 row-span-1" }, // Wide rectangle
  { span: "col-span-2 row-span-1" }, // Wide rectangle
  { span: "col-span-1 row-span-1" }, // Small square
  { span: "col-span-1 row-span-1" }, // Small square
  { span: "col-span-2 row-span-2" }, // Large square
  { span: "col-span-2 row-span-1" }, // Wide rectangle
  { span: "col-span-2 row-span-1" }, // Wide rectangle
  { span: "col-span-1 row-span-1" }, // Small square
  { span: "col-span-1 row-span-1" }, // Small square
  { span: "col-span-1 row-span-2" }, // Tall rectangle
  { span: "col-span-1 row-span-2" }, // Tall rectangle
  { span: "col-span-2 row-span-1" }, // Wide rectangle
  { span: "col-span-2 row-span-1" }, // Wide rectangle
  { span: "col-span-2 row-span-2" }, // Large square
];

export async function HeroDesignGrid() {
  // Server-side fetch of hero designs
  const heroDesigns = await fetchQuery(api.ideas.getHeroDesigns, {
    limit: HERO_DESIGNS_COUNT,
  });

  if (!heroDesigns || heroDesigns.length === 0) {
    return (
      <div className="absolute inset-0 z-0 grid auto-rows-[120px] grid-cols-4 gap-2 sm:auto-rows-[140px] sm:gap-3 md:auto-rows-[160px] md:grid-cols-6 md:gap-3">
        {Array.from({ length: HERO_DESIGNS_COUNT }, (_, i) => i).map(
          (skeletonId) => {
            const layout = gridLayout[skeletonId % gridLayout.length];
            return (
              <div
                className={`animate-pulse rounded-xl bg-neutral-200 ${layout.span}`}
                key={`skeleton-${skeletonId}`}
              />
            );
          }
        )}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0 grid auto-rows-[120px] grid-cols-4 gap-2 sm:auto-rows-[140px] sm:gap-3 md:auto-rows-[160px] md:grid-cols-6 md:gap-3">
      {heroDesigns.map((design, index) => {
        const layout = gridLayout[index % gridLayout.length];
        return (
          <Link
            className={`group relative overflow-hidden rounded-xl shadow-md transition-transform hover:scale-[1.02] ${layout.span}`}
            href={`/design/${design._id}`}
            key={design._id}
          >
            {design.imageUrl && (
              <>
                <Image
                  alt={design.title}
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  src={design.imageUrl}
                />
                {/* Dark overlay - visible by default, hidden on hover */}
                <div className="absolute inset-0 bg-black/70 transition-opacity group-hover:opacity-0" />
                {/* Info overlay - hidden by default, visible on hover */}
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 translate-y-full bg-linear-to-t from-black/80 to-transparent p-3 transition-transform group-hover:translate-y-0">
                  <p className="line-clamp-1 font-medium text-sm text-white">
                    {design.title}
                  </p>
                  {design.roomType && (
                    <p className="text-white/80 text-xs capitalize">
                      {design.roomType.replace("-", " ")}
                    </p>
                  )}
                </div>
              </>
            )}
          </Link>
        );
      })}
    </div>
  );
}
