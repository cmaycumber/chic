"use client";

import { ArrowUp, StopCircle } from "lucide-react";
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
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";

type ChatInputProps = {
  prompt: string;
  onPromptChange: (value: string) => void;
  model: string;
  onModelChange: (value: string) => void;
  onSubmit: (message: PromptInputMessage, event: React.FormEvent) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  isDisabled: boolean;
};

export function ChatInput({
  prompt,
  onPromptChange,
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
              className="min-h-[56px] text-base"
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="Ask about your space..."
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
      </div>
    </div>
  );
}
