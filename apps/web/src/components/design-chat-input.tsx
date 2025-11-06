"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
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

type DesignChatInputProps = {
  designId: Id<"designs">;
  designTitle: string;
};

export function DesignChatInput({
  designId,
  designTitle,
}: DesignChatInputProps) {
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
        // Create a thread with context about the design
        const contextualMessage = `I want to build on this design: "${designTitle}" (Design ID: ${designId})\n\n${message.text}`;

        const threadId = await createThread({
          initialMessage: {
            role: "user",
            content: contextualMessage,
          },
          title: `Remix: ${designTitle}`,
        });
        router.push(`/chat/${threadId}`);
      } catch {
        // Error handled silently - could add toast notification
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, createThread, router, isAuthenticated, designId, designTitle]
  );

  return (
    <div className="pointer-events-none fixed right-0 bottom-0 left-0 z-50 bg-gradient-to-t from-background via-background to-background/0 pt-16 pb-4 sm:pt-20 sm:pb-6">
      <div className="container pointer-events-auto mx-auto max-w-3xl px-4">
        <div className="relative">
          <div className="-top-10 absolute right-0 left-0 flex items-center justify-center gap-2 text-muted-foreground/60 text-xs">
            <Sparkles className="size-3" />
            <span>Continue designing with AI</span>
          </div>

          <PromptInput onSubmit={handleSubmit}>
            <PromptInputBody>
              <PromptInputTextarea
                className="min-h-[56px] text-sm sm:min-h-[60px] sm:text-base"
                disabled={isSubmitting}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask to modify this design, change colors, or try something new..."
                value={input}
              />
            </PromptInputBody>
            <PromptInputToolbar>
              <div className="flex-1" />
              <PromptInputSubmit disabled={isSubmitting || !input.trim()}>
                <ArrowUp className="size-4 sm:size-5" />
              </PromptInputSubmit>
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
