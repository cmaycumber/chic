"use client";

import { useUIMessages } from "@convex-dev/agent/react";
import { api } from "@furnish/backend/convex/_generated/api";
import { Authenticated } from "convex/react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { MessageItem } from "@/components/chat/message-item";
import { Button } from "@/components/ui/button";

type ChatMessagesProps = {
  threadId: string;
};

function ChatMessagesContent({ threadId }: { threadId: string }) {
  // Load messages with streaming support
  const {
    results: messages,
    status,
    loadMore,
  } = useUIMessages(
    api.messages.listThreadMessages,
    { threadId },
    { initialNumItems: 10, stream: true }
  );

  return (
    <div className="mx-auto max-w-3xl">
      {messages && messages.length > 0 && (
        <>
          {status === "CanLoadMore" && (
            <div className="flex justify-center py-6">
              <Button onClick={() => loadMore(10)} size="sm" variant="ghost">
                Load more
              </Button>
            </div>
          )}
          {messages.map((m) => (
            <MessageItem
              isLastMessage={m === messages.at(-1)}
              isStreaming={m.status === "streaming"}
              key={m.key}
              message={m}
            />
          ))}
        </>
      )}

      <div className="pb-12" />
    </div>
  );
}

export function ChatMessages({ threadId }: ChatMessagesProps) {
  return (
    <Conversation className="mb-[-40px] flex-1" initial="instant">
      <ConversationContent className="px-6 py-6">
        <Authenticated>
          <ChatMessagesContent threadId={threadId} />
        </Authenticated>
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
