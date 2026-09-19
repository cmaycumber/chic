import { Check } from "lucide-react";
import { HeroDesignGrid } from "@/components/hero-design-grid";
import { PricingCTA } from "@/components/pricing-cta";

const FEATURES = [
  "High-quality AI renders",
  "Access to all design styles",
  "Commercial usage rights",
  "Priority support",
  "Secure payments",
];

export default function PricingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#3d3226] px-4 pt-24 pb-32 sm:px-6 sm:pt-32 lg:px-8">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <HeroDesignGrid />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <h1 className="mb-6 font-bold text-4xl text-white tracking-tight sm:text-5xl md:text-6xl">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-neutral-200">
            Purchase credits as you go. One credit equals one AI-generated
            design.
          </p>
        </div>

        {/* Bottom Fade Gradient */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-linear-to-t from-white via-[#3d3226]/10 to-transparent" />
      </section>

      {/* Pricing Section */}
      <section className="relative z-20 -mt-20 bg-white py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-lg rounded-2xl border bg-white p-8 shadow-xl">
            <div className="mb-8 text-center">
              <h2 className="mb-2 font-bold text-2xl">Purchase Credits</h2>
              <p className="text-muted-foreground">
                Start designing immediately with our credit packs
              </p>
            </div>

            <div className="mb-8 flex items-baseline justify-center gap-1">
              <span className="font-bold text-5xl">$0.10</span>
              <span className="text-muted-foreground">/ credit</span>
            </div>

            <ul className="mb-8 space-y-4">
              {FEATURES.map((feature) => (
                <li className="flex items-center gap-3" key={feature}>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success-muted">
                    <Check className="h-4 w-4 text-success" />
                  </div>
                  <span className="text-neutral-600">{feature}</span>
                </li>
              ))}
            </ul>

            <PricingCTA />
          </div>

          <div className="mt-24 text-center">
            <h2 className="mb-4 font-bold text-2xl">Questions?</h2>
            <p className="mx-auto max-w-2xl text-neutral-600">
              Need a custom enterprise plan or have questions about our credits?
              Contact our support team and we'll help you find the right
              solution.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
