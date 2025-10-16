"use client";

import { ArrowUp, GlobeIcon, StopCircle } from "lucide-react";
import type React from "react";
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
import { Button } from "@/components/ui/button";

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

type ChatInputProps = {
  prompt: string;
  onPromptChange: (value: string) => void;
  model: string;
  onModelChange: (value: string) => void;
  webSearch: boolean;
  onWebSearchToggle: () => void;
  onSubmit: (message: PromptInputMessage, event: React.FormEvent) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  isDisabled: boolean;
};

export function ChatInput({
  prompt,
  onPromptChange,
  model,
  onModelChange,
  webSearch,
  onWebSearchToggle,
  onSubmit,
  isStreaming,
  onStopStreaming,
  isDisabled,
}: ChatInputProps) {
  return (
    <div className="z-10 shrink-0 px-6 pb-6">
      <div className="mx-auto max-w-3xl">
        <PromptInput globalDrop multiple onSubmit={onSubmit}>
          <PromptInputBody>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
            <PromptInputTextarea
              className="min-h-[60px] text-base"
              onChange={(e) => onPromptChange(e.target.value)}
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
                onClick={onWebSearchToggle}
                variant={webSearch ? "default" : "ghost"}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
              <PromptInputModelSelect
                onValueChange={onModelChange}
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
                onClick={onStopStreaming}
                size="sm"
                type="button"
                variant="destructive"
              >
                <StopCircle className="size-3.5" />
                Stop
              </Button>
            ) : (
              <PromptInputSubmit disabled={!prompt.trim() || isDisabled}>
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
  );
}
