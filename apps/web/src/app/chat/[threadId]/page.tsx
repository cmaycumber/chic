"use client";

import {
  optimisticallySendMessage,
  type UIMessage,
  useSmoothText,
  useUIMessages,
} from "@convex-dev/agent/react";
import { api } from "@furnish/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import {
  ArrowUp,
  CopyIcon,
  GlobeIcon,
  RefreshCcwIcon,
  RotateCcw,
  StopCircle,
} from "lucide-react";
import Link from "next/link";
import { Fragment, use, useCallback, useEffect, useRef, useState } from "react";
import { Action, Actions } from "@/components/ai-elements/actions";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const models = [
  {
    name: "GPT 4o",
    value: "gpt-4o",
  },
  {
    name: "GPT 4o mini",
    value: "gpt-4o-mini",
  },
  {
    name: "Claude 3.5 Sonnet",
    value: "claude-3-5-sonnet",
  },
];

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
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousThreadIdRef = useRef<string>(threadId);
  const previousMessageCountRef = useRef<number>(0);

  useEffect(() => {
    if (messages && messages.length > 0) {
      const threadChanged = previousThreadIdRef.current !== threadId;
      const messagesAdded = messages.length > previousMessageCountRef.current;

      // Instant scroll when switching threads or loading for the first time
      // Smooth scroll when new messages are added to the current conversation
      let behavior: ScrollBehavior = "auto";
      if (threadChanged) {
        behavior = "instant";
      } else if (messagesAdded) {
        behavior = "smooth";
      }

      messagesEndRef.current?.scrollIntoView({ behavior });

      previousThreadIdRef.current = threadId;
      previousMessageCountRef.current = messages.length;
    }
  }, [messages, threadId]);

  const handleSendMessage = useCallback(
    (message: PromptInputMessage, event: React.FormEvent) => {
      event.preventDefault();
      const trimmedPrompt = message.text?.trim();
      const hasText = Boolean(trimmedPrompt);
      const hasAttachments = Boolean(message.files?.length);

      if (!(hasText || hasAttachments)) {
        return;
      }

      // TODO: Send model and webSearch preferences with the message
      // TODO: Handle file attachments
      sendMessage({
        threadId,
        prompt: trimmedPrompt || "Sent with attachments",
      }).catch(() => {
        setPrompt(trimmedPrompt || "");
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
        <div className="flex h-14 items-center justify-between px-6">
          <h1 className="font-semibold text-base">Chat</h1>
          <Link href="/chat">
            <Button className="gap-1.5" size="sm" variant="ghost">
              <RotateCcw className="size-3.5" />
              New Chat
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col bg-background">
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
                  <MessageItem
                    isLastMessage={m === messages.at(-1)}
                    isStreaming={m.status === "streaming"}
                    key={m.key}
                    message={m}
                  />
                ))}
              </>
            )}

            <div ref={messagesEndRef} />
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="shrink-0 border-t bg-background p-6">
          <div className="mx-auto max-w-3xl">
            <PromptInput globalDrop multiple onSubmit={handleSendMessage}>
              <PromptInputBody>
                <PromptInputAttachments>
                  {(attachment) => <PromptInputAttachment data={attachment} />}
                </PromptInputAttachments>
                <PromptInputTextarea
                  className="min-h-[60px] text-base"
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask about styles, colors, furniture, budget, or materials..."
                  rows={2}
                  value={prompt}
                />
              </PromptInputBody>
              <PromptInputToolbar>
                <PromptInputTools>
                  <PromptInputActionMenu>
                    <PromptInputActionMenuTrigger />
                    <PromptInputActionMenuContent>
                      <PromptInputActionAddAttachments />
                    </PromptInputActionMenuContent>
                  </PromptInputActionMenu>
                  <PromptInputButton
                    onClick={() => setWebSearch(!webSearch)}
                    variant={webSearch ? "default" : "ghost"}
                  >
                    <GlobeIcon size={16} />
                    <span>Search</span>
                  </PromptInputButton>
                  <PromptInputModelSelect
                    onValueChange={(value) => {
                      setModel(value);
                    }}
                    value={model}
                  >
                    <PromptInputModelSelectTrigger>
                      <PromptInputModelSelectValue />
                    </PromptInputModelSelectTrigger>
                    <PromptInputModelSelectContent>
                      {models.map((modelOption) => (
                        <PromptInputModelSelectItem
                          key={modelOption.value}
                          value={modelOption.value}
                        >
                          {modelOption.name}
                        </PromptInputModelSelectItem>
                      ))}
                    </PromptInputModelSelectContent>
                  </PromptInputModelSelect>
                </PromptInputTools>
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
                  <PromptInputSubmit
                    disabled={!prompt.trim() || status === "LoadingFirstPage"}
                  >
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

function MessageItem({
  message,
  isLastMessage,
  isStreaming,
}: {
  message: UIMessage;
  isLastMessage: boolean;
  isStreaming: boolean;
}) {
  const isUser = message.role === "user";
  const [visibleText] = useSmoothText(message.text, {
    startStreaming: message.status === "streaming",
  });

  // Parse message parts if available
  // For now, we'll treat the whole message as text
  // TODO: Update backend to send messages with parts (text, reasoning, source-url)
  const parts = [{ type: "text" as const, text: visibleText || "..." }];

  // Check if message has sources (mock for now)
  const sources =
    message.parts?.filter((part) => part.type === "source-url") || [];

  return (
    <div>
      {message.role === "assistant" && sources.length > 0 && (
        <Sources>
          <SourcesTrigger count={sources.length} />
          {sources.map((part, i) => (
            <SourcesContent key={`${message.key}-source-${i}`}>
              <Source href={part.url} title={part.url} />
            </SourcesContent>
          ))}
        </Sources>
      )}

      {parts.map((part, i) => {
        switch (part.type) {
          case "text": {
            return (
              <Fragment key={`${message.key}-${i}`}>
                <Message from={message.role}>
                  <MessageContent>
                    <Response
                      className={cn(
                        isUser && "text-foreground",
                        message.status === "streaming" && "animate-pulse",
                        message.status === "failed" && "text-destructive"
                      )}
                    >
                      {part.text}
                    </Response>
                  </MessageContent>
                </Message>
                {message.role === "assistant" &&
                  isLastMessage &&
                  !isStreaming && (
                    <Actions className="mt-2">
                      <Action
                        label="Retry"
                        onClick={() => {
                          // TODO: Implement regenerate functionality
                        }}
                      >
                        <RefreshCcwIcon className="size-3" />
                      </Action>
                      <Action
                        label="Copy"
                        onClick={() => {
                          navigator.clipboard.writeText(part.text);
                        }}
                      >
                        <CopyIcon className="size-3" />
                      </Action>
                    </Actions>
                  )}
              </Fragment>
            );
          }
          default: {
            return null;
          }
        }
      })}
    </div>
  );
}
