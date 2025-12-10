"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  AlertCircle,
  ArrowUp,
  CameraIcon,
  ImageIcon,
  StopCircle,
} from "lucide-react";
import type React from "react";
import { useCallback, useState } from "react";
import { CameraCapture } from "@/components/ai-elements/camera-capture";
import {
  PromptInput,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  usePromptInputAttachments,
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

/**
 * Inner component that can access the PromptInput attachments context
 * Handles camera capture and file upload with prominent buttons
 */
function ChatInputActions({ isOutOfCredits }: { isOutOfCredits: boolean }) {
  const attachments = usePromptInputAttachments();
  const [showCamera, setShowCamera] = useState(false);

  const handleCameraCapture = useCallback(
    (file: File) => {
      attachments.add([file]);
    },
    [attachments]
  );

  return (
    <>
      {/* Take Photo Button */}
      <PromptInputButton
        disabled={isOutOfCredits}
        onClick={() => setShowCamera(true)}
      >
        <CameraIcon className="size-4" />
        <span className="hidden sm:inline">Take Photo</span>
      </PromptInputButton>

      {/* Upload Photo Button */}
      <PromptInputButton
        disabled={isOutOfCredits}
        onClick={() => attachments.openFileDialog()}
      >
        <ImageIcon className="size-4" />
        <span className="hidden sm:inline">Upload</span>
      </PromptInputButton>

      <CameraCapture
        onCapture={handleCameraCapture}
        onOpenChange={setShowCamera}
        open={showCamera}
      />
    </>
  );
}

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
              <ChatInputActions isOutOfCredits={isOutOfCredits} />
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
