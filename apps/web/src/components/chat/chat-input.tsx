"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { AlertCircle, ArrowUp, StopCircle } from "lucide-react";
import type React from "react";
import { useState } from "react";
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
import { PromptHelpers } from "@/components/chat/prompt-helpers";
import { CreditPurchaseModal } from "@/components/credit-purchase-modal";
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
  const credits = useQuery(api.credits.getCredits);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const isOutOfCredits = credits !== undefined && credits <= 0;

  return (
    <div className="z-10 shrink-0 px-3 pb-3 sm:px-4 sm:pb-4 md:px-6 md:pb-6">
      <div className="mx-auto max-w-3xl">
        <PromptInput globalDrop multiple onSubmit={onSubmit}>
          <PromptInputBody>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
            {isOutOfCredits && (
              <div className="mx-3 mt-3 mb-1 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 font-medium text-amber-800 text-xs">
                <AlertCircle className="size-4 shrink-0 text-amber-600" />
                <span>You have 0 credits remaining.</span>
                <Button
                  className="h-auto p-0 font-bold text-amber-700 underline"
                  onClick={() => setShowCreditModal(true)}
                  size="sm"
                  variant="link"
                >
                  Get more credits
                </Button>
              </div>
            )}
            <PromptInputTextarea
              className="min-h-[52px] text-sm sm:min-h-[56px] sm:text-base"
              disabled={isOutOfCredits}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder={
                isOutOfCredits
                  ? "Recharge credits to continue..."
                  : "Ask about your space..."
              }
              rows={2}
              value={prompt}
            />
          </PromptInputBody>

          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger disabled={isOutOfCredits} />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
              <PromptHelpers onSelectPrompt={onPromptChange} />
            </PromptInputTools>

            {isStreaming ? (
              <Button
                className="gap-1 text-xs sm:gap-1.5 sm:text-sm"
                onClick={onStopStreaming}
                size="sm"
                type="button"
                variant="destructive"
              >
                <StopCircle className="size-3 sm:size-3.5" />
                Stop
              </Button>
            ) : (
              <PromptInputSubmit
                disabled={!prompt.trim() || isDisabled || isOutOfCredits}
              >
                <ArrowUp className="size-4" />
              </PromptInputSubmit>
            )}
          </PromptInputToolbar>
        </PromptInput>
      </div>
      <CreditPurchaseModal
        onOpenChange={setShowCreditModal}
        open={showCreditModal}
      />
    </div>
  );
}
