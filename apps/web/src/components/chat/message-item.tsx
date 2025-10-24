"use client";

import { type UIMessage, useSmoothText } from "@convex-dev/agent/react";
import {
  AlertCircleIcon,
  CopyIcon,
  FileAudioIcon,
  FileIcon,
  FileVideoIcon,
  ImageIcon,
} from "lucide-react";
import Image from "next/image";
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
      : [{ type: "text" as const, text: message.text || "" }];

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
        <MessageContent className={isUser ? undefined : "rounded-none p-0"}>
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
              case "file": {
                return (
                  <FilePartRenderer
                    key={`${message.key}-file-${i}`}
                    messageKey={message.key}
                    part={part}
                    partIndex={i}
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
        <Actions className="-ml-2.5">
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

  // Show error state with meaningful message
  if (status === "failed") {
    return (
      <div className="flex items-start gap-2 text-destructive">
        <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
        <span className="text-sm">
          {visibleText || "Message failed to send"}
        </span>
      </div>
    );
  }

  return (
    <Response
      className={cn(
        isUser && "text-foreground",
        isStreaming && "animate-pulse"
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
      {visibleText || ""}
    </ReasoningContent>
  );
}

function FilePartRenderer({
  part,
  messageKey,
  partIndex,
}: {
  part: { url?: string; mediaType?: string };
  messageKey: string;
  partIndex: number;
}) {
  const mimeType = part.mediaType ?? "";

  // Check media type based on mimeType
  if (mimeType.startsWith("image/")) {
    return (
      <ImagePart
        key={`${messageKey}-image-${partIndex}`}
        mimeType={mimeType}
        url={part.url}
      />
    );
  }

  if (mimeType.startsWith("video/")) {
    return (
      <VideoPart
        key={`${messageKey}-video-${partIndex}`}
        mimeType={mimeType}
        url={part.url}
      />
    );
  }

  if (mimeType.startsWith("audio/")) {
    return (
      <AudioPart
        key={`${messageKey}-audio-${partIndex}`}
        mimeType={mimeType}
        url={part.url}
      />
    );
  }

  if (mimeType === "application/pdf") {
    return (
      <PdfPart
        filename={part.url?.split("/").pop()}
        key={`${messageKey}-pdf-${partIndex}`}
        url={part.url}
      />
    );
  }

  // Default to generic file
  return (
    <FilePart
      filename={part.url?.split("/").pop()}
      key={`${messageKey}-file-${partIndex}`}
      mimeType={mimeType}
      url={part.url}
    />
  );
}

function ImagePart({ url, mimeType }: { url?: string; mimeType?: string }) {
  if (!url) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
        <ImageIcon className="size-5 text-muted-foreground" />
        <span className="text-muted-foreground text-sm">Loading image...</span>
      </div>
    );
  }

  return (
    <div className="relative my-2 overflow-hidden rounded-lg border border-border">
      <Image
        alt="Attached image"
        className="max-h-96 w-auto object-contain"
        height={400}
        src={url}
        unoptimized={mimeType?.includes("svg")}
        width={600}
      />
    </div>
  );
}

function VideoPart({ url, mimeType }: { url?: string; mimeType?: string }) {
  if (!url) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
        <FileVideoIcon className="size-5 text-muted-foreground" />
        <span className="text-muted-foreground text-sm">Loading video...</span>
      </div>
    );
  }

  return (
    <div className="relative my-2 overflow-hidden rounded-lg border border-border">
      <video className="max-h-96 w-full" controls preload="metadata">
        <source src={url} type={mimeType || "video/mp4"} />
        <track kind="captions" label="No captions available" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

function AudioPart({ url, mimeType }: { url?: string; mimeType?: string }) {
  if (!url) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
        <FileAudioIcon className="size-5 text-muted-foreground" />
        <span className="text-muted-foreground text-sm">Loading audio...</span>
      </div>
    );
  }

  return (
    <div className="my-2 rounded-lg border border-border bg-muted/30 p-3">
      <audio className="w-full" controls preload="metadata">
        <source src={url} type={mimeType || "audio/mpeg"} />
        <track kind="captions" label="No captions available" />
        Your browser does not support the audio tag.
      </audio>
    </div>
  );
}

function PdfPart({ url, filename }: { url?: string; filename?: string }) {
  if (!url) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
        <FileIcon className="size-5 text-muted-foreground" />
        <span className="text-muted-foreground text-sm">Loading PDF...</span>
      </div>
    );
  }

  return (
    <a
      className="my-2 flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
      download={filename}
      href={url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <FileIcon className="size-5 text-muted-foreground" />
      <div className="flex-1">
        <div className="font-medium text-sm">{filename || "PDF Document"}</div>
        <div className="text-muted-foreground text-xs">
          Click to open or download
        </div>
      </div>
    </a>
  );
}

function FilePart({
  url,
  filename,
  mimeType,
}: {
  url?: string;
  filename?: string;
  mimeType?: string;
}) {
  if (!url) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
        <FileIcon className="size-5 text-muted-foreground" />
        <span className="text-muted-foreground text-sm">Loading file...</span>
      </div>
    );
  }

  return (
    <a
      className="my-2 flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
      download={filename}
      href={url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <FileIcon className="size-5 text-muted-foreground" />
      <div className="flex-1">
        <div className="font-medium text-sm">{filename || "Attached file"}</div>
        {mimeType && (
          <div className="text-muted-foreground text-xs">{mimeType}</div>
        )}
      </div>
    </a>
  );
}
