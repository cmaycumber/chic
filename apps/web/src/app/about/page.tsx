import { Sparkles, Target, Users, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <Link className="flex items-center gap-2" href="/">
            <Sparkles className="size-6 text-primary" />
            <span className="font-semibold text-lg">furnish</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button size="sm" variant="ghost">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Sign up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b bg-muted/30 py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-bold text-4xl tracking-tight md:text-5xl">
              About furnish
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              We're making professional interior design accessible to everyone
              through the power of AI.
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
                  Democratize interior design by providing AI-powered expert
                  guidance to everyone, regardless of budget or experience.
                </p>
              </Card>

              <Card className="p-8 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="size-8 text-primary" />
                </div>
                <h3 className="mt-6 font-semibold text-xl">Our Technology</h3>
                <p className="mt-4 text-muted-foreground">
                  Cutting-edge AI models trained on professional design
                  principles to deliver personalized recommendations.
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
                  furnish was born from a simple observation: professional
                  interior design services are expensive and often out of reach
                  for most people. Yet everyone deserves to live in a space that
                  feels like home.
                </p>
                <p>
                  We built furnish to bridge that gap. By combining advanced AI
                  with proven design principles, we've created a tool that
                  provides professional-quality guidance at a fraction of the
                  cost.
                </p>
                <p>
                  Whether you're redecorating a single room or planning a
                  complete home renovation, furnish is here to help you make
                  confident decisions about colors, furniture, layouts, and
                  budgets.
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
                <span className="font-semibold text-lg">furnish</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Your AI interior design assistant
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
                © 2025 furnish. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
