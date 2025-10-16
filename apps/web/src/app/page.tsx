"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { ArrowUp, Lightbulb, Palette, Zap } from "lucide-react";
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
  const { data: session } = useSession();
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

  return (
    <div className="min-h-screen">
      {!isAuthenticated && <PublicHeader />}

      {/* Hero Section */}
      <section className="flex min-h-screen items-center justify-center px-6">
        <div className="mx-auto w-full max-w-3xl">
          <div className="space-y-12 text-center">
            <div className="space-y-6">
              <h1 className="font-semibold text-6xl tracking-tight md:text-7xl">
                Design your
                <br />
                dream space
              </h1>
              <p className="mx-auto max-w-xl text-lg text-muted-foreground md:text-xl">
                AI-powered interior design guidance. Simple, fast, beautiful.
              </p>
            </div>

            <div className="mx-auto max-w-2xl">
              <PromptInput onSubmit={handleSubmit}>
                <PromptInputBody>
                  <PromptInputTextarea
                    className="min-h-[100px] text-base"
                    disabled={isSubmitting}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe your space..."
                    value={input}
                  />
                </PromptInputBody>
                <PromptInputToolbar>
                  <div className="flex-1" />
                  <PromptInputSubmit disabled={!input.trim() || isSubmitting}>
                    <ArrowUp className="size-4" />
                  </PromptInputSubmit>
                </PromptInputToolbar>
              </PromptInput>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-32">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 font-semibold text-4xl tracking-tight">
                Everything you need
              </h2>
              <p className="text-lg text-muted-foreground">
                Professional design guidance at your fingertips
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {useCases.map((useCase) => {
                const Icon = useCase.icon;
                return (
                  <div className="space-y-4" key={useCase.title}>
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-foreground/5">
                      <Icon className="size-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium text-lg">{useCase.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {useCase.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-20 text-center">
              <div className="space-y-6">
                <h3 className="font-semibold text-3xl tracking-tight">
                  Ready to get started?
                </h3>
                <div className="flex flex-col justify-center gap-3 sm:flex-row">
                  <Link href="/signup">
                    <Button className="w-full sm:w-auto" size="lg">
                      Get Started
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
