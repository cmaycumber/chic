import { Lightbulb, Palette, Zap } from "lucide-react";
import Link from "next/link";
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
      <section className="relative min-h-[140vh] overflow-hidden bg-[#3d3226] px-4 pt-24 pb-32 sm:min-h-[130vh] sm:px-6 sm:pt-32 md:min-h-[120vh] lg:px-8">
        <div className="relative mx-auto max-w-[1800px]">
          {/* Background Grid - Behind Content */}
          <HeroDesignGrid />

          {/* Content Overlay - In Front */}
          <HeroInputSection />
        </div>

        {/* Bottom Fade Gradient - Fades designs into next section */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-64 bg-linear-to-t from-white via-[#3d3226]/10 to-transparent" />
      </section>

      {/* Features Section */}
      <section className="bg-white py-24 md:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 font-bold text-3xl tracking-tight sm:text-4xl md:text-5xl">
                Your Complete AI Interior Designer
              </h2>
              <p className="text-lg text-neutral-600">
                Professional interior design expertise powered by artificial
                intelligence
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {useCases.map((useCase) => {
                const Icon = useCase.icon;
                return (
                  <div
                    className="space-y-4 rounded-2xl bg-neutral-50 p-6"
                    key={useCase.title}
                  >
                    <div className="flex size-12 items-center justify-center rounded-xl bg-amber-600/10">
                      <Icon className="size-6 text-amber-700" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{useCase.title}</h3>
                      <p className="text-neutral-600 leading-relaxed">
                        {useCase.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-20 text-center">
              <div className="space-y-6">
                <h3 className="font-bold text-3xl tracking-tight">
                  Ready to Transform Your Space?
                </h3>
                <p className="text-lg text-neutral-600">
                  Start chatting with your AI interior designer today
                </p>
                <div className="flex justify-center">
                  <Link href="/signup">
                    <Button
                      className="bg-amber-700 hover:bg-amber-800"
                      size="lg"
                    >
                      Start with AI Designer
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
