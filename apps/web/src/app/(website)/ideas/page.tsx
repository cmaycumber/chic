import { api } from "@furnish/backend/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import { ExploreIdeasGallery } from "@/components/explore-ideas-gallery";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title:
    "Interior Design Ideas: 500+ Inspiring Room Designs | Chic AI Designer",
  description:
    "Explore thousands of interior design ideas across all room types. Browse living rooms, bedrooms, kitchens, and more. Filter by style, room type, and budget. Get inspired and design your dream space with our free AI tool.",
  keywords: [
    "interior design ideas",
    "room design ideas",
    "home design inspiration",
    "interior design inspiration",
    "room ideas",
    "design ideas",
    "modern interior design",
    "home decor ideas",
    "interior decorating ideas",
  ],
  openGraph: {
    title: "Interior Design Ideas - Explore 500+ Inspiring Room Designs",
    description:
      "Discover interior design ideas for every room in your home. Browse, filter, and get inspired by thousands of curated designs from modern to traditional styles.",
    type: "website",
  },
};

const ROOM_TYPES = [
  { value: "living-room", label: "Living Room" },
  { value: "bedroom", label: "Bedroom" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "dining-room", label: "Dining Room" },
  { value: "home-office", label: "Home Office" },
  { value: "family-room", label: "Family Room" },
  { value: "nursery", label: "Nursery" },
  { value: "outdoor", label: "Outdoor Space" },
] as const;

export default async function IdeasExplorePage() {
  // Fetch trending designs for SSR
  const trendingDesigns = await fetchQuery(api.ideas.getTrendingDesigns, {
    limit: 12,
  });

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="mb-4 font-bold text-5xl tracking-tight md:text-6xl">
            Interior Design Ideas
          </h1>
          <p className="mx-auto mb-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Explore thousands of professionally curated interior design ideas.
            Browse by room type, style, and budget to find inspiration for your
            next project.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-muted-foreground text-sm">
            <span>✓ 500+ Curated Designs</span>
            <span>•</span>
            <span>✓ All Room Types</span>
            <span>•</span>
            <span>✓ Real Products & Budgets</span>
            <span>•</span>
            <span>✓ Free AI Design Tool</span>
          </div>
        </div>
      </section>

      {/* Room Type Navigation */}
      <section className="container mx-auto mb-12 px-4">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-6 font-bold text-2xl">Browse by Room Type</h2>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {ROOM_TYPES.map((room) => (
              <Link href={`/ideas/${room.value}`} key={room.value}>
                <Button
                  className="h-auto w-full flex-col py-4"
                  variant="outline"
                >
                  <span className="font-semibold">{room.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Main Gallery with Filters */}
      <ExploreIdeasGallery initialTrending={trendingDesigns} />

      {/* SEO Content Section */}
      <section className="container mx-auto px-4 py-12">
        <article className="prose prose-lg dark:prose-invert mx-auto max-w-7xl">
          <h2>Discover Interior Design Ideas for Every Room</h2>
          <p>
            Whether you're redesigning a single room or your entire home, our
            curated collection of interior design ideas offers inspiration for
            every space and style. From modern minimalist living rooms to cozy
            traditional bedrooms, find thousands of professionally designed
            spaces complete with product recommendations and budget estimates.
          </p>

          <h3>Browse by Popular Room Types</h3>
          <p>
            Our design gallery is organized by room type, making it easy to find
            exactly what you're looking for:
          </p>
          <ul>
            <li>
              <strong>Living Room Ideas</strong> - Create the perfect gathering
              space with comfortable seating and stylish decor
            </li>
            <li>
              <strong>Bedroom Ideas</strong> - Design a serene retreat with
              calming colors and functional layouts
            </li>
            <li>
              <strong>Kitchen Ideas</strong> - Explore modern, farmhouse, and
              traditional kitchen designs
            </li>
            <li>
              <strong>Family Room Ideas</strong> - Discover durable,
              family-friendly spaces that everyone will love
            </li>
            <li>
              <strong>Home Office Ideas</strong> - Create a productive workspace
              with ergonomic furniture and inspiring design
            </li>
          </ul>

          <h3>Filter by Style and Budget</h3>
          <p>Use our advanced filtering system to narrow down designs by:</p>
          <ul>
            <li>
              <strong>Design Style</strong> - Modern, Scandinavian, Bohemian,
              Industrial, Coastal, and more
            </li>
            <li>
              <strong>Room Type</strong> - All major rooms plus specialized
              spaces like nurseries and outdoor areas
            </li>
            <li>
              <strong>Tags</strong> - Cozy, small-space, budget-friendly,
              neutral colors, and dozens more
            </li>
            <li>
              <strong>Budget</strong> - Find designs that fit your budget from
              $1,000 to $15,000+
            </li>
          </ul>

          <h3>Real Products and Shopping Lists</h3>
          <p>
            Every design in our gallery includes detailed product information
            with direct shopping links. Get exact furniture pieces, decor items,
            and materials needed to recreate the look in your own home. No more
            guessing or searching—we've done the work for you.
          </p>

          <h3>AI-Powered Personalization</h3>
          <p>
            Found a design you love but want to customize it? Use our free AI
            interior designer to generate personalized variations based on your
            specific room dimensions, color preferences, and budget constraints.
            Our AI can adapt any design to fit your unique needs.
          </p>

          <h3>Stay Inspired</h3>
          <p>
            New designs are added daily from our community of designers and AI
            design tool users. Follow your favorite styles, save designs to your
            personal collection, and get notified when new ideas match your
            preferences.
          </p>
        </article>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-7xl rounded-2xl border-2 border-primary/20 bg-linear-to-br from-primary/5 to-primary/10 p-8 text-center md:p-12">
          <h2 className="mb-4 font-bold text-3xl md:text-4xl">
            Design Your Dream Space with AI
          </h2>
          <p className="mb-6 text-lg text-muted-foreground">
            Love what you see? Use our free AI-powered interior designer to
            create custom designs tailored to your style, space, and budget.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/design-tools/ai-room-designer">
                Try AI Room Designer
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/chat">Chat with AI Designer</Link>
            </Button>
          </div>
          <p className="mt-4 text-muted-foreground text-sm">
            ✓ 100% Free &nbsp;•&nbsp; ✓ Instant Results &nbsp;•&nbsp; ✓
            Personalized for Your Space
          </p>
        </div>
      </section>
    </div>
  );
}
