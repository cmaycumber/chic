"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import {
  BookmarkPlus,
  ChevronLeft,
  Download,
  Globe,
  History,
  Lock,
  MessageSquare,
  MoreHorizontal,
  Share2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type KeyboardEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  SaveYourDesignsPill,
  useIsAnonymous,
  useSignUpHref,
} from "@/components/sign-up-to-save";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { Room, RoomMode } from "./types";
import {
  CLUSTER_RADIUS,
  errorMessage,
  GLASS_RESET,
  PILL_DISPLACEMENT,
} from "./utils";

const MAX_BADGE_COUNT = 9;

interface RoomTopBarProps {
  commentCount: number;
  commentsOpen: boolean;
  historyOpen: boolean;
  imageUrl: string | null;
  itemsFailed: boolean;
  mode: RoomMode;
  onModeChange: (mode: RoomMode) => void;
  onToggleComments: () => void;
  onToggleHistory: () => void;
  room: Room;
  versionCount: number;
  versionIndex: number;
}

function versionSummary(index: number, count: number): string {
  if (index === 0) {
    return count > 1 ? `Original of ${count}` : "Original";
  }
  return `v${index + 1} of ${count}`;
}

function badgeLabel(count: number): string {
  return count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : `${count}`;
}

/** A share sheet the visitor dismissed is not an error worth shouting about. */
function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

/** Either the link reached the visitor, or they have to copy it themselves. */
type ShareOutcome = "delivered" | "needs-fallback";

async function copyShareLink(url: string): Promise<ShareOutcome> {
  if (typeof navigator.clipboard?.writeText !== "function") {
    return "needs-fallback";
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
    return "delivered";
  } catch {
    // Permission policy, an insecure origin, a browser that wants a gesture
    // it did not see: none of that is worth a raw error in a toast.
    return "needs-fallback";
  }
}

async function deliverShareLink(
  title: string,
  url: string
): Promise<ShareOutcome> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title, url });
      return "delivered";
    } catch (error) {
      if (isAbortError(error)) {
        return "delivered";
      }
      // The sheet refused; the clipboard is the next best thing.
    }
  }
  return await copyShareLink(url);
}

