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
  const [isArtifactsPanelOpen, setIsArtifactsPanelOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Map artifacts data to ArtifactTab format
  const artifacts: ArtifactTab[] =
    artifactsData?.map(
      (artifact: NonNullable<typeof artifactsData>[number]) => ({
        id: artifact._id,
        title: formatDesignTitle(artifact.design._id),
        type: artifact.type,
        content: (
          <ArtifactContent
            description={artifact.design.description}
            onExport={() => {
              // Download as JSON
              const dataStr = JSON.stringify(artifact.design, null, 2);
              const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(
                dataStr
              )}`;
              const exportFileDefaultName = `${formatDesignTitle(artifact.design._id)}.json`;
              const linkElement = document.createElement("a");
              linkElement.setAttribute("href", dataUri);
              linkElement.setAttribute("download", exportFileDefaultName);
              linkElement.click();
            }}
            onRegenerate={() => {
              // Send a message to regenerate the design
              sendMessage({
                threadId,
                prompt: `Regenerate the design: ${artifact.design.description}`,
              }).catch(() => {
                // Error handled silently
              });
            }}
            onShare={() => {
              // Copy share link to clipboard
              const shareUrl = `${window.location.origin}/chat/${threadId}?artifact=${artifact._id}`;
              navigator.clipboard.writeText(shareUrl).catch(() => {
                // Handle error silently
              });
            }}
            title={formatDesignTitle(artifact.design._id)}
          />
        ),
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
      <header className="shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-end px-6">
          <Button
            className="gap-2"
            onClick={() => setIsArtifactsPanelOpen(!isArtifactsPanelOpen)}
            size="sm"
            variant={isArtifactsPanelOpen ? "secondary" : "ghost"}
          >
            <PanelRight className="size-4" />
            <span className="text-sm">Artifacts</span>
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden bg-background">
        <div className="flex min-h-0 flex-1 flex-col">
          <Conversation className="mb-[-40px] flex-1" initial="instant">
            <ConversationContent className="px-6 py-6">
              <div className="mx-auto max-w-3xl">
                {messages && messages.length > 0 && (
                  <>
                    {status === "CanLoadMore" && (
                      <div className="flex justify-center py-6">
                        <Button
                          onClick={() => loadMore(10)}
                          size="sm"
                          variant="ghost"
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

                <div className="pb-12" ref={messagesEndRef} />
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
            prompt={prompt}
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
