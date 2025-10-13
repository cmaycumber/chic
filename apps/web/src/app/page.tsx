"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import {
  ArrowUp,
  Lightbulb,
  LogIn,
  Palette,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  PromptInput,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from "@/components/ai-elements/prompt-input";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";

const useCases = [
  {
    icon: Palette,
    title: "Color & Style",
    description:
      "Get expert recommendations on color palettes, design styles, and aesthetic choices for any room.",
  },
  {
    icon: Lightbulb,
    title: "Space Planning",
    description:
      "Optimize furniture layout and maximize your space with AI-powered spatial intelligence.",
  },
  {
    icon: Zap,
    title: "Budget Guidance",
    description:
      "Plan your renovation budget with accurate cost estimates and smart material suggestions.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [input, setInput] = useState("");
  // Use mutation for optimistic updates and transactional guarantees
  const createThread = useMutation(api.threads.createNewThread);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthenticated = !!session;

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      if (!message.text?.trim() || isSubmitting) {
        return;
      }

      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      setIsSubmitting(true);
      try {
        const threadId = await createThread({
          initialMessage: {
            role: "user",
            content: message.text,
          },
        });
        router.push(`/chat/${threadId}`);
      } catch {
        // Error handled silently - could add toast notification
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, createThread, router, isAuthenticated]
  );

  // Show loading state to prevent layout shift
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {!isAuthenticated && <PublicHeader />}

      {/* Hero Section - 100vh */}
      <section className="relative flex min-h-screen justify-center px-6 pt-16">
        <div className="container mx-auto mt-24">
          <div className="mx-auto max-w-4xl space-y-8 text-center">
            <div className="space-y-4">
              <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="size-10 text-primary" />
              </div>
              <h1 className="font-bold text-5xl tracking-tight">
                Transform Your Space
                <br />
                <span className="text-primary">with AI</span>
              </h1>
              <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
                Your personal AI interior design consultant. Get expert advice
                on colors, furniture, layouts, and budgets in seconds.
              </p>
            </div>

            <div className="mx-auto max-w-2xl">
              <PromptInput onSubmit={handleSubmit}>
                <PromptInputBody>
                  <PromptInputTextarea
                    className="min-h-[120px]"
                    disabled={isSubmitting}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe your space or design challenge..."
                    value={input}
                  />
                </PromptInputBody>
                <PromptInputToolbar>
                  <div className="flex-1" />
                  <PromptInputSubmit disabled={!input.trim() || isSubmitting}>
                    <ArrowUp className="size-5" />
                  </PromptInputSubmit>
                </PromptInputToolbar>
              </PromptInput>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        {/* <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 animate-bounce flex-col items-center gap-2">
          <span className="text-muted-foreground text-sm">Explore more</span>
          <ArrowDown className="size-5 text-muted-foreground" />
        </div> */}
      </section>

      {/* Explore Section */}
      <section className="border-t bg-gradient-to-b from-muted/30 to-background py-20 md:py-32">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-6xl space-y-12">
            <div className="space-y-4 text-center">
              <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 font-medium text-primary text-sm">
                How It Works
              </div>
              <h2 className="font-bold text-3xl tracking-tight md:text-4xl">
                Professional Design Made Simple
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Get expert interior design guidance powered by AI. From color
                selection to space planning, we've got you covered.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 md:gap-8">
              {useCases.map((useCase, index) => {
                const Icon = useCase.icon;
                return (
                  <Card
                    className="group relative overflow-hidden border-2 p-8 transition-all hover:border-primary/50 hover:shadow-xl"
                    key={useCase.title}
                  >
                    <div className="absolute top-4 right-4 font-bold text-6xl text-primary/5">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="relative space-y-4">
                      <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 transition-all group-hover:scale-110 group-hover:bg-primary/20">
                        <Icon className="size-7 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-xl">
                          {useCase.title}
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {useCase.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="mt-16 overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-primary/5 via-background to-background p-10 text-center md:p-16">
              <div className="space-y-6">
                <h3 className="font-bold text-2xl tracking-tight md:text-3xl">
                  Ready to transform your space?
                </h3>
                <p className="mx-auto max-w-2xl text-muted-foreground">
                  Join thousands of homeowners creating their dream spaces with
                  AI-powered design assistance.
                </p>
                <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
                  <Link href="/signup">
                    <Button className="w-full sm:w-auto" size="lg">
                      <LogIn className="mr-2 size-5" />
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/about">
                    <Button
                      className="w-full sm:w-auto"
                      size="lg"
                      variant="outline"
                    >
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
