"use client";

import { ImageIcon } from "lucide-react";
import type { HTMLAttributes } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
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
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: string;
  parts?: Array<{ type: string; text?: string }>;
};

type ChatContentProps = HTMLAttributes<HTMLDivElement> & {
  messages: ChatMessage[];
  status: string;
  input: string;
  model: string;
  models: Array<{ name: string; value: string }>;
  onInputChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onSubmit: (message: PromptInputMessage) => void;
  centered?: boolean;
};

export function ChatContent({
  messages,
  status,
  input,
  model,
  models,
  onInputChange,
  onModelChange,
  onSubmit,
  centered = false,
  className,
  ...props
}: ChatContentProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col p-4",
        centered && "max-w-3xl",
        className
      )}
      {...props}
    >
      <Conversation className="h-full">
        <ConversationContent>
          {messages.length === 0 && (
            <div className="flex size-full flex-col items-center justify-center gap-4 p-8 text-center">
              <ImageIcon className="size-12 text-muted-foreground" />
              <div className="space-y-1">
                <h3 className="font-medium text-sm">
                  Start Your Design Journey
                </h3>
                <p className="text-muted-foreground text-sm">
                  Upload a photo of your space or describe what you'd like to
                  design
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => {
            const textPart = message.parts?.find((p) => p.type === "text");
            const text = textPart?.type === "text" ? textPart.text : "";

            return (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  <Response>{text}</Response>
                </MessageContent>
              </Message>
            );
          })}

          {status === "streaming" && <Loader />}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput
        accept="image/*"
        className="mt-4"
        globalDrop
        multiple
        onSubmit={onSubmit}
      >
        <PromptInputBody>
          <PromptInputAttachments>
            {(attachment) => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>
          <PromptInputTextarea
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Describe your space or ask for design advice..."
            value={input}
          />
        </PromptInputBody>
        <PromptInputToolbar>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments label="Upload room photo" />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>

            <PromptInputModelSelect onValueChange={onModelChange} value={model}>
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
          <PromptInputSubmit disabled={!input} />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}
