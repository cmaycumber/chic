"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { useAction, useMutation } from "convex/react";
import { ArrowUp, Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
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
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { useSession } from "@/lib/auth-client";

// Helper function to convert data URL to ArrayBuffer
async function dataUrlToArrayBuffer(dataUrl: string): Promise<ArrayBuffer> {
  const response = await fetch(dataUrl);
  return response.arrayBuffer();
}

export default function ChatHomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [input, setInput] = useState("");
  const createThread = useMutation(api.threads.createNewThread);
  const uploadFile = useAction(api.files.uploadFile);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: File upload logic requires sequential steps with error handling
    async function submitWithFiles(
      message: PromptInputMessage,
      event: React.FormEvent<HTMLFormElement>
    ) {
      event.preventDefault();
      const hasText = Boolean(message.text?.trim());
      const hasAttachments = Boolean(message.files?.length);

      if (!(hasText || hasAttachments) || isSubmitting) {
        return;
      }

      setIsSubmitting(true);
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

        const threadId = await createThread({
          initialMessage: {
            role: "user",
            content: message.text || "Sent with attachments",
          },
          fileIds: fileIds.length > 0 ? fileIds : undefined,
        });
        router.push(`/chat/${threadId}`);
      } catch {
        // Error handled silently - could add toast notification
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, createThread, uploadFile, router]
  );

  const userName = session?.user?.name || "there";

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b px-6">
          <h1 className="font-semibold text-lg">New chat</h1>
        </div>

        {/* Chat Area */}
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          <div className="w-full max-w-2xl space-y-8">
            {/* Greeting */}
            <div className="space-y-4">
              <h2 className="font-bold text-3xl tracking-tight">
                Hi {userName}, I'm your AI interior designer. How can I help
                transform your space?
              </h2>
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                  <span className="font-semibold text-sm">F</span>
                </div>
                <p className="text-muted-foreground">
                  As your AI interior designer, I can help you with room
                  layouts, color schemes, furniture recommendations, style
                  guidance, and complete room transformations. Upload photos or
                  describe your vision—let's create something beautiful
                  together.
                </p>
              </div>
            </div>

            {/* Design Suggestions */}
            <Suggestions className="justify-center">
              <Suggestion
                onClick={handleSuggestionClick}
                suggestion="Help me design a modern minimalist living room"
              />
              <Suggestion
                onClick={handleSuggestionClick}
                suggestion="I need ideas for a cozy bedroom with warm tones"
              />
              <Suggestion
                onClick={handleSuggestionClick}
                suggestion="Can you create a Scandinavian-style kitchen design?"
              />
              <Suggestion
                onClick={handleSuggestionClick}
                suggestion="I want to redesign my home office - where do I start?"
              />
            </Suggestions>
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-background p-6">
          <div className="mx-auto max-w-2xl">
            <PromptInput
              accept="image/*"
              globalDrop
              multiple
              onSubmit={handleSubmit}
            >
              <PromptInputBody>
                <PromptInputAttachments>
                  {(attachment) => <PromptInputAttachment data={attachment} />}
                </PromptInputAttachments>
                <PromptInputTextarea
                  className="min-h-[60px]"
                  disabled={isSubmitting}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything about your space, or drop an image..."
                  value={input}
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
                <button
                  className="rounded-full p-2 hover:bg-accent"
                  disabled={isSubmitting}
                  type="button"
                >
                  <Mic className="size-5 text-muted-foreground" />
                </button>
                <div className="flex-1" />
                <PromptInputSubmit disabled={isSubmitting}>
                  <ArrowUp className="size-5" />
                </PromptInputSubmit>
              </PromptInputToolbar>
            </PromptInput>
            <div className="mt-2 text-center text-muted-foreground/80 text-xs">
              Your AI interior designer provides suggestions based on design
              principles. Always verify measurements and check product details.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
