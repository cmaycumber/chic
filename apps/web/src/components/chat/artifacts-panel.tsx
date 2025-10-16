"use client";

import React, { useCallback, useState } from "react";
import type { ArtifactTab } from "@/components/ai-elements/artifact-tabs";
import { ArtifactTabs } from "@/components/ai-elements/artifact-tabs";
import { cn } from "@/lib/utils";

const MIN_PANEL_WIDTH = 300;
const MAX_PANEL_WIDTH = 800;
const DEFAULT_PANEL_WIDTH = 500;

type ArtifactsPanelProps = {
  artifacts: ArtifactTab[];
  onClose: () => void;
};

export function ArtifactsPanel({ artifacts, onClose }: ArtifactsPanelProps) {
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) {
        return;
      }

      const newWidth = window.innerWidth - e.clientX;
      // Clamp width between MIN and MAX
      const clampedWidth = Math.min(
        Math.max(newWidth, MIN_PANEL_WIDTH),
        MAX_PANEL_WIDTH
      );
      setPanelWidth(clampedWidth);
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add/remove mouse event listeners for resizing
  React.useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      className="relative h-full shrink-0 border-l"
      style={{ width: `${panelWidth}px` }}
    >
      {/* Resize handle */}
      <button
        aria-label="Resize artifacts panel"
        className={cn(
          "absolute top-0 left-0 h-full w-1 cursor-col-resize hover:bg-primary/20",
          isResizing && "bg-primary/20"
        )}
        onMouseDown={handleMouseDown}
        type="button"
      />
      <ArtifactTabs onPanelClose={onClose} tabs={artifacts} />
    </div>
  );
}
