"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  PromptInput,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from "@/components/ai-elements/prompt-input";
import { useSession } from "@/lib/auth-client";

const PENDING_CHAT_INPUT_KEY = "furnish_pending_chat_input";

export function HeroInputSection() {
  const router = useRouter();
  const { data: session } = useSession();
  const [input, setInput] = useState("");
  const createThread = useMutation(api.threads.createNewThread);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthenticated = !!session;

  // Restore pending input from sessionStorage on mount
  useEffect(() => {
    const pendingInput = sessionStorage.getItem(PENDING_CHAT_INPUT_KEY);
    if (pendingInput) {
      setInput(pendingInput);
    }
  }, []);

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      if (!message.text?.trim() || isSubmitting) {
        return;
      }

      if (!isAuthenticated) {
        // Save input to sessionStorage before redirecting to login
        sessionStorage.setItem(PENDING_CHAT_INPUT_KEY, message.text);
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

        // Clear sessionStorage after successful thread creation
        sessionStorage.removeItem(PENDING_CHAT_INPUT_KEY);

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
    <div className="mx-auto max-w-md">
      <PromptInput onSubmit={handleSubmit}>
        <PromptInputBody>
          <PromptInputTextarea
            className="bg-white font-light text-ink placeholder:text-ink/40"
            disabled={isSubmitting}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your vision..."
            value={input}
          />
        </PromptInputBody>
        <PromptInputToolbar className="bg-white">
          <div className="flex-1" />
          <PromptInputSubmit
            className="bg-ink text-white hover:bg-ink/90"
            disabled={!input.trim() || isSubmitting}
          >
            <ArrowUp className="size-4" />
          </PromptInputSubmit>
        </PromptInputToolbar>
      </PromptInput>
      <p className="mt-3 font-light text-white/60 text-xs">
        Start with a simple description or upload a photo of your space
      </p>
    </div>
  );
}
