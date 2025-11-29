import { api } from "@furnish/backend/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import Image from "next/image";
import Link from "next/link";

const HERO_DESIGNS_COUNT = 24;

export async function HeroDesignGrid() {
  // Server-side fetch of hero designs
  const heroDesigns = await fetchQuery(api.ideas.getHeroDesigns, {
    limit: HERO_DESIGNS_COUNT,
  });

  if (!heroDesigns || heroDesigns.length === 0) {
    return (
      <div className="absolute inset-0 grid auto-rows-[180px] grid-cols-3 gap-2 p-2 lg:auto-rows-[200px] lg:grid-cols-4 lg:gap-3 lg:p-3 xl:grid-cols-5">
        {Array.from({ length: HERO_DESIGNS_COUNT }, (_, i) => i).map(
          (skeletonId) => (
            <div
              className="animate-pulse bg-white/5"
              key={`skeleton-${skeletonId}`}
            />
          )
        )}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 grid auto-rows-[180px] grid-cols-3 gap-2 p-2 lg:auto-rows-[200px] lg:grid-cols-4 lg:gap-3 lg:p-3 xl:grid-cols-5">
      {heroDesigns.map((design) => (
        <Link
          className="group relative overflow-hidden transition-all duration-300 hover:z-20 hover:shadow-2xl hover:shadow-black/50"
          href={`/design/${design._id}`}
          key={design._id}
        >
          {design.imageUrl && (
            <>
              <Image
                alt={design.title}
                className="object-cover transition-all duration-300 group-hover:brightness-100"
                fill
                sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                src={design.imageUrl}
              />
              <div className="absolute inset-0 bg-black/60 transition-opacity duration-300 group-hover:opacity-20" />
              {/* Dark overlay */}
              {/* Hover info panel */}
              <div className="absolute inset-x-0 bottom-0 translate-y-full bg-linear-to-t from-ink/95 via-ink/80 to-transparent p-3 transition-all duration-300 group-hover:translate-y-0">
                <p className="line-clamp-2 font-serif text-sm text-white leading-snug">
                  {design.title}
                </p>
                {design.roomType && (
                  <p className="mt-1 font-light text-white/80 text-xs uppercase tracking-widest">
                    {design.roomType.replace("-", " ")}
                  </p>
                )}
              </div>
            </>
          )}
        </Link>
      ))}
    </div>
  );
}
