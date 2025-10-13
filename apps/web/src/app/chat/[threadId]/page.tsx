"use client";

import {
  optimisticallySendMessage,
  type UIMessage,
  useSmoothText,
  useUIMessages,
} from "@convex-dev/agent/react";
import { api } from "@furnish/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { RotateCcw, Sparkles, StopCircle } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ChatPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = use(params);

  // Load messages with streaming support
  const {
    results: messages,
    status,
    loadMore,
  } = useUIMessages(
    api.messages.listThreadMessages,
    { threadId },
    { initialNumItems: 10, stream: true }
  );

  const sendMessage = useMutation(
    api.messages.initiateAsyncStreaming
  ).withOptimisticUpdate(
    optimisticallySendMessage(api.messages.listThreadMessages)
  );

  const abortStreamByOrder = useMutation(api.streamAbort.abortStreamByOrder);

  const [prompt, setPrompt] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      return;
    }

    sendMessage({ threadId, prompt: trimmedPrompt }).catch(() => {
      setPrompt(trimmedPrompt);
    });
    setPrompt("");
  };

  const streamingMessage = messages?.find((m) => m.status === "streaming");
  const isStreaming = Boolean(streamingMessage);

  return (
    <div className="flex h-screen flex-col bg-muted/30">
      <header className="shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-6">
          <Sparkles className="size-6 text-primary" />
          <div className="flex-1">
            <h1 className="font-semibold text-lg">
              Interior Design Consultant
            </h1>
            <p className="text-muted-foreground text-xs">
              Your AI-powered design expert
            </p>
          </div>
          <Link href="/">
            <Button className="gap-1.5" size="sm" variant="outline">
              <RotateCcw className="size-3.5" />
              New Consultation
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <Conversation className="flex-1">
          <ConversationContent>
            {messages?.length === 0 && (
              <div className="flex size-full flex-col items-center justify-center gap-4 p-8 text-center">
                <Sparkles className="size-12 text-muted-foreground" />
                <div className="space-y-1">
                  <h3 className="font-medium text-sm">
                    Start your consultation
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Ask me about styles, colors, furniture, budget, or materials
                  </p>
                </div>
              </div>
            )}

            {messages && messages.length > 0 && (
              <>
                {status === "CanLoadMore" && (
                  <div className="flex justify-center py-4">
                    <Button
                      onClick={() => loadMore(10)}
                      size="sm"
                      variant="outline"
                    >
                      Load more
                    </Button>
                  </div>
                )}
                {messages.map((m) => (
                  <MessageItem key={m.key} message={m} />
                ))}
              </>
            )}

            <div ref={messagesEndRef} />
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="shrink-0 border-t bg-background p-4">
          <div className="mx-auto max-w-3xl">
            <PromptInput onSubmit={handleSendMessage}>
              <PromptInputBody>
                <PromptInputTextarea
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask about styles, colors, furniture, budget, or materials..."
                  rows={2}
                  value={prompt}
                />
              </PromptInputBody>
              <PromptInputToolbar>
                <div className="flex-1" />
                {isStreaming ? (
                  <Button
                    className="gap-1.5"
                    onClick={() => {
                      const order = streamingMessage?.order ?? 0;
                      abortStreamByOrder({ threadId, order }).catch(
                        (error: unknown) => {
                          throw error;
                        }
                      );
                    }}
                    size="sm"
                    type="button"
                    variant="destructive"
                  >
                    <StopCircle className="size-3.5" />
                    Stop
                  </Button>
                ) : (
                  <PromptInputSubmit disabled={!prompt.trim()}>
                    Send
                  </PromptInputSubmit>
                )}
              </PromptInputToolbar>
            </PromptInput>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageItem({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const [visibleText] = useSmoothText(message.text, {
    startStreaming: message.status === "streaming",
  });

  return (
    <Message from={message.role}>
      <MessageContent>
        <Response
          className={cn(
            isUser && "text-foreground",
            message.status === "streaming" && "animate-pulse",
            message.status === "failed" && "text-destructive"
          )}
        >
          {visibleText || "..."}
        </Response>
      </MessageContent>
    </Message>
  );
}
