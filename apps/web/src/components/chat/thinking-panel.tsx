"use client";

import { BrainIcon, XIcon } from "lucide-react";
import React, { useCallback, useState } from "react";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MIN_PANEL_WIDTH = 300;
const MAX_PANEL_WIDTH = 800;
const DEFAULT_PANEL_WIDTH = 500;

export type ThinkingStep = {
  id: string;
  label: string;
  description?: string;
  status?: "complete" | "active" | "pending";
};

type ThinkingPanelProps = {
  steps: ThinkingStep[];
  onClose: () => void;
};

export function ThinkingPanel({ steps, onClose }: ThinkingPanelProps) {
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

  const getStepCountLabel = () => {
    if (steps.length === 0) {
      return "No thinking steps";
    }
    if (steps.length === 1) {
      return "1 step";
    }
    return `${steps.length} steps`;
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
      {/* Resize Handle */}
      <button
        className={cn(
          "absolute top-0 left-0 h-full w-1 cursor-col-resize hover:bg-primary/20",
          "transition-colors",
          isResizing && "bg-primary/30"
        )}
        onMouseDown={handleMouseDown}
        type="button"
      />

      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-sm">Agent Thinking</h2>
          <span className="text-muted-foreground text-xs">
            {getStepCountLabel()}
          </span>
        </div>
        <Button
          className="size-8 p-0 transition-all hover:bg-destructive/10 hover:text-destructive"
          onClick={onClose}
          size="sm"
          type="button"
          variant="ghost"
        >
          <XIcon className="size-4" />
          <span className="sr-only">Close thinking panel</span>
        </Button>
      </header>

      {/* Thinking Content */}
      <div className="flex-1 overflow-auto">
        {steps.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <BrainIcon className="size-8 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">No thinking yet</p>
            <p className="text-muted-foreground/60 text-xs">
              The agent's reasoning steps will appear here
            </p>
          </div>
        ) : (
          <div className="p-4">
            <ChainOfThought defaultOpen={true}>
              <ChainOfThoughtHeader>Reasoning Process</ChainOfThoughtHeader>
              <ChainOfThoughtContent>
                {steps.map((step) => (
                  <ChainOfThoughtStep
                    description={step.description}
                    key={step.id}
                    label={step.label}
                    status={step.status}
                  />
                ))}
              </ChainOfThoughtContent>
            </ChainOfThought>
          </div>
        )}
      </div>
    </div>
  );
}
