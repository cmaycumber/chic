"use client";

import { useChat } from "@ai-sdk/react";
import { ChevronLeftIcon, CopyIcon, DownloadIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  Artifact,
  ArtifactAction,
  ArtifactActions,
  ArtifactClose,
  ArtifactContent,
  ArtifactHeader,
  ArtifactTitle,
} from "@/components/ai-elements/artifact";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { ChatContent } from "@/components/chat-content";

const models = [
  {
    name: "GPT-4o",
    value: "gpt-4o",
  },
  {
    name: "GPT-4o Mini",
    value: "gpt-4o-mini",
  },
  {
    name: "GPT-4 Turbo",
    value: "gpt-4-turbo",
  },
];

export default function Home() {
  const [input, setInput] = useState("");
  const [model, setModel] = useState<string>(models[0].value);
  const [artifactImage, setArtifactImage] = useState<string | null>(null);
  const [isArtifactOpen, setIsArtifactOpen] = useState(true);

  const { messages, sendMessage, status } = useChat();

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    // Check if any files are images to show in artifact panel
    const imageFile = message.files?.find((file) =>
      file.mediaType?.startsWith("image/")
    );

    if (imageFile?.url) {
      setArtifactImage(imageFile.url);
      setIsArtifactOpen(true);
    }

    // Use the sendMessage function from useChat
    sendMessage({
      text: message.text || "Sent with attachments",
      files: message.files,
    });

    setInput("");
  };

  const handleCopyImage = () => {
    if (artifactImage) {
      // Copy image URL to clipboard
      navigator.clipboard.writeText(artifactImage);
    }
  };

  const handleDownloadImage = () => {
    if (artifactImage) {
      const link = document.createElement("a");
      link.href = artifactImage;
      link.download = "design-image.png";
      link.click();
    }
  };

  return (
    <div className="relative flex size-full flex-col bg-muted/30">
      {artifactImage && isArtifactOpen ? (
        <PanelGroup direction="horizontal">
          <Panel defaultSize={65} minSize={25}>
            <div className="flex size-full items-center justify-center">
              <ChatContent
                centered
                input={input}
                messages={messages}
                model={model}
                models={models}
                onInputChange={setInput}
                onModelChange={setModel}
                onSubmit={handleSubmit}
                status={status}
              />
            </div>
          </Panel>
          <PanelResizeHandle className="group relative w-px bg-border transition-colors hover:bg-primary data-[resize-handle-active]:bg-primary">
            <div className="-left-1 absolute inset-y-0 w-3" />
            <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 size-6 rounded-md bg-border opacity-0 transition-opacity group-hover:opacity-100 group-data-[resize-handle-active]:opacity-100">
              <div className="flex size-full items-center justify-center">
                <div className="h-4 w-0.5 bg-muted-foreground" />
                <div className="h-4 w-0.5 bg-muted-foreground" />
              </div>
            </div>
          </PanelResizeHandle>
          <Panel defaultSize={35} maxSize={75} minSize={25}>
            <Artifact className="fade-in slide-in-from-right-10 h-full animate-in duration-500">
              <ArtifactHeader>
                <ArtifactTitle>Design Reference</ArtifactTitle>
                <ArtifactActions>
                  <ArtifactAction
                    onClick={handleCopyImage}
                    tooltip="Copy image URL"
                  >
                    <CopyIcon className="size-4" />
                  </ArtifactAction>
                  <ArtifactAction
                    onClick={handleDownloadImage}
                    tooltip="Download image"
                  >
                    <DownloadIcon className="size-4" />
                  </ArtifactAction>
                  <ArtifactClose onClick={() => setIsArtifactOpen(false)} />
                </ArtifactActions>
              </ArtifactHeader>
              <ArtifactContent className="flex items-center justify-center bg-muted/20 p-0">
                <div className="relative size-full p-4">
                  <Image
                    alt="Design reference"
                    className="rounded-lg object-contain"
                    fill
                    src={artifactImage}
                    unoptimized
                  />
                </div>
              </ArtifactContent>
            </Artifact>
          </Panel>
        </PanelGroup>
      ) : (
        <div className="mx-auto flex size-full max-w-3xl">
          <ChatContent
            centered
            input={input}
            messages={messages}
            model={model}
            models={models}
            onInputChange={setInput}
            onModelChange={setModel}
            onSubmit={handleSubmit}
            status={status}
          />
        </div>
      )}

      {/* Reopen Artifact Button */}
      {artifactImage && !isArtifactOpen && (
        <button
          className="fade-in slide-in-from-right-10 fixed top-6 right-6 z-10 flex animate-in items-center gap-2 rounded-lg border bg-background px-4 py-2 shadow-lg transition-all hover:bg-muted/50"
          onClick={() => setIsArtifactOpen(true)}
          type="button"
        >
          <ChevronLeftIcon className="size-4" />
          <span className="font-medium text-sm">Show Design</span>
        </button>
      )}
    </div>
  );
}
