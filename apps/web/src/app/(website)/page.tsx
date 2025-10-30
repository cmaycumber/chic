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
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

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
    <>
      {/* Hero Section */}
      <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 md:min-h-screen md:py-0">
        <div className="mx-auto w-full max-w-3xl">
          <div className="space-y-8 text-center md:space-y-12">
            <div className="space-y-4 md:space-y-6">
              <h1 className="font-semibold text-4xl tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Your AI Interior
                <br />
                Designer
              </h1>
              <p className="mx-auto max-w-xl text-base text-muted-foreground sm:text-lg md:text-xl">
                Professional interior design powered by AI. Get instant room
                designs, personalized recommendations, and expert guidance—all
                for free.
              </p>
            </div>

            <div className="mx-auto max-w-2xl">
              <PromptInput onSubmit={handleSubmit}>
                <PromptInputBody>
                  <PromptInputTextarea
                    className="min-h-[80px] text-sm sm:min-h-[100px] sm:text-base"
                    disabled={isSubmitting}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask your AI interior designer anything... (e.g., 'Help me design a modern living room')"
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
      <section className="bg-muted/30 py-16 sm:py-24 md:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center sm:mb-16">
              <h2 className="mb-3 font-semibold text-2xl tracking-tight sm:mb-4 sm:text-3xl md:text-4xl">
                Your Complete AI Interior Designer
              </h2>
              <p className="text-base text-muted-foreground sm:text-lg">
                Professional interior design expertise powered by artificial
                intelligence
              </p>
            </div>

            <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
              {useCases.map((useCase) => {
                const Icon = useCase.icon;
                return (
                  <div className="space-y-3 sm:space-y-4" key={useCase.title}>
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-foreground/5">
                      <Icon className="size-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium text-base sm:text-lg">
                        {useCase.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {useCase.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 text-center sm:mt-16 md:mt-20">
              <div className="space-y-4 sm:space-y-6">
                <h3 className="font-semibold text-2xl tracking-tight sm:text-3xl">
                  Ready to Transform Your Space?
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Start chatting with your free AI interior designer today
                </p>
                <div className="flex flex-col justify-center gap-3 sm:flex-row">
                  <Link href="/signup">
                    <Button className="w-full sm:w-auto" size="lg">
                      Start Free with AI Designer
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
