import { api } from "@furnish/backend/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoomDesignerCta } from "@/components/room-designer-cta";
import { RoomIdeasGallery } from "@/components/room-ideas-gallery";
import { RoomIdeasHero } from "@/components/room-ideas-hero";

type Params = Promise<{
  roomType: string;
}>;

const VALID_ROOM_TYPES = [
  "living-room",
  "bedroom",
  "kitchen",
  "bathroom",
  "dining-room",
  "home-office",
  "family-room",
  "nursery",
  "outdoor",
] as const;

const ROOM_LABELS: Record<string, string> = {
  "living-room": "Living Room",
  bedroom: "Bedroom",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  "dining-room": "Dining Room",
  "home-office": "Home Office",
  "family-room": "Family Room",
  nursery: "Nursery",
  outdoor: "Outdoor Space",
};

const ROOM_DESCRIPTIONS: Record<string, string> = {
  "living-room":
    "Discover inspiring living room designs from modern to traditional. Browse hundreds of curated living room ideas with real furniture and decor recommendations.",
  bedroom:
    "Transform your bedroom into a serene retreat. Explore cozy, modern, and luxurious bedroom designs with complete furniture shopping lists.",
  kitchen:
    "Get inspired by stunning kitchen designs. From farmhouse to modern, find your perfect kitchen style with practical layout ideas and product recommendations.",
  bathroom:
    "Create your dream bathroom with our curated design gallery. Browse spa-like, modern, and traditional bathroom ideas with shopping guides.",
  "dining-room":
    "Elevate your dining space with elegant design ideas. Explore formal and casual dining room styles with complete furniture and lighting recommendations.",
  "home-office":
    "Design a productive workspace you'll love. Browse modern, minimalist, and cozy home office ideas with ergonomic furniture suggestions.",
  "family-room":
    "Create the perfect family gathering space. Discover comfortable, durable, and stylish family room designs that work for everyone.",
  nursery:
    "Design a beautiful and functional nursery for your little one. Explore gender-neutral, modern, and classic nursery ideas with safety in mind.",
  outdoor:
    "Transform your outdoor living space into an oasis. Browse patio, deck, and garden designs with furniture and decor ideas for every budget.",
};

export function generateStaticParams() {
  return VALID_ROOM_TYPES.map((roomType) => ({
    roomType,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { roomType } = await params;

  if (
    !VALID_ROOM_TYPES.includes(roomType as (typeof VALID_ROOM_TYPES)[number])
  ) {
    return {
      title: "Room Not Found",
    };
  }

  const roomLabel = ROOM_LABELS[roomType];
  const description = ROOM_DESCRIPTIONS[roomType];

  return {
    title: `${roomLabel} Ideas: 50+ Inspiring Designs | Chic AI Interior Designer`,
    description,
    keywords: [
      `${roomType} ideas`,
      `${roomType} design`,
      `${roomType} decor ideas`,
      `modern ${roomType} ideas`,
      `small ${roomType} ideas`,
      `${roomLabel.toLowerCase()} inspiration`,
      "interior design ideas",
      "room design",
    ],
    openGraph: {
      title: `${roomLabel} Ideas - Inspiring Interior Designs`,
      description,
      type: "website",
    },
  };
}

export default async function RoomIdeasPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const { roomType } = resolvedParams;

  if (
    !VALID_ROOM_TYPES.includes(roomType as (typeof VALID_ROOM_TYPES)[number])
  ) {
    notFound();
  }

  const roomLabel = ROOM_LABELS[roomType];

  // Preload featured designs for SSR
  const preloadedFeatured = await preloadQuery(
    api.ideas.getFeaturedRoomDesigns,
    {
      roomType: roomType as (typeof VALID_ROOM_TYPES)[number],
      limit: 6,
    }
  );

  // Preload filter options
  const preloadedFilters = await preloadQuery(api.ideas.getRoomFilterOptions, {
    roomType: roomType as (typeof VALID_ROOM_TYPES)[number],
  });

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      {/* Hero Section */}
      <RoomIdeasHero
        description={ROOM_DESCRIPTIONS[roomType]}
        roomLabel={roomLabel}
      />

      {/* Main Gallery with Filters */}
      <RoomIdeasGallery
        preloadedFeatured={preloadedFeatured}
        preloadedFilters={preloadedFilters}
        roomLabel={roomLabel}
        roomType={roomType as (typeof VALID_ROOM_TYPES)[number]}
      />

      {/* SEO Content Section */}
      <section className="container mx-auto px-4 py-12">
        <article className="prose prose-lg dark:prose-invert mx-auto max-w-4xl">
          <h2>About {roomLabel} Design Ideas</h2>
          <p>{ROOM_DESCRIPTIONS[roomType]}</p>

          <h3>Popular {roomLabel} Styles</h3>
          <p>
            Whether you're drawn to modern minimalism, cozy traditional, or
            eclectic bohemian style, our curated {roomLabel.toLowerCase()}{" "}
            designs showcase the best of every aesthetic. Each design includes
            detailed product recommendations and styling tips to help you
            recreate the look in your own home.
          </p>

          <h3>How to Use These {roomLabel} Ideas</h3>
          <p>
            Browse our gallery to find designs that inspire you. Each{" "}
            {roomLabel.toLowerCase()} idea includes:
          </p>
          <ul>
            <li>High-quality design visualizations</li>
            <li>Complete product lists with pricing</li>
            <li>Style and color palette details</li>
            <li>Budget breakdowns</li>
            <li>Shopping links to purchase items</li>
          </ul>

          <h3>Create Your Own {roomLabel} Design</h3>
          <p>
            Love what you see but want to customize it for your space? Use our
            free AI room designer tool to generate personalized{" "}
            {roomLabel.toLowerCase()} designs tailored to your style, budget,
            and room dimensions. Simply describe your vision, and our AI will
            create professional design concepts in seconds.
          </p>
        </article>
      </section>

      {/* AI Tool CTA */}
      <RoomDesignerCta roomType={roomType} />
    </div>
  );
}
