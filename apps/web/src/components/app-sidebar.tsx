"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { useAction, useMutation, usePaginatedQuery } from "convex/react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Heart,
  Loader2,
  MoreHorizontal,
  Pencil,
  PlusCircle,
  SquareTerminal,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { CreditPurchaseModal } from "@/components/credit-purchase-modal";
import { LOGO_HEIGHT, LOGO_WIDTH, Logo } from "@/components/logo";
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: UI state management requires complex conditional rendering
export function AppSidebar({
  className,
  collapsible,
  ...props
}: AppSidebarProps) {
  const { state, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = state === "collapsed";
  const isMobileMode = collapsible === "none";

  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [deleteThreadId, setDeleteThreadId] = useState<string | null>(null);
  const [creditModalOpen, setCreditModalOpen] = useState(false);

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
    <Sidebar className={className} collapsible="icon" {...props}>
      <SidebarContent>
        <div className={cn("space-y-3", collapsed ? "px-2 py-3" : "px-3 py-4")}>
          {/* Header with Logo and Toggle */}
          <div
            className={cn(
              "flex items-center",
              collapsed ? "justify-center" : "justify-between px-3"
            )}
          >
            {collapsed ? (
              <Button
                className="size-8 p-0"
                onClick={toggleSidebar}
                size="icon"
                type="button"
                variant="ghost"
              >
                <ChevronRight className="size-4" />
                <span className="sr-only">Expand sidebar</span>
              </Button>
            ) : (
              <>
                <Link
                  className="flex items-center transition-opacity hover:opacity-80"
                  href="/chat"
                >
                  <Logo
                    className="text-foreground"
                    height={LOGO_HEIGHT}
                    width={LOGO_WIDTH}
                  />
                </Link>
                {!isMobileMode && (
                  <Button
                    className="size-8 p-0"
                    onClick={toggleSidebar}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <ChevronLeft className="size-4" />
                    <span className="sr-only">Collapse sidebar</span>
                  </Button>
                )}
              </>
            )}
          </div>

          {/* New Chat Button */}
          <div>
            {collapsed ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      asChild
                      className="size-8 w-full p-0"
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Link href="/chat">
                        <PlusCircle className="size-4" />
                        <span className="sr-only">New Chat</span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>New Chat</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button
                asChild
                className="w-full justify-start gap-3 rounded-lg border border-border/40 bg-background font-normal shadow-none hover:bg-accent"
                size="default"
                type="button"
                variant="outline"
              >
                <Link href="/chat">
                  <PlusCircle className="size-4" />
                  <span>New chat</span>
                </Link>
              </Button>
            )}
          </div>
        </div>

        {!collapsed && (
          <div className="px-3 pb-2">
            <Button
              className="w-full justify-between bg-amber-600/10 text-amber-700 hover:bg-amber-600/20 hover:text-amber-800"
              onClick={() => setCreditModalOpen(true)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <span className="font-medium text-xs">Get more credits</span>
              <span className="font-bold text-xs">Upgrade</span>
            </Button>
          </div>
        )}

        {collapsed ? (
          <div className="flex-1 space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    className={cn(
                      "size-8 w-full p-0",
                      pathname === "/explore" && "bg-accent"
                    )}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Link as="/explore" href="/explore">
                      <Compass className="size-4" />
                      <span className="sr-only">Explore Designs</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Explore Designs</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    className={cn(
                      "size-8 w-full p-0",
                      pathname === "/saved" && "bg-accent"
                    )}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Link as="/saved" href="/saved">
                      <Heart className="size-4" />
                      <span className="sr-only">Saved Designs</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Saved Designs</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="space-y-0.5 px-3 pb-3">
              <Button
                asChild
                className={cn(
                  "w-full justify-start gap-3 rounded-lg font-normal",
                  pathname === "/explore" ? "bg-accent" : "hover:bg-accent/50"
                )}
                size="default"
                type="button"
                variant="ghost"
              >
                <Link as="/explore" href="/explore">
                  <Compass className="size-4" />
                  <span>Explore Designs</span>
                </Link>
              </Button>
              <Button
                asChild
                className={cn(
                  "w-full justify-start gap-3 rounded-lg font-normal",
                  pathname === "/saved" ? "bg-accent" : "hover:bg-accent/50"
                )}
                size="default"
                type="button"
                variant="ghost"
              >
                <Link as="/saved" href="/saved">
                  <Heart className="size-4" />
                  <span>Saved Designs</span>
                </Link>
              </Button>
            </div>

            <div className="shrink-0 px-6 py-2 font-medium text-muted-foreground/70 text-xs uppercase tracking-wider">
              Chats
            </div>
            <div className="flex-1 overflow-auto">
              <div className="flex flex-col gap-0.5 px-3 pb-4">
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
                              <Button
                                asChild
                                className={cn(
                                  "w-full flex-1 cursor-pointer justify-start truncate rounded-lg px-3 text-left",
                                  isActive
                                    ? "bg-accent font-normal"
                                    : "font-normal hover:bg-accent/50"
                                )}
                                size="sm"
                                type="button"
                                variant="ghost"
                              >
                                <Link href={`/chat/${threadId}`}>
                                  <SquareTerminal className="mr-2.5 size-4 shrink-0 opacity-50" />
                                  <span className="truncate text-sm">
                                    {displayTitle}
                                  </span>
                                </Link>
                              </Button>
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
            </div>
          </div>
        )}

        <SidebarFooter className={collapsed ? "px-3" : ""}>
          <NavUser />
        </SidebarFooter>
      </SidebarContent>

      <CreditPurchaseModal
        onOpenChange={setCreditModalOpen}
        open={creditModalOpen}
      />
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
              className="bg-destructive text-white hover:bg-destructive/90"
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
