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
        <p className="text-muted-foreground text-sm">No designs yet</p>
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
          <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground/20 flex h-full items-center gap-0 overflow-x-auto">
            {tabs.map((tab) => (
              <div className="group relative flex items-center" key={tab.id}>
                <TabsTrigger
                  className={cn(
                    "relative flex items-center gap-2 rounded-none border-transparent border-b-2 px-4 py-3 text-sm transition-colors",
                    "hover:bg-muted/50 hover:text-foreground",
                    "data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground",
                    "data-[state=inactive]:text-muted-foreground"
                  )}
                  value={tab.id}
                >
                  <span className="max-w-[150px] truncate">{tab.title}</span>
                  {onTabClose && (
                    <button
                      className={cn(
                        "ml-1 inline-flex size-4 shrink-0 items-center justify-center rounded-sm transition-all duration-200",
                        "hover:bg-muted-foreground/20 hover:text-foreground",
                        "opacity-0 group-hover:opacity-100",
                        currentActiveTab === tab.id && "opacity-100"
                      )}
                      onClick={(e) => handleTabClose(e, tab.id)}
                      type="button"
                    >
                      <XIcon className="size-3" />
                      <span className="sr-only">Close {tab.title}</span>
                    </button>
                  )}
                </TabsTrigger>
              </div>
            ))}
          </div>
        </TabsList>

        {showAddButton && tabs.length < maxTabs && (
          <div className="flex shrink-0 items-center border-l px-2 py-1.5">
            <Button
              className="size-8 p-0 transition-all hover:bg-primary/10 hover:text-primary"
              onClick={handleAddTab}
              size="sm"
              type="button"
              variant="ghost"
            >
              <PlusIcon className="size-4" />
              <span className="sr-only">Add new artifact</span>
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden bg-background">
        {tabs.map((tab) => (
          <TabsContent
            className="m-0 size-full p-0 focus-visible:outline-none focus-visible:ring-0"
            key={tab.id}
            value={tab.id}
          >
            {tab.content}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
