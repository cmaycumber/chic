"use client";

import {
  optimisticallySendMessage,
  useUIMessages,
} from "@convex-dev/agent/react";
import { api } from "@furnish/backend/convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import { PanelRight } from "lucide-react";
import { use, useCallback, useRef, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import type { ArtifactTab } from "@/components/chat/artifact-tabs";
import { ArtifactsPanel } from "@/components/chat/artifacts-panel";
import { ChatInput } from "@/components/chat/chat-input";
import { DesignArtifact } from "@/components/chat/design-artifact";
import { MessageItem } from "@/components/chat/message-item";
import { Button } from "@/components/ui/button";

const DESIGN_ID_SLICE_LENGTH = 6;

function formatDesignTitle(designId: string): string {
  return `Design ${designId.slice(-DESIGN_ID_SLICE_LENGTH)}`;
}

// Helper function to convert data URL to ArrayBuffer
async function dataUrlToArrayBuffer(dataUrl: string): Promise<ArrayBuffer> {
  const response = await fetch(dataUrl);
  return response.arrayBuffer();
}

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

  const uploadFile = useAction(api.files.uploadFile);
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
          <DesignArtifact
            design={artifact.design}
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
          />
        ),
      })
    ) ?? [];

  const handleSendMessage = useCallback(
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: File upload logic requires sequential steps with error handling
    async function sendWithFiles(
      message: PromptInputMessage,
      event: React.FormEvent
    ) {
      event.preventDefault();
      const trimmedPrompt = message.text?.trim();
      const hasText = Boolean(trimmedPrompt);
      const hasAttachments = Boolean(message.files?.length);

      if (!(hasText || hasAttachments)) {
        return;
      }

      try {
        // Upload files first and get fileIds
        const fileIds: string[] = [];
        if (message.files && message.files.length > 0) {
          for (const file of message.files) {
            const arrayBuffer = await dataUrlToArrayBuffer(file.url);
            // FileUIPart uses mediaType, not type
            const mimeType = file.mediaType?.includes("/")
              ? file.mediaType
              : "application/octet-stream";

            const fileId = await uploadFile({
              data: arrayBuffer,
              mimeType,
              filename: file.filename,
            });

            fileIds.push(fileId);
          }
        }

        await sendMessage({
          threadId,
          prompt: trimmedPrompt || "Sent with attachments",
          fileIds: fileIds.length > 0 ? fileIds : undefined,
        });
        setPrompt("");
      } catch {
        setPrompt(trimmedPrompt || "");
      }
    },
    [sendMessage, uploadFile, threadId]
  );

  const streamingMessage = messages?.find((m) => m.status === "streaming");
  const isStreaming = Boolean(streamingMessage);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Chat Section */}
      <div className="flex min-h-0 flex-1 flex-col border-r">
        {/* Chat Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3">
            {status === "LoadingFirstPage" && (
              <span className="text-muted-foreground text-xs">Loading...</span>
            )}
            {isStreaming && (
              <span className="text-muted-foreground text-xs">
                Streaming...
              </span>
            )}
          </div>
          <Button
            className="gap-2"
            onClick={() => setIsArtifactsPanelOpen(!isArtifactsPanelOpen)}
            size="sm"
            variant={isArtifactsPanelOpen ? "secondary" : "ghost"}
          >
            <PanelRight className="size-4" />
            <span className="text-sm">
              {isArtifactsPanelOpen ? "Hide Designs" : "Show Designs"}
            </span>
          </Button>
        </header>

        {/* Chat Content */}
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

        {/* Chat Input */}
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

      {/* Designs Panel */}
      {isArtifactsPanelOpen && (
        <ArtifactsPanel
          artifacts={artifacts}
          onClose={() => setIsArtifactsPanelOpen(false)}
        />
      )}
    </div>
  );
}
