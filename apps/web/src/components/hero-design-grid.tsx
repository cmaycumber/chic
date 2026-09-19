import { api } from "@furnish/backend/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import Image from "next/image";
import Link from "next/link";

const HERO_DESIGNS_COUNT = 24;

const FALLBACK_GRID_IMAGES = [
  "/images/ai-room-designer-hero.png",
  "/images/ai-room-designer-bedroom.png",
  "/images/ai-room-designer-styles.png",
  "/images/interior-design-ai-basics.png",
];

const FALLBACK_TILE_REPEATS = Math.ceil(
  HERO_DESIGNS_COUNT / FALLBACK_GRID_IMAGES.length
);

const FALLBACK_TILES = FALLBACK_GRID_IMAGES.flatMap((src) =>
  Array.from({ length: FALLBACK_TILE_REPEATS }, (_, repeatIndex) => ({
    id: `${src}-${repeatIndex}`,
    src,
  }))
).slice(0, HERO_DESIGNS_COUNT);

function FallbackDesignGrid() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 grid auto-rows-[180px] grid-cols-3 gap-2 p-2 lg:auto-rows-[200px] lg:grid-cols-4 lg:gap-3 lg:p-3 xl:grid-cols-5"
    >
      {FALLBACK_TILES.map((tile) => (
        <div className="group relative overflow-hidden" key={tile.id}>
          <Image
            alt=""
            className="object-cover transition-all duration-300 group-hover:brightness-100"
            fill
            sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            src={tile.src}
          />
          <div className="absolute inset-0 bg-black/60 transition-opacity duration-300 group-hover:opacity-20" />
        </div>
      ))}
    </div>
  );
}

export async function HeroDesignGrid() {
  // Server-side fetch of hero designs
  const heroDesigns = await fetchQuery(api.ideas.getHeroDesigns, {
    limit: HERO_DESIGNS_COUNT,
  });

  if (!heroDesigns || heroDesigns.length === 0) {
    return <FallbackDesignGrid />;
  }

  return (
    <div className="absolute inset-0 z-10 grid auto-rows-[180px] grid-cols-3 gap-2 p-2 lg:auto-rows-[200px] lg:grid-cols-4 lg:gap-3 lg:p-3 xl:grid-cols-5">
      {heroDesigns.map((design) => (
        <Link
          className="group relative overflow-hidden transition-all duration-300 hover:z-20 hover:shadow-2xl hover:shadow-black/50"
          href={`/design/${design._id}`}
          key={design._id}
        >
          {design.imageUrl ? (
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
                {design.roomType ? (
                  <p className="mt-1 font-light text-white/80 text-xs uppercase tracking-widest">
                    {design.roomType.replace("-", " ")}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
        </Link>
      ))}
    </div>
  );
}
