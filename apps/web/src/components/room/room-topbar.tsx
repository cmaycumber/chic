"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import {
  BookmarkPlus,
  ChevronLeft,
  Download,
  History,
  MessageSquare,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type KeyboardEvent, useEffect, useState } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LiquidGlass } from "@/components/ui/liquid-glass";
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
        className="w-36 rounded-md bg-white/10 px-2 py-0.5 font-serif text-sm text-white outline-none ring-1 ring-white/20 sm:w-48"
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
      className="max-w-36 truncate rounded-md px-1 text-left font-serif text-sm text-white hover:bg-white/10 sm:max-w-56"
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
          "rounded-full px-3 py-1 font-sans text-xs transition-colors",
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
          "rounded-full px-3 py-1 font-sans text-xs transition-colors",
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

function RoomMenu({
  imageUrl,
  roomId,
  title,
}: {
  imageUrl: string | null;
  roomId: Id<"rooms">;
  title: string;
}) {
  const remove = useMutation(api.rooms.remove);
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isAnonymous = useIsAnonymous();
  const signUpHref = useSignUpHref();

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
          className="border-white/10 bg-ink/95 text-white"
        >
          {isAnonymous ? (
            <DropdownMenuItem asChild className="sm:hidden">
              <Link href={signUpHref}>
                <BookmarkPlus className="size-4" />
                Save your designs
              </Link>
            </DropdownMenuItem>
          ) : null}
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

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-start justify-between gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto min-w-0">
        <LiquidGlass
          className={GLASS_RESET}
          cornerRadius={CLUSTER_RADIUS}
          displacementScale={PILL_DISPLACEMENT}
          hostClassName="w-fit"
          tone="dark"
        >
          <div className="flex items-center gap-2 p-1.5 font-sans">
            <Button asChild size="icon-sm" variant="glass-dark">
              <Link href="/rooms">
                <ChevronLeft className="size-4" />
                <span className="sr-only">Back to your rooms</span>
              </Link>
            </Button>
            <div className="flex min-w-0 flex-col">
              <RoomTitle roomId={room._id} title={title} />
              <span className="block max-w-[40vw] truncate px-1 text-[11px] text-white/50 sm:max-w-none">
                {versionSummary(versionIndex, versionCount)}
                {itemsFailed ? " · furniture scan failed" : ""}
              </span>
            </div>
          </div>
        </LiquidGlass>
      </div>

      <div className="pointer-events-auto flex items-center gap-2">
        {isAnonymous ? (
          <SaveYourDesignsPill className="hidden sm:flex" />
        ) : null}

        <ModeToggle mode={mode} onModeChange={onModeChange} />

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
          {commentCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[var(--accent-brass)] text-[10px] text-white">
              {commentCount > MAX_BADGE_COUNT
                ? `${MAX_BADGE_COUNT}+`
                : `${commentCount}`}
            </span>
          )}
          <span className="sr-only">Toggle comments</span>
        </Button>

        <RoomMenu imageUrl={imageUrl} roomId={room._id} title={title} />
      </div>
    </div>
  );
}
