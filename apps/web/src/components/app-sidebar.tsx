"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { usePaginatedQuery } from "convex/react";
import {
  Bookmark,
  Compass,
  Heart,
  Home,
  Lightbulb,
  Loader2,
  MessageCircle,
  PlusCircle,
  Sparkles,
  SquareTerminal,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavUser } from "@/components/nav-user";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type AppSidebarProps = Omit<
  React.ComponentProps<typeof Sidebar>,
  "children"
> & {
  className?: string;
};

const navigation = [
  { name: "Chats", href: "/chat" as const, icon: MessageCircle },
  { name: "Explore", href: "/explore" as const, icon: Compass },
  { name: "Saved", href: "/saved" as const, icon: Bookmark },
  { name: "Projects", href: "/projects" as const, icon: Home },
  { name: "Updates", href: "/updates" as const, icon: Lightbulb },
  { name: "Inspiration", href: "/inspiration" as const, icon: Heart },
  { name: "Create", href: "/create" as const, icon: PlusCircle },
];

const INITIAL_THREADS_LOAD = 20;
const LOAD_MORE_THREADS_COUNT = 20;

export function AppSidebar({ className, ...props }: AppSidebarProps) {
  const { state } = useSidebar();
  const pathname = usePathname();
  const collapsed = state === "collapsed";

  // Fetch user's threads
  const {
    results: threads,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.threads.listThreads,
    {},
    { initialNumItems: INITIAL_THREADS_LOAD }
  );

  return (
    <Sidebar className={className} {...props}>
      <SidebarContent>
        <SidebarHeader className="flex items-center gap-3 border-b px-6 py-5">
          <Sparkles className="size-6 shrink-0 text-primary" />
          {!collapsed && <span className="font-bold text-xl">furnish.</span>}
        </SidebarHeader>

        <div className="flex flex-col gap-1 px-3 py-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href);
            const href = item.href;
            return (
              <Link href={href} key={item.name}>
                <Button
                  className={cn(
                    "w-full justify-start gap-3 font-normal",
                    isActive && "bg-accent font-medium",
                    collapsed && "justify-center"
                  )}
                  size="default"
                  variant={isActive ? "secondary" : "ghost"}
                >
                  <Icon className="size-5 shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Button>
              </Link>
            );
          })}
        </div>

        {!collapsed && (
          <>
            <div className="border-t">
              <div className="block px-3 py-4">
                <Link href="/chat">
                  <Button
                    className="w-full gap-2"
                    size="default"
                    variant="outline"
                  >
                    <PlusCircle className="size-4" />
                    New chat
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex-1 border-t">
              <div className="px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Recent Chats
              </div>
              <ScrollArea className="h-full px-3">
                <div className="flex flex-col gap-0.5 pb-4">
                  {threads === undefined && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {threads?.length === 0 && (
                    <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No chats yet. Start a new conversation!
                    </div>
                  )}
                  {threads && threads.length > 0 && (
                    <>
                      {threads.map((thread) => {
                        const threadId = thread._id;
                        const isActive = pathname === `/chat/${threadId}`;
                        const displayTitle =
                          thread.title || "Untitled conversation";
                        return (
                          <Link href={`/chat/${threadId}`} key={threadId}>
                            <Button
                              className={cn(
                                "w-full cursor-pointer justify-start truncate text-left font-normal",
                                isActive && "bg-accent font-medium"
                              )}
                              size="sm"
                              type="button"
                              variant={isActive ? "secondary" : "ghost"}
                            >
                              <SquareTerminal className="mr-2 size-4 shrink-0" />
                              <span className="truncate">{displayTitle}</span>
                            </Button>
                          </Link>
                        );
                      })}
                      {status === "CanLoadMore" && (
                        <Button
                          className="mt-2 w-full"
                          onClick={() => loadMore(LOAD_MORE_THREADS_COUNT)}
                          size="sm"
                          variant="outline"
                        >
                          Load more
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
        <SidebarFooter className="border-t">
          <NavUser />
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}
