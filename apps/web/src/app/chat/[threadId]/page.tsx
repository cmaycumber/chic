"use client";

import {
  optimisticallySendMessage,
  useUIMessages,
} from "@convex-dev/agent/react";
import { api } from "@furnish/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { PanelRight } from "lucide-react";
import { use, useCallback, useRef, useState } from "react";
import type { ArtifactTab } from "@/components/ai-elements/artifact-tabs";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
  ArtifactContent,
  formatDesignTitle,
} from "@/components/chat/artifact-content";
import { ArtifactsPanel } from "@/components/chat/artifacts-panel";
import { ChatInput } from "@/components/chat/chat-input";
import { MessageItem } from "@/components/chat/message-item";
import { Button } from "@/components/ui/button";

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

  // Fetch artifacts for this thread
  const artifactsData = useQuery(api.artifacts.listByThreadIdWithDetails, {
    threadId,
  });

  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<string>("gpt-4o");
  const [webSearch, setWebSearch] = useState(false);
  const [isArtifactsPanelOpen, setIsArtifactsPanelOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Map artifacts data to ArtifactTab format
  const artifacts: ArtifactTab[] =
    artifactsData?.map(
      (artifact: NonNullable<typeof artifactsData>[number]) => ({
        id: artifact._id,
        title: formatDesignTitle(artifact.design._id),
        type: artifact.type,
        content: <ArtifactContent description={artifact.design.description} />,
      })
    ) ?? [];

  const handleSendMessage = useCallback(
    (message: PromptInputMessage, event: React.FormEvent) => {
      event.preventDefault();
      const trimmedPrompt = message.text?.trim();
      const hasText = Boolean(trimmedPrompt);
      const hasAttachments = Boolean(message.files?.length);

      if (!(hasText || hasAttachments)) {
        return;
      }

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
          <Button
            className="gap-1.5"
            onClick={() => setIsArtifactsPanelOpen(!isArtifactsPanelOpen)}
            size="sm"
            variant={isArtifactsPanelOpen ? "default" : "ghost"}
          >
            <PanelRight className="size-3.5" />
            Artifacts
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden bg-background">
        <div className="flex min-h-0 flex-1 flex-col">
          <Conversation className="mb-[-40px] flex-1" initial="instant">
            <ConversationContent className="px-6 py-4">
              <div className="mx-auto max-w-3xl">
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

                <div className="pb-10" ref={messagesEndRef} />
              </div>
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <ChatInput
            isDisabled={status === "LoadingFirstPage"}
            isStreaming={isStreaming}
            model={model}
            onModelChange={setModel}
            onPromptChange={setPrompt}
            onStopStreaming={() => {
              const order = streamingMessage?.order ?? 0;
              abortStreamByOrder({ threadId, order }).catch(() => {
                // Error handled silently
              });
            }}
            onSubmit={handleSendMessage}
            onWebSearchToggle={() => setWebSearch(!webSearch)}
            prompt={prompt}
            webSearch={webSearch}
          />
        </div>

        {isArtifactsPanelOpen && (
          <ArtifactsPanel
            artifacts={artifacts}
            onClose={() => setIsArtifactsPanelOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
