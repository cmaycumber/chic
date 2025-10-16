"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { useAction, useMutation, usePaginatedQuery } from "convex/react";
import {
  Check,
  Loader2,
  MoreHorizontal,
  Pencil,
  PlusCircle,
  Sparkles,
  SquareTerminal,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { NavUser } from "@/components/nav-user";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type AppSidebarProps = Omit<
  React.ComponentProps<typeof Sidebar>,
  "children"
> & {
  className?: string;
};

const INITIAL_THREADS_LOAD = 20;
const LOAD_MORE_THREADS_COUNT = 20;

export function AppSidebar({ className, ...props }: AppSidebarProps) {
  const { state } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = state === "collapsed";

  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [deleteThreadId, setDeleteThreadId] = useState<string | null>(null);

  const updateThreadTitle = useMutation(api.threads.updateThreadTitleManually);
  const deleteThreadAction = useAction(api.threads.deleteThread);

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

  const handleStartEdit = (threadId: string, currentTitle: string) => {
    setEditingThreadId(threadId);
    setEditingTitle(currentTitle || "Untitled conversation");
  };

  const handleCancelEdit = () => {
    setEditingThreadId(null);
    setEditingTitle("");
  };

  const handleSaveEdit = async (threadId: string) => {
    if (editingTitle.trim()) {
      await updateThreadTitle({ threadId, title: editingTitle.trim() });
    }
    setEditingThreadId(null);
    setEditingTitle("");
  };

  const handleDeleteThread = async (threadId: string) => {
    await deleteThreadAction({ threadId });
    setDeleteThreadId(null);
    if (pathname === `/chat/${threadId}`) {
      router.push("/chat");
    }
  };

  return (
    <Sidebar className={className} {...props}>
      <SidebarContent>
        <SidebarHeader
          className={cn(
            "flex items-center gap-2.5 py-2",
            collapsed ? "justify-center px-3" : "px-6"
          )}
        >
          <div className="flex justify-items-start gap-2.5">
            <Sparkles className="size-5 shrink-0 text-foreground" />
            <span className="font-medium text-base">furnish</span>
          </div>
        </SidebarHeader>

        <div className={cn("py-4", collapsed ? "px-3" : "px-4")}>
          {collapsed ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/chat">
                    <Button
                      className="w-full"
                      size="icon"
                      type="button"
                      variant="default"
                    >
                      <PlusCircle className="size-4" />
                      <span className="sr-only">New Chat</span>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>New Chat</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Link href="/chat">
              <Button
                className="w-full gap-2 font-medium"
                size="default"
                variant="default"
              >
                <PlusCircle className="size-4" />
                New Chat
              </Button>
            </Link>
          )}
        </div>

        {collapsed ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-1 px-3 pb-4">
                {threads === undefined && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                {threads && threads.length > 0 && (
                  <TooltipProvider>
                    {threads.slice(0, 10).map((thread) => {
                      const threadId = thread._id;
                      const isActive = pathname === `/chat/${threadId}`;
                      const displayTitle =
                        thread.title || "Untitled conversation";

                      return (
                        <Tooltip key={threadId}>
                          <TooltipTrigger asChild>
                            <Link href={`/chat/${threadId}`}>
                              <Button
                                className={cn(
                                  "w-full",
                                  isActive
                                    ? "bg-secondary/50"
                                    : "bg-transparent"
                                )}
                                size="icon"
                                type="button"
                                variant="ghost"
                              >
                                <SquareTerminal className="size-4 opacity-60" />
                                <span className="sr-only">{displayTitle}</span>
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p className="max-w-[200px] truncate">
                              {displayTitle}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </TooltipProvider>
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 px-6 py-3 font-medium text-muted-foreground text-xs">
              Recent
            </div>
            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-1 px-4 pb-4">
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
                      const isEditing = editingThreadId === threadId;

                      return (
                        <div className="group relative" key={threadId}>
                          {isEditing ? (
                            <div className="flex items-center gap-1 rounded-lg bg-secondary/50 px-2 py-1.5">
                              <Input
                                autoFocus
                                className="h-7 flex-1 border-none bg-transparent px-1 py-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                                onBlur={() => handleSaveEdit(threadId)}
                                onChange={(e) =>
                                  setEditingTitle(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleSaveEdit(threadId);
                                  } else if (e.key === "Escape") {
                                    handleCancelEdit();
                                  }
                                }}
                                type="text"
                                value={editingTitle}
                              />
                              <Button
                                className="size-6"
                                onClick={() => handleSaveEdit(threadId)}
                                size="icon"
                                type="button"
                                variant="ghost"
                              >
                                <Check className="size-3.5" />
                              </Button>
                              <Button
                                className="size-6"
                                onClick={handleCancelEdit}
                                size="icon"
                                type="button"
                                variant="ghost"
                              >
                                <X className="size-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Link
                                className="flex-1"
                                href={`/chat/${threadId}`}
                              >
                                <Button
                                  className={cn(
                                    "w-full cursor-pointer justify-start truncate rounded-lg text-left",
                                    isActive
                                      ? "bg-secondary/50 font-medium"
                                      : "font-normal"
                                  )}
                                  size="sm"
                                  type="button"
                                  variant="ghost"
                                >
                                  <SquareTerminal className="mr-2 size-3.5 shrink-0 opacity-60" />
                                  <span className="truncate text-sm">
                                    {displayTitle}
                                  </span>
                                </Button>
                              </Link>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    className={cn(
                                      "size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100",
                                      isActive && "opacity-100"
                                    )}
                                    size="icon"
                                    type="button"
                                    variant="ghost"
                                  >
                                    <MoreHorizontal className="size-3.5" />
                                    <span className="sr-only">
                                      Thread options
                                    </span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      handleStartEdit(threadId, displayTitle)
                                    }
                                  >
                                    <Pencil className="mr-2 size-3.5" />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onSelect={() => setDeleteThreadId(threadId)}
                                  >
                                    <Trash2 className="mr-2 size-3.5" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </div>
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
        )}

        <SidebarFooter className={collapsed ? "px-3" : ""}>
          <NavUser />
        </SidebarFooter>
      </SidebarContent>

      <AlertDialog
        onOpenChange={(open) => !open && setDeleteThreadId(null)}
        open={deleteThreadId !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              conversation and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteThreadId && handleDeleteThread(deleteThreadId)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
