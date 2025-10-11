"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { useAction } from "convex/react";
import { RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThreadMessage = {
  _id: string;
  role: "user" | "assistant" | "system";
  content: string;
  _creationTime: number;
};

export default function ChatPage({ params }: { params: { threadId: string } }) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getThreadMessages = useAction(
    api.interiorDesignAgent.getThreadMessages
  );
  const continueConsultation = useAction(
    api.interiorDesignAgent.continueDesignConsultation
  );

  useEffect(() => {
    const loadMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const threadMessages = await getThreadMessages({
          threadId: params.threadId,
        });
        setMessages(threadMessages as ThreadMessage[]);
      } catch {
        // Handle error silently
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [params.threadId, getThreadMessages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (messages && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      if (!message.text?.trim() || isSubmitting) {
        return;
      }

      const prompt = message.text;
      setInput("");
      setIsSubmitting(true);

      try {
        await continueConsultation({ threadId: params.threadId, prompt });
        const updatedMessages = await getThreadMessages({
          threadId: params.threadId,
        });
        setMessages(updatedMessages as ThreadMessage[]);
      } catch {
        setInput(prompt);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, continueConsultation, params.threadId, getThreadMessages]
  );

  return (
    <div className="flex h-full flex-col bg-muted/30">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-6">
          <Sparkles className="size-6 text-primary" />
          <div className="flex-1">
            <h1 className="font-semibold text-lg">
              Interior Design Consultant
            </h1>
            <p className="text-muted-foreground text-xs">
              Your AI-powered design expert
            </p>
          </div>
          <Link href="/">
            <Button className="gap-1.5" size="sm" variant="outline">
              <RotateCcw className="size-3.5" />
              New Consultation
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex h-full flex-col">
        <Conversation className="flex-1">
          <ConversationContent>
            {isLoadingMessages && (
              <div className="flex size-full flex-col items-center justify-center gap-4 p-8 text-center">
                <Sparkles className="size-12 text-muted-foreground" />
                <div className="space-y-1">
                  <h3 className="font-medium text-sm">
                    Loading conversation...
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Your design expert is getting ready
                  </p>
                </div>
              </div>
            )}

            {!isLoadingMessages && messages.length === 0 && (
              <div className="flex size-full flex-col items-center justify-center gap-4 p-8 text-center">
                <Sparkles className="size-12 text-muted-foreground" />
                <div className="space-y-1">
                  <h3 className="font-medium text-sm">
                    Start your consultation
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Ask a question to begin
                  </p>
                </div>
              </div>
            )}

            {!isLoadingMessages &&
              messages.length > 0 &&
              messages.map((msg) => (
                <Message from={msg.role} key={msg._id}>
                  <MessageContent>
                    <Response
                      className={cn(msg.role === "user" && "text-foreground")}
                    >
                      {msg.content}
                    </Response>
                  </MessageContent>
                </Message>
              ))}

            {isSubmitting && <Loader />}
            <div ref={messagesEndRef} />
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t bg-background p-4">
          <div className="mx-auto max-w-3xl">
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputBody>
                <PromptInputTextarea
                  disabled={isSubmitting}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about styles, colors, furniture, budget, or materials..."
                  rows={2}
                  value={input}
                />
              </PromptInputBody>
              <PromptInputToolbar>
                <div className="flex-1" />
                <PromptInputSubmit disabled={!input.trim() || isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send"}
                </PromptInputSubmit>
              </PromptInputToolbar>
            </PromptInput>
          </div>
        </div>
      </div>
    </div>
  );
}
