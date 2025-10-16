"use client";

import {
  CopyIcon,
  DownloadIcon,
  RefreshCwIcon,
  ShareIcon,
  SparklesIcon,
} from "lucide-react";
import { useState } from "react";
import {
  Artifact,
  ArtifactAction,
  ArtifactActions,
  ArtifactContent as ArtifactContentContainer,
  ArtifactDescription,
  ArtifactHeader,
  ArtifactTitle,
} from "@/components/ai-elements/artifact";

type ArtifactContentProps = {
  description: string;
  title?: string;
  onRegenerate?: () => void;
  onShare?: () => void;
  onExport?: () => void;
};

const DESIGN_ID_SLICE_LENGTH = 6;
const COPY_FEEDBACK_DURATION = 2000;

export function ArtifactContent({
  description,
  title = "Design",
  onRegenerate,
  onShare,
  onExport,
}: ArtifactContentProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(description).catch(() => {
      // Handle error silently
    });
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
  };

  return (
    <Artifact className="flex size-full">
      <ArtifactHeader>
        <div className="flex flex-col gap-1">
          <ArtifactTitle>{title}</ArtifactTitle>
          <ArtifactDescription className="text-xs">
            Design specification and details
          </ArtifactDescription>
        </div>
        <ArtifactActions>
          <ArtifactAction
            icon={CopyIcon}
            onClick={handleCopy}
            tooltip={copied ? "Copied!" : "Copy description"}
          />
          {onRegenerate && (
            <ArtifactAction
              icon={RefreshCwIcon}
              onClick={onRegenerate}
              tooltip="Regenerate design"
            />
          )}
          {onExport && (
            <ArtifactAction
              icon={DownloadIcon}
              onClick={onExport}
              tooltip="Export design"
            />
          )}
          {onShare && (
            <ArtifactAction
              icon={ShareIcon}
              onClick={onShare}
              tooltip="Share design"
            />
          )}
          <ArtifactAction icon={SparklesIcon} tooltip="AI enhancement" />
        </ArtifactActions>
      </ArtifactHeader>
      <ArtifactContentContainer>
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-base">Description</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </ArtifactContentContainer>
    </Artifact>
  );
}

export function formatDesignTitle(designId: string): string {
  return `Design ${designId.slice(-DESIGN_ID_SLICE_LENGTH)}`;
}
