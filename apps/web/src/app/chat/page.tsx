"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { ArrowUp, Mic } from "lucide-react";
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
import { RecommendationCards } from "@/components/recommendation-cards";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

export default function ChatHomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [input, setInput] = useState("");
  const createThread = useMutation(api.threads.createNewThread);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (
      message: PromptInputMessage,
      event: React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();
      if (!message.text?.trim() || isSubmitting) {
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
    [isSubmitting, createThread, router]
  );

  const userName = session?.user?.name || "there";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b px-6">
          <h1 className="font-semibold text-lg">New chat</h1>
          <div className="flex items-center gap-4">
            <button
              className="text-muted-foreground text-sm hover:text-foreground"
              type="button"
            >
              Room Type
            </button>
            <button
              className="text-muted-foreground text-sm hover:text-foreground"
              type="button"
            >
              Style
            </button>
            <button
              className="text-muted-foreground text-sm hover:text-foreground"
              type="button"
            >
              Budget
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost">
              Invite
            </Button>
            <Button size="sm" variant="default">
              Create a board
            </Button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          <div className="w-full max-w-2xl space-y-8">
            {/* Greeting */}
            <div className="space-y-4">
              <h2 className="font-bold text-3xl tracking-tight">
                How can I help design your space today, {userName}?
              </h2>
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                  <span className="font-semibold text-sm">F</span>
                </div>
                <p className="text-muted-foreground">
                  Hey there, I'm here to assist you in creating beautiful
                  spaces. Ask me anything design related.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t bg-background p-6">
          <div className="mx-auto max-w-2xl">
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputBody>
                <PromptInputTextarea
                  className="min-h-[60px]"
                  disabled={isSubmitting}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything..."
                  value={input}
                />
              </PromptInputBody>
              <PromptInputToolbar>
                <button
                  className="rounded-full p-2 hover:bg-accent"
                  disabled={isSubmitting}
                  type="button"
                >
                  <Mic className="size-5 text-muted-foreground" />
                </button>
                <div className="flex-1" />
                <PromptInputSubmit disabled={!input.trim() || isSubmitting}>
                  <ArrowUp className="size-5" />
                </PromptInputSubmit>
              </PromptInputToolbar>
            </PromptInput>
            <div className="mt-2 text-center text-muted-foreground/80 text-xs">
              Furnish can make mistakes. Check important info.
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-[400px] shrink-0 border-l bg-muted/30">
        <RecommendationCards />
      </div>
    </div>
  );
}
