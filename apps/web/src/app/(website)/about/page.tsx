import { Sparkles, Target, Users, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="border-b bg-muted/30 py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-bold text-4xl tracking-tight md:text-5xl">
              About Chic - Your AI Interior Designer
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              We're democratizing professional interior design through
              artificial intelligence. Get expert design guidance, instant room
              visualizations, and personalized recommendations—all for free.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-4xl space-y-16">
            <div className="grid gap-12 md:grid-cols-3">
              <Card className="p-8 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <Target className="size-8 text-primary" />
                </div>
                <h3 className="mt-6 font-semibold text-xl">Our Mission</h3>
                <p className="mt-4 text-muted-foreground">
                  Make professional interior design accessible to everyone
                  through our AI interior designer. Whether you're a first-time
                  decorator or experienced designer, our AI provides expert
                  guidance at no cost.
                </p>
              </Card>

              <Card className="p-8 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="size-8 text-primary" />
                </div>
                <h3 className="mt-6 font-semibold text-xl">
                  Our AI Technology
                </h3>
                <p className="mt-4 text-muted-foreground">
                  Our AI interior designer uses advanced machine learning models
                  trained on thousands of professional designs. Get instant room
                  layouts, color recommendations, and style suggestions tailored
                  to your unique space.
                </p>
              </Card>

              <Card className="p-8 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <Users className="size-8 text-primary" />
                </div>
                <h3 className="mt-6 font-semibold text-xl">Our Community</h3>
                <p className="mt-4 text-muted-foreground">
                  Thousands of homeowners, renters, and design enthusiasts
                  creating beautiful spaces together.
                </p>
              </Card>
            </div>

            <div className="space-y-6">
              <h2 className="font-bold text-3xl">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Chic was born from a simple observation: professional interior
                  designers charge thousands of dollars, putting expert design
                  guidance out of reach for most people. Yet everyone deserves a
                  beautiful, functional space.
                </p>
                <p>
                  We built Chic as your personal AI interior designer. By
                  combining cutting-edge artificial intelligence with proven
                  design principles, we deliver professional-quality interior
                  design guidance—completely free. Our AI analyzes your space,
                  understands your style, and provides instant, personalized
                  recommendations.
                </p>
                <p>
                  Whether you're redecorating a single room or planning a
                  complete home renovation, our AI interior designer helps you
                  make confident decisions about colors, furniture, layouts, and
                  budgets. Chat with your AI designer anytime, upload room
                  photos, and watch your vision come to life.
                </p>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-12 text-center">
              <h3 className="font-bold text-2xl">
                Ready to transform your space?
              </h3>
              <p className="mt-4 text-muted-foreground">
                Join our community and start your design journey today.
              </p>
              <div className="mt-8">
                <Link href="/signup">
                  <Button size="lg">Get Started Free</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="container mx-auto px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-6 text-primary" />
                <span className="font-semibold text-lg">chic</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Your free AI interior designer
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Company</h4>
              <div className="flex flex-col gap-2 text-muted-foreground text-sm">
                <Link className="hover:text-foreground" href="/about">
                  About Us
                </Link>
                <Link className="hover:text-foreground" href="/blog">
                  Blog
                </Link>
                <Link className="hover:text-foreground" href="/login">
                  Sign In
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <div className="flex flex-col gap-2 text-muted-foreground text-sm">
                <Link className="hover:text-foreground" href="/privacy">
                  Privacy Policy
                </Link>
                <Link className="hover:text-foreground" href="/terms">
                  Terms of Service
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Connect</h4>
              <p className="text-muted-foreground text-sm">
                © 2025 chic. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
