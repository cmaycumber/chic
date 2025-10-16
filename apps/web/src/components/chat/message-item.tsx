"use client";

import { type UIMessage, useSmoothText } from "@convex-dev/agent/react";
import { CopyIcon, RefreshCcwIcon } from "lucide-react";
import { Action, Actions } from "@/components/ai-elements/actions";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Response } from "@/components/ai-elements/response";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { cn } from "@/lib/utils";

type MessageItemProps = {
  message: UIMessage;
  isLastMessage: boolean;
  isStreaming: boolean;
};

export function MessageItem({
  message,
  isLastMessage,
  isStreaming,
}: MessageItemProps) {
  const isUser = message.role === "user";

  // Parse message parts if available, otherwise fall back to treating the whole message as text
  const parts =
    message.parts && message.parts.length > 0
      ? message.parts
      : [{ type: "text" as const, text: message.text || "..." }];

  // Check if message has sources
  const sources =
    message.parts?.filter((part) => part.type === "source-url") || [];

  // Collect all reasoning parts for the Reasoning wrapper
  const reasoningParts = parts.filter((part) => part.type === "reasoning");

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

      <Message from={message.role}>
        <MessageContent>
          {parts.map((part, i) => {
            const isStreamingThisPart =
              message.status === "streaming" && i === parts.length - 1;

            switch (part.type) {
              case "text": {
                return (
                  <TextPart
                    isStreaming={isStreamingThisPart}
                    isUser={isUser}
                    key={`${message.key}-${i}`}
                    status={message.status}
                    text={"text" in part ? part.text : ""}
                  />
                );
              }
              case "reasoning": {
                // Check if this is the first reasoning part
                const isFirstReasoning = parts
                  .slice(0, i)
                  .every((p) => p.type !== "reasoning");

                if (!isFirstReasoning) {
                  // Only render the Reasoning wrapper once
                  return null;
                }

                // Render all reasoning parts together in a single Reasoning component
                return (
                  <Reasoning
                    className="w-full"
                    defaultOpen={false}
                    isStreaming={isStreaming && isLastMessage}
                    key={`${message.key}-reasoning`}
                  >
                    <ReasoningTrigger />
                    {reasoningParts.map((reasoningPart, reasoningIndex) => {
                      const partIndex = parts.indexOf(reasoningPart);
                      const isStreamingThisReasoning =
                        message.status === "streaming" &&
                        isLastMessage &&
                        partIndex === parts.length - 1;

                      return (
                        <ReasoningPart
                          isStreaming={isStreamingThisReasoning}
                          key={`${message.key}-reasoning-${reasoningIndex}`}
                          text={
                            "text" in reasoningPart ? reasoningPart.text : ""
                          }
                        />
                      );
                    })}
                  </Reasoning>
                );
              }
              default: {
                return null;
              }
            }
          })}
        </MessageContent>
      </Message>

      {message.role === "assistant" && isLastMessage && !isStreaming && (
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
              navigator.clipboard.writeText(message.text);
            }}
          >
            <CopyIcon className="size-3" />
          </Action>
        </Actions>
      )}
    </div>
  );
}

function TextPart({
  text,
  isStreaming,
  isUser,
  status,
}: {
  text: string;
  isStreaming: boolean;
  isUser: boolean;
  status: UIMessage["status"];
}) {
  const [visibleText] = useSmoothText(text, {
    startStreaming: isStreaming,
  });

  return (
    <Response
      className={cn(
        isUser && "text-foreground",
        isStreaming && "animate-pulse",
        status === "failed" && "text-destructive"
      )}
    >
      {visibleText || ""}
    </Response>
  );
}

function ReasoningPart({
  text,
  isStreaming,
}: {
  text: string;
  isStreaming: boolean;
}) {
  const [visibleText] = useSmoothText(text, {
    startStreaming: isStreaming,
  });

  return (
    <ReasoningContent className={cn(isStreaming && "animate-pulse")}>
      {visibleText || "..."}
    </ReasoningContent>
  );
}
