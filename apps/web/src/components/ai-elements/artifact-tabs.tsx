"use client";

import { PlusIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type ArtifactTab = {
  id: string;
  title: string;
  content: ReactNode;
  type?: string;
  metadata?: Record<string, unknown>;
};

export type ArtifactTabsProps = {
  tabs: ArtifactTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onTabAdd?: () => void;
  onPanelClose?: () => void;
  className?: string;
  showAddButton?: boolean;
  maxTabs?: number;
};

export function ArtifactTabs({
  tabs,
  activeTab,
  onTabChange,
  onTabClose,
  onTabAdd,
  onPanelClose,
  className,
  showAddButton = false,
  maxTabs = 10,
}: ArtifactTabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<string>(
    tabs[0]?.id || ""
  );

  const currentActiveTab = activeTab ?? internalActiveTab;

  const handleTabChange = (value: string) => {
    setInternalActiveTab(value);
    onTabChange?.(value);
  };

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onTabClose?.(tabId);

    // If closing the active tab, switch to another tab
    if (currentActiveTab === tabId && tabs.length > 1) {
      const currentIndex = tabs.findIndex((tab) => tab.id === tabId);
      const nextTab = tabs[currentIndex + 1] || tabs[currentIndex - 1];
      if (nextTab) {
        handleTabChange(nextTab.id);
      }
    }
  };

  const handleAddTab = () => {
    if (tabs.length >= maxTabs) {
      return;
    }
    onTabAdd?.();
  };

  if (tabs.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-4 p-8 text-center",
          className
        )}
      >
        <p className="text-muted-foreground text-sm">No artifacts yet</p>
        {showAddButton && (
          <Button
            onClick={handleAddTab}
            size="sm"
            type="button"
            variant="outline"
          >
            <PlusIcon className="mr-2 size-4" />
            Add Artifact
          </Button>
        )}
      </div>
    );
  }

  return (
    <Tabs
      className={cn("flex h-full flex-col", className)}
      onValueChange={handleTabChange}
      value={currentActiveTab}
    >
      <div className="flex items-center bg-muted/30 shadow-sm">
        <TabsList className="h-auto flex-1 justify-start rounded-none border-0 bg-transparent p-0">
          <div className="flex h-full items-center gap-0 overflow-x-auto">
            {tabs.map((tab) => (
              <div
                className="group relative flex items-center border-r"
                key={tab.id}
              >
                <TabsTrigger
                  className={cn(
                    "relative rounded-none border-transparent border-b-2 px-4 py-3 transition-colors hover:bg-muted/50 data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:shadow-none"
                  )}
                  value={tab.id}
                >
                  <span className="max-w-[150px] truncate font-medium text-sm">
                    {tab.title}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className={cn(
                            "ml-2 size-5 p-0 opacity-0 transition-opacity group-hover:opacity-100",
                            currentActiveTab === tab.id && "opacity-100"
                          )}
                          onClick={(e) => handleTabClose(e, tab.id)}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          <XIcon className="size-3" />
                          <span className="sr-only">Close tab</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Close artifact</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TabsTrigger>
              </div>
            ))}
          </div>
        </TabsList>

        <div className="flex shrink-0 items-center gap-1 px-2">
          {showAddButton && tabs.length < maxTabs && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="size-8 p-0"
                    onClick={handleAddTab}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <PlusIcon className="size-4" />
                    <span className="sr-only">Add new artifact</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add new artifact</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {onPanelClose && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="size-8 p-0"
                    onClick={onPanelClose}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <XIcon className="size-4" />
                    <span className="sr-only">Close artifacts panel</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Close panel</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {tabs.map((tab) => (
          <TabsContent className="size-full" key={tab.id} value={tab.id}>
            {tab.content}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
