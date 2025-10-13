"use client";

import {
  optimisticallySendMessage,
  type UIMessage,
  useSmoothText,
  useUIMessages,
} from "@convex-dev/agent/react";
import { api } from "@furnish/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { ArrowUp, RotateCcw, StopCircle } from "lucide-react";
import Link from "next/link";
import { use, useCallback, useEffect, useRef, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  type PromptInputMessage,
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

  const handleSendMessage = useCallback(
    (message: PromptInputMessage, event: React.FormEvent) => {
      event.preventDefault();
      const trimmedPrompt = message.text?.trim();
      if (!trimmedPrompt) {
        return;
      }

      sendMessage({ threadId, prompt: trimmedPrompt }).catch(() => {
        setPrompt(trimmedPrompt);
      });
      setPrompt("");
    },
    [sendMessage, threadId]
  );

  const streamingMessage = messages?.find((m) => m.status === "streaming");
  const isStreaming = Boolean(streamingMessage);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="shrink-0 border-b bg-background">
        <div className="flex h-14 items-center gap-4 px-6">
          <Sparkles className="size-5 text-primary" />
          <div className="flex-1">
            <h1 className="font-semibold text-base">
              Interior Design Consultant
            </h1>
          </div>
          <Link href="/chat">
            <Button className="gap-1.5" size="sm" variant="outline">
              <RotateCcw className="size-3.5" />
              New Chat
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col bg-muted/20">
        <Conversation className="flex-1">
          <ConversationContent className="p-4">
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

        <div className="shrink-0 border-t bg-background p-6">
          <div className="mx-auto max-w-3xl">
            <PromptInput onSubmit={handleSendMessage}>
              <PromptInputBody>
                <PromptInputTextarea
                  className="min-h-[60px] text-base"
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
                      abortStreamByOrder({ threadId, order }).catch(() => {
                        // Error handled silently
                      });
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
                    <ArrowUp className="size-4" />
                  </PromptInputSubmit>
                )}
              </PromptInputToolbar>
            </PromptInput>
            <div className="mt-2 text-center text-muted-foreground text-xs">
              Furnish can make mistakes. Check important info.
            </div>
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
