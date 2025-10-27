"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { Authenticated, useMutation, useQuery } from "convex/react";
import { PanelRight } from "lucide-react";
import { use, useState } from "react";
import type { ArtifactTab } from "@/components/chat/artifact-tabs";
import { ArtifactsPanel } from "@/components/chat/artifacts-panel";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInputWrapper } from "@/components/chat/chat-input-wrapper";
import { ChatMessages } from "@/components/chat/chat-messages";
import { DesignArtifact } from "@/components/chat/design-artifact";
import { Button } from "@/components/ui/button";

const DESIGN_ID_SLICE_LENGTH = 6;

function formatDesignTitle(designId: string): string {
  return `Design ${designId.slice(-DESIGN_ID_SLICE_LENGTH)}`;
}

export default function ChatPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = use(params);

  const sendMessage = useMutation(api.messages.initiateAsyncStreaming);

  // Fetch artifacts for this thread
  const artifactsData = useQuery(api.artifacts.listByThreadIdWithDetails, {
    threadId,
  });

  const [isArtifactsPanelOpen, setIsArtifactsPanelOpen] = useState(false);

  // Map artifacts data to ArtifactTab format
  const artifacts: ArtifactTab[] =
    artifactsData?.map(
      (artifact: NonNullable<typeof artifactsData>[number]) => ({
        id: artifact._id,
        title: formatDesignTitle(artifact.design._id),
        type: artifact.type,
        content: (
          <DesignArtifact
            design={artifact.design}
            onExport={() => {
              // Download as JSON
              const dataStr = JSON.stringify(artifact.design, null, 2);
              const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(
                dataStr
              )}`;
              const exportFileDefaultName = `${formatDesignTitle(artifact.design._id)}.json`;
              const linkElement = document.createElement("a");
              linkElement.setAttribute("href", dataUri);
              linkElement.setAttribute("download", exportFileDefaultName);
              linkElement.click();
            }}
            onRegenerate={() => {
              // Send a message to regenerate the design
              sendMessage({
                threadId,
                prompt: `Regenerate the design: ${artifact.design.description}`,
              }).catch(() => {
                // Error handled silently
              });
            }}
          />
        ),
      })
    ) ?? [];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Chat Section */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-r">
        <ChatHeader
          extra={
            <Button
              className="gap-2"
              onClick={() => setIsArtifactsPanelOpen(!isArtifactsPanelOpen)}
              size="sm"
              variant={isArtifactsPanelOpen ? "secondary" : "ghost"}
            >
              <PanelRight className="size-4" />
              <span className="text-sm">
                {isArtifactsPanelOpen ? "Hide Designs" : "Show Designs"}
              </span>
            </Button>
          }
        />

        <ChatMessages threadId={threadId} />

        <Authenticated>
          <ChatInputWrapper threadId={threadId} />
        </Authenticated>
      </div>

      {/* Designs Panel */}
      {isArtifactsPanelOpen && (
        <ArtifactsPanel
          artifacts={artifacts}
          onClose={() => setIsArtifactsPanelOpen(false)}
        />
      )}
    </div>
  );
}
