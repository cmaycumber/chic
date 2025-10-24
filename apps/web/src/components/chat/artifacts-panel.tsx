"use client";

import { XIcon } from "lucide-react";
import React, { useCallback, useState } from "react";
import type { ArtifactTab } from "@/components/chat/artifact-tabs";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type ViewMode = "room" | "products";

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
  const [viewMode, setViewMode] = useState<ViewMode>("room");

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

  const getArtifactCountLabel = () => {
    if (artifacts.length === 0) {
      return "No designs";
    }
    if (artifacts.length === 1) {
      return "1 design";
    }
    return `${artifacts.length} designs`;
  };

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
      className="relative flex h-full shrink-0 flex-col bg-background"
      style={{ width: `${panelWidth}px` }}
    >
      {/* Resize handle */}
      <button
        aria-label="Resize designs panel"
        className={cn(
          "absolute top-0 left-0 z-50 h-full w-1 cursor-col-resize hover:bg-primary/20",
          isResizing && "bg-primary/20"
        )}
        onMouseDown={handleMouseDown}
        type="button"
      />

      {/* Designs Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-sm">Designs</h2>
          <span className="text-muted-foreground text-xs">
            {getArtifactCountLabel()}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {artifacts.length > 0 && (
            <Tabs
              className="w-auto"
              onValueChange={(value) => setViewMode(value as ViewMode)}
              value={viewMode}
            >
              <TabsList className="h-8">
                <TabsTrigger className="text-xs" value="room">
                  Room
                </TabsTrigger>
                <TabsTrigger className="text-xs" value="products">
                  Products
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <Button
            className="size-8 p-0 transition-all hover:bg-destructive/10 hover:text-destructive"
            onClick={onClose}
            size="sm"
            type="button"
            variant="ghost"
          >
            <XIcon className="size-4" />
            <span className="sr-only">Close designs panel</span>
          </Button>
        </div>
      </header>

      {/* Designs Content */}
      <div className="flex-1 overflow-auto">
        {artifacts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="text-muted-foreground text-sm">No designs yet</p>
            <p className="text-muted-foreground/60 text-xs">
              Designs will appear here as you create them
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4">
            {artifacts.map((artifact) => (
              <div key={artifact.id}>{artifact.content}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
