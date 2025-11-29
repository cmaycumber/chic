import { Home, Lightbulb, Palette, Sofa, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { HeroDesignGrid } from "@/components/hero-design-grid";
import { HeroInputSection } from "@/components/hero-input-section";
import { Button } from "@/components/ui/button";

const useCases = [
  {
    icon: Palette,
    title: "AI Color & Style Recommendations",
    description:
      "Our AI interior designer analyzes your preferences to suggest perfect color palettes, design styles, and aesthetic choices for any room.",
  },
  {
    icon: Lightbulb,
    title: "Smart Space Planning",
    description:
      "AI-powered spatial intelligence optimizes furniture layouts and maximizes every inch of your space with professional interior design principles.",
  },
  {
    icon: Zap,
    title: "Intelligent Budget Guidance",
    description:
      "Get AI-generated budget estimates and smart material suggestions to plan your renovation with confidence.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden bg-ink">
        {/* Full-bleed design grid background */}
        <div className="absolute inset-0">
          <Suspense
            fallback={
              <div className="absolute inset-0 grid auto-rows-[180px] grid-cols-3 gap-3 p-4 lg:grid-cols-4 lg:gap-4">
                {Array.from({ length: 16 }, (_, i) => `hero-skeleton-${i}`).map(
                  (skeletonId) => (
                    <div
                      className="animate-pulse border border-white/10 bg-white/5"
                      key={skeletonId}
                    />
                  )
                )}
              </div>
            }
          >
            <HeroDesignGrid />
          </Suspense>

          {/* Dark overlay for text readability */}
          <div className="pointer-events-none absolute inset-0 bg-ink/70" />

          {/* Center spotlight - darker in center for text contrast */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(22,22,23,0.85)_0%,transparent_70%)]" />

          {/* Bottom fade */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-ink via-ink/90 to-transparent" />
        </div>

        {/* Content overlay - centered */}
        <div className="pointer-events-none relative z-20 flex min-h-screen items-center justify-center px-4 py-24 sm:px-6 md:px-8">
          <div className="text-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
                <Sparkles className="size-3.5 text-brass" />
                <span className="font-medium text-white/90 text-xs uppercase tracking-wider">
                  AI-Powered Design Studio
                </span>
              </div>

              <h1 className="font-light font-serif text-6xl text-white leading-[1.1] tracking-tight drop-shadow-lg sm:text-7xl lg:text-8xl">
                Design with
                <br />
                <span className="font-normal text-brass italic drop-shadow-lg">
                  intention
                </span>
              </h1>

              <p className="mx-auto max-w-xl font-light text-lg text-white/90 leading-relaxed drop-shadow-md sm:text-xl">
                An intelligent design companion that understands your vision and
                transforms spaces with sophistication.
              </p>
            </div>

            {/* CTA Input */}
            <div className="pointer-events-auto mt-10">
              <HeroInputSection />
            </div>
          </div>
        </div>

        {/* Subtle bottom border */}
        <div className="absolute inset-x-0 bottom-0 z-10 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
      </section>

      {/* Features Section */}
      <section className="bg-white py-32 md:py-40">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="divider-elegant mb-20 pb-6 text-center">
              <h2 className="font-light font-serif text-5xl text-ink tracking-tight sm:text-6xl">
                Curated Expertise
              </h2>
              <p className="mt-4 font-light text-ink/70 text-lg">
                Professional design intelligence, thoughtfully applied
              </p>
            </div>

            <div className="grid gap-16 md:grid-cols-3">
              {useCases.map((useCase) => {
                const Icon = useCase.icon;
                return (
                  <div className="group space-y-6" key={useCase.title}>
                    <div className="flex size-14 items-center justify-center rounded-full border border-greige bg-white transition-colors group-hover:border-brass group-hover:bg-bone">
                      <Icon className="size-6 text-ink transition-colors group-hover:text-brass" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-normal font-serif text-2xl text-ink">
                        {useCase.title}
                      </h3>
                      <p className="font-light text-ink/70 leading-relaxed">
                        {useCase.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="texture-paper bg-bone py-32 md:py-40">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="divider-elegant mb-20 pb-6 text-center">
              <h2 className="font-light font-serif text-5xl text-ink tracking-tight sm:text-6xl">
                The Process
              </h2>
              <p className="mt-4 font-light text-ink/70 text-lg">
                A thoughtful approach to space transformation
              </p>
            </div>

            <div className="grid gap-16 md:grid-cols-3">
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-brass bg-white">
                    <span className="font-serif text-brass text-xl">1</span>
                  </div>
                  <div className="h-px flex-1 bg-greige" />
                </div>
                <h3 className="font-normal font-serif text-2xl text-ink">
                  Articulate Vision
                </h3>
                <p className="font-light text-ink/70 leading-relaxed">
                  Share your aesthetic preferences, functional requirements, and
                  spatial aspirations through conversation or imagery.
                </p>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-brass bg-white">
                    <span className="font-serif text-brass text-xl">2</span>
                  </div>
                  <div className="h-px flex-1 bg-greige" />
                </div>
                <h3 className="font-normal font-serif text-2xl text-ink">
                  Receive Curation
                </h3>
                <p className="font-light text-ink/70 leading-relaxed">
                  Access personalized recommendations grounded in design
                  principles, tailored to your space and sensibility.
                </p>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-brass bg-white">
                    <span className="font-serif text-brass text-xl">3</span>
                  </div>
                  <div className="h-px flex-1 bg-greige" />
                </div>
                <h3 className="font-normal font-serif text-2xl text-ink">
                  Iterate & Realize
                </h3>
                <p className="font-light text-ink/70 leading-relaxed">
                  Refine through dialogue, preserve your selections, and access
                  curated resources for implementation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Rooms Section */}
      <section className="bg-white py-32 md:py-40">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="divider-elegant mb-20 pb-6 text-center">
              <h2 className="font-light font-serif text-5xl text-ink tracking-tight sm:text-6xl">
                Spaces We Transform
              </h2>
              <p className="mt-4 font-light text-ink/70 text-lg">
                Begin with your most essential rooms
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Link
                  className="group block space-y-6 border border-greige bg-white p-8 transition-all hover:border-brass hover:shadow-lg"
                  href="/ideas/living-room"
                >
                  <div className="flex size-14 items-center justify-center rounded-full border border-greige bg-bone transition-all group-hover:border-brass group-hover:bg-white">
                    <Sofa className="size-6 text-ink transition-colors group-hover:text-brass" />
                  </div>
                  <div>
                    <h3 className="mb-2 font-normal font-serif text-2xl text-ink">
                      Living Spaces
                    </h3>
                    <p className="font-light text-ink/70 text-sm leading-relaxed">
                      Cultivate gathering spaces that balance comfort with
                      sophistication
                    </p>
                  </div>
                  <div className="pt-2 font-light text-brass text-sm transition-all group-hover:translate-x-1">
                    Explore Collection →
                  </div>
                </Link>
              </div>

              <div>
                <Link
                  className="group block space-y-6 border border-greige bg-white p-8 transition-all hover:border-brass hover:shadow-lg"
                  href="/ideas/bedroom"
                >
                  <div className="flex size-14 items-center justify-center rounded-full border border-greige bg-bone transition-all group-hover:border-brass group-hover:bg-white">
                    <Home className="size-6 text-ink transition-colors group-hover:text-brass" />
                  </div>
                  <div>
                    <h3 className="mb-2 font-normal font-serif text-2xl text-ink">
                      Private Retreats
                    </h3>
                    <p className="font-light text-ink/70 text-sm leading-relaxed">
                      Design sanctuaries for rest, reflection, and renewal
                    </p>
                  </div>
                  <div className="pt-2 font-light text-brass text-sm transition-all group-hover:translate-x-1">
                    Explore Collection →
                  </div>
                </Link>
              </div>

              <div>
                <Link
                  className="group block space-y-6 border border-greige bg-white p-8 transition-all hover:border-brass hover:shadow-lg"
                  href="/ideas/kitchen"
                >
                  <div className="flex size-14 items-center justify-center rounded-full border border-greige bg-bone transition-all group-hover:border-brass group-hover:bg-white">
                    <Sparkles className="size-6 text-ink transition-colors group-hover:text-brass" />
                  </div>
                  <div>
                    <h3 className="mb-2 font-normal font-serif text-2xl text-ink">
                      Culinary Studios
                    </h3>
                    <p className="font-light text-ink/70 text-sm leading-relaxed">
                      Create functional beauty in the heart of your home
                    </p>
                  </div>
                  <div className="pt-2 font-light text-brass text-sm transition-all group-hover:translate-x-1">
                    Explore Collection →
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-ink py-40 text-white md:py-48">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-6 font-light font-serif text-5xl tracking-tight sm:text-6xl md:text-7xl">
              Begin Your
              <br />
              <span className="font-normal text-brass italic">
                Design Journey
              </span>
            </h2>
            <p className="mb-12 font-light text-lg text-white/70 leading-relaxed">
              Transform your vision into reality with intelligent design
              guidance,
              <br className="hidden sm:block" />
              thoughtfully tailored to your unique aesthetic.
            </p>
            <Link href="/signup">
              <Button
                className="rounded-full border-2 border-brass bg-brass px-8 font-normal text-white hover:bg-transparent hover:text-brass"
                size="lg"
              >
                Start Creating
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