/** The link, spelled out, for when neither the sheet nor the clipboard works. */
function ShareLinkDialog({
  onClose,
  url,
}: {
  onClose: () => void;
  url: string;
}) {
  const handleCopy = () => {
    copyShareLink(url)
      .then((outcome) => {
        if (outcome === "delivered") {
          onClose();
          return;
        }
        toast.error("Copying is blocked here. Select the link and copy it.");
      })
      .catch((error: unknown) => toast.error(errorMessage(error)));
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      open
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this room</DialogTitle>
          <DialogDescription>
            Anyone with this link can open the room.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input
            aria-label="Link to this room"
            onFocus={(event) => event.currentTarget.select()}
            readOnly
            value={url}
          />
          <Button
            className="shrink-0"
            onClick={handleCopy}
            type="button"
            variant="brass"
          >
            Copy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface RoomShare {
  dismissFallback: () => void;
  /** Set when the link could not be delivered and needs the manual dialog. */
  fallbackUrl: string | null;
  isPublic: boolean;
  share: () => void;
  togglePublic: () => void;
}

/**
 * Sharing publishes first and asks nothing: one tap makes the room readable
 * by link and hands that link to the system share sheet, or the clipboard.
 */
function useRoomShare(room: Room, title: string): RoomShare {
  const setPublic = useMutation(api.rooms.setPublic);
  const isPublic = room.isPublic ?? false;
  const roomId = room._id;
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  const dismissFallback = useCallback(() => setFallbackUrl(null), []);

  const share = useCallback(() => {
    const url = `${window.location.origin}/r/${roomId}`;
    const run = async () => {
      if (!isPublic) {
        await setPublic({ isPublic: true, roomId });
      }
      if ((await deliverShareLink(title, url)) === "needs-fallback") {
        setFallbackUrl(url);
      }
    };

    run().catch((error: unknown) => toast.error(errorMessage(error)));
  }, [isPublic, roomId, setPublic, title]);

  const togglePublic = useCallback(() => {
    const next = !isPublic;
    setPublic({ isPublic: next, roomId })
      .then(() =>
        toast.success(
          next ? "Anyone with the link can open this room" : "Room is private"
        )
      )
      .catch((error: unknown) => toast.error(errorMessage(error)));
  }, [isPublic, roomId, setPublic]);

  return { dismissFallback, fallbackUrl, isPublic, share, togglePublic };
}

function RoomTitle({ roomId, title }: { roomId: Id<"rooms">; title: string }) {
  const rename = useMutation(api.rooms.rename);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  useEffect(() => {
    setDraft(title);
  }, [title]);

  const commit = () => {
    setIsEditing(false);
    const next = draft.trim();
    if (!next || next === title) {
      setDraft(title);
      return;
    }
    rename({ roomId, title: next }).catch((error: unknown) => {
      setDraft(title);
      toast.error(errorMessage(error));
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    }
    if (event.key === "Escape") {
      setDraft(title);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        aria-label="Room name"
        className="w-32 rounded-md bg-white/10 px-2 py-0.5 font-serif text-sm text-white outline-none ring-1 ring-white/20 sm:w-48"
        onBlur={commit}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        ref={(node) => {
          node?.focus();
        }}
        value={draft}
      />
    );
  }

  return (
    <button
      className="min-w-0 flex-1 truncate rounded-md px-1 text-left font-serif text-sm text-white hover:bg-white/10 sm:max-w-56 sm:flex-none"
      onClick={() => setIsEditing(true)}
      type="button"
    >
      {title}
      <span className="sr-only">Rename this room</span>
    </button>
  );
}

function ModeToggle({
  mode,
  onModeChange,
}: {
  mode: RoomMode;
  onModeChange: (next: RoomMode) => void;
}) {
  return (
    <div className="liquid-glass liquid-glass-dark flex items-center gap-1 rounded-full p-1">
      <button
        aria-pressed={mode === "comment"}
        className={cn(
          "rounded-full px-3 py-1.5 font-sans text-xs transition-colors",
          mode === "comment" ? "bg-white/25 text-white" : "text-white/60"
        )}
        onClick={() => onModeChange("comment")}
        type="button"
      >
        Comment
      </button>
      <button
        aria-pressed={mode === "shop"}
        className={cn(
          "rounded-full px-3 py-1.5 font-sans text-xs transition-colors",
          mode === "shop" ? "bg-white/25 text-white" : "text-white/60"
        )}
        onClick={() => onModeChange("shop")}
        type="button"
      >
        Shop
      </button>
    </div>
  );
}

interface CollapsedItemsProps {
  commentCount: number;
  onShare: () => void;
  onToggleComments: () => void;
  onToggleHistory: () => void;
}

/**
 * On a phone the top bar keeps only what you steer with, so the rest of the
 * chrome lives here instead of squeezing the title out of the bar.
 */
function CollapsedMenuItems({
  commentCount,
  onShare,
  onToggleComments,
  onToggleHistory,
}: CollapsedItemsProps) {
  const isAnonymous = useIsAnonymous();
  const signUpHref = useSignUpHref();

  return (
    <>
      {isAnonymous ? (
        <DropdownMenuItem asChild>
          <Link href={signUpHref}>
            <BookmarkPlus className="size-4" />
            Save your designs
          </Link>
        </DropdownMenuItem>
      ) : null}
      <DropdownMenuItem onSelect={onToggleComments}>
        <MessageSquare className="size-4" />
        Comments
        {commentCount > 0 ? (
          <span className="ml-auto flex size-4 items-center justify-center rounded-full bg-[var(--accent-brass)] text-[10px] text-white">
            {badgeLabel(commentCount)}
          </span>
        ) : null}
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={onToggleHistory}>
        <History className="size-4" />
        Version history
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={onShare}>
        <Share2 className="size-4" />
        Share link
      </DropdownMenuItem>
      <DropdownMenuSeparator className="bg-white/10" />
    </>
  );
}

interface RoomMenuProps {
  collapsed: CollapsedItemsProps | null;
  imageUrl: string | null;
  isPublic: boolean;
  onTogglePublic: () => void;
  roomId: Id<"rooms">;
  title: string;
}

function RoomMenu({
  collapsed,
  imageUrl,
  isPublic,
  onTogglePublic,
  roomId,
  title,
}: RoomMenuProps) {
  const remove = useMutation(api.rooms.remove);
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    remove({ roomId })
      .then(() => router.push("/rooms"))
      .catch((error: unknown) => {
        setIsDeleting(false);
        toast.error(errorMessage(error));
      });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon-sm" type="button" variant="glass-dark">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">More room options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 border-white/10 bg-ink text-white"
        >
          {collapsed ? <CollapsedMenuItems {...collapsed} /> : null}

          <DropdownMenuItem onSelect={onTogglePublic}>
            {isPublic ? (
              <Lock className="size-4" />
            ) : (
              <Globe className="size-4" />
            )}
            {isPublic ? "Make private" : "Make public"}
          </DropdownMenuItem>

          <DropdownMenuItem asChild disabled={!imageUrl}>
            <a
              download={`${title}.png`}
              href={imageUrl ?? "#"}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Download className="size-4" />
              Download image
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="text-[var(--accent-coral)] focus:text-[var(--accent-coral)]"
            onSelect={(event) => {
              event.preventDefault();
              setConfirmOpen(true);
            }}
          >
            <Trash2 className="size-4" />
            Delete room
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog onOpenChange={setConfirmOpen} open={confirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this room?</AlertDialogTitle>
            <AlertDialogDescription>
              The photo, every version of it and all of your comments will be
              deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep room</AlertDialogCancel>
            <AlertDialogAction disabled={isDeleting} onClick={handleDelete}>
              Delete room
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** Floating chrome over the photo: where you are, and everything you can do. */
export function RoomTopBar({
  commentCount,
  commentsOpen,
  historyOpen,
  imageUrl,
  itemsFailed,
  mode,
  onModeChange,
  onToggleComments,
  onToggleHistory,
  room,
  versionCount,
  versionIndex,
}: RoomTopBarProps) {
  const title = room.title ?? "Untitled room";
  const isAnonymous = useIsAnonymous();
  const isMobile = useIsMobile();
  const { dismissFallback, fallbackUrl, isPublic, share, togglePublic } =
    useRoomShare(room, title);

  const publicBadge = isPublic ? (
    <span className="shrink-0 rounded-full bg-[var(--accent-brass)]/30 px-1.5 py-0.5 text-[10px] text-white">
      Public
    </span>
  ) : null;
  // A phone has no width to spare beside the title, so the badge drops to
  // the line below it.
  const titleBadge = isMobile ? null : publicBadge;
  const subtitleBadge = isMobile ? publicBadge : null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-start justify-between gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      {/* Reserve the mode toggle and the menu their room, so a long title
          truncates rather than sliding out from under the glass. */}
      <div className="pointer-events-auto min-w-0 max-w-[calc(100%-11rem)] sm:max-w-none">
        <LiquidGlass
          className={GLASS_RESET}
          cornerRadius={CLUSTER_RADIUS}
          displacementScale={PILL_DISPLACEMENT}
          hostClassName="w-fit max-w-full"
          // The refracting surface measures its content once and lags behind
          // a truncating title, leaving the badge outside the pill on a
          // phone. The CSS material always fits exactly.
          refract={!isMobile}
          tone="dark"
        >
          <div className="flex items-center gap-2 overflow-hidden p-1.5 font-sans">
            <Button asChild size="icon-sm" variant="glass-dark">
              <Link href="/rooms">
                <ChevronLeft className="size-4" />
                <span className="sr-only">Back to your rooms</span>
              </Link>
            </Button>
            <div className="flex min-w-0 flex-col">
              <div className="flex min-w-0 items-center gap-1.5">
                <RoomTitle roomId={room._id} title={title} />
                {titleBadge}
              </div>
              <span className="flex min-w-0 items-center gap-1.5 px-1 text-[11px] text-white/50">
                <span className="truncate">
                  {versionSummary(versionIndex, versionCount)}
                  {itemsFailed ? " · furniture scan failed" : ""}
                </span>
                {subtitleBadge}
              </span>
            </div>
          </div>
        </LiquidGlass>
      </div>

      <div className="pointer-events-auto flex items-center gap-2">
        {isAnonymous && !isMobile ? <SaveYourDesignsPill /> : null}

        <ModeToggle mode={mode} onModeChange={onModeChange} />

        {isMobile ? null : (
          <>
            <Button
              aria-pressed={historyOpen}
              className={cn(historyOpen && "ring-1 ring-white/40")}
              onClick={onToggleHistory}
              size="icon-sm"
              type="button"
              variant="glass-dark"
            >
              <History className="size-4" />
              <span className="sr-only">Toggle version history</span>
            </Button>

            <Button
              aria-pressed={commentsOpen}
              className={cn("relative", commentsOpen && "ring-1 ring-white/40")}
              onClick={onToggleComments}
              size="icon-sm"
              type="button"
              variant="glass-dark"
            >
              <MessageSquare className="size-4" />
              {commentCount > 0 ? (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[var(--accent-brass)] text-[10px] text-white">
                  {badgeLabel(commentCount)}
                </span>
              ) : null}
              <span className="sr-only">Toggle comments</span>
            </Button>

            <Button
              onClick={share}
              size="icon-sm"
              type="button"
              variant="glass-dark"
            >
              <Share2 className="size-4" />
              <span className="sr-only">Share a link to this room</span>
            </Button>
          </>
        )}

        <RoomMenu
          collapsed={
            isMobile
              ? {
                  commentCount,
                  onShare: share,
                  onToggleComments,
                  onToggleHistory,
                }
              : null
          }
          imageUrl={imageUrl}
          isPublic={isPublic}
          onTogglePublic={togglePublic}
          roomId={room._id}
          title={title}
        />
      </div>

      {fallbackUrl === null ? null : (
        <ShareLinkDialog onClose={dismissFallback} url={fallbackUrl} />
      )}
    </div>
  );
}
