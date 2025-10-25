"use client";

import {
  optimisticallySendMessage,
  useUIMessages,
} from "@convex-dev/agent/react";
import { api } from "@furnish/backend/convex/_generated/api";
import { useAction, useMutation } from "convex/react";
import { useCallback, useState } from "react";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { ChatInput } from "@/components/chat/chat-input";

type ChatInputWrapperProps = {
  threadId: string;
};

// Helper function to convert data URL to ArrayBuffer
async function dataUrlToArrayBuffer(dataUrl: string): Promise<ArrayBuffer> {
  const response = await fetch(dataUrl);
  return response.arrayBuffer();
}

// TODO: Move this back w/ the chat-messages to share some logic...
export function ChatInputWrapper({ threadId }: ChatInputWrapperProps) {
  const sendMessage = useMutation(
    api.messages.initiateAsyncStreaming
  ).withOptimisticUpdate(
    optimisticallySendMessage(api.messages.listThreadMessages)
  );

  const uploadFile = useAction(api.files.uploadFile);
  const abortStreamByOrder = useMutation(api.streamAbort.abortStreamByOrder);

  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<string>("gpt-4o");

  // Check if there's a streaming message
  const { results: messages, status } = useUIMessages(
    api.messages.listThreadMessages,
    { threadId },
    { initialNumItems: 10, stream: true }
  );

  const streamingMessage = messages?.find((m) => m.status === "streaming");
  const isStreaming = Boolean(streamingMessage);

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

  return (
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
  );
}
