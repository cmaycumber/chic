"use client";

import { PlusIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      <div className="flex items-center border-b bg-background">
        <TabsList className="h-auto flex-1 justify-start rounded-none border-0 bg-transparent p-0">
          <div className="flex h-full items-center gap-0 overflow-x-auto">
            {tabs.map((tab) => (
              <div className="group relative flex items-center" key={tab.id}>
                <TabsTrigger
                  className={cn(
                    "relative rounded-none border-transparent border-b-2 py-3 pr-8 pl-4 transition-colors data-[state=active]:border-foreground data-[state=active]:bg-transparent"
                  )}
                  value={tab.id}
                >
                  <span className="max-w-[150px] truncate text-sm">
                    {tab.title}
                  </span>
                </TabsTrigger>
                <button
                  className={cn(
                    "-translate-y-1/2 absolute top-1/2 right-2 z-10 inline-flex size-4 items-center justify-center rounded p-0 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-70",
                    currentActiveTab === tab.id && "opacity-70"
                  )}
                  onClick={(e) => handleTabClose(e, tab.id)}
                  type="button"
                >
                  <XIcon className="size-3" />
                  <span className="sr-only">Close tab</span>
                </button>
              </div>
            ))}
          </div>
        </TabsList>

        <div className="flex shrink-0 items-center gap-1 px-2">
          {showAddButton && tabs.length < maxTabs && (
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
          )}
          {onPanelClose && (
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
