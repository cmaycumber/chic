"use client";

import { Menu } from "lucide-react";
import { useMobileSidebar } from "@/components/layout-content";
import { Button } from "@/components/ui/button";

type ChatHeaderProps = {
  isStreaming?: boolean;
  extra?: React.ReactNode;
};

export function ChatHeader({ extra }: ChatHeaderProps) {
  const { setIsOpen, isMobile } = useMobileSidebar();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-3 backdrop-blur supports-backdrop-filter:bg-background/60 sm:px-4 md:px-6">
      <div className="flex items-center gap-2">
        {isMobile && (
          <Button
            className="size-8 p-0"
            onClick={() => setIsOpen(true)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <Menu className="size-4" />
            <span className="sr-only">Open sidebar</span>
          </Button>
        )}
      </div>

      {extra}
    </header>
  );
}
