"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { ArrowUp, Sparkles } from "lucide-react";
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
import { useSession } from "@/lib/auth-client";

export function HeroInputSection() {
  const router = useRouter();
  const { data: session } = useSession();
  const [input, setInput] = useState("");
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
    <div className="pointer-events-none relative z-10 mb-12 space-y-6 pt-12 text-center">
      <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm">
        <Sparkles className="size-4 text-amber-600" />
        <span className="font-medium text-sm">AI-Powered Design</span>
      </div>
      <h1 className="font-bold text-5xl text-white leading-tight tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
        Your <span className="text-amber-700 italic">intelligent</span>
        <br />
        canvas.
      </h1>
      <p className="mx-auto max-w-2xl text-lg text-neutral-100 sm:text-xl">
        Every creative AI tool. Thoughtfully connected.
      </p>

      {/* CTA */}
      <div className="pointer-events-auto mx-auto max-w-md">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea
              disabled={isSubmitting}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your dream space..."
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
  );
}
