"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Loader2, MoreVertical, Pencil, Trash2, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  ANONYMOUS_ROOM_TTL_DAYS,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { UploadRoomButton } from "@/components/upload-room-button";
import { cn } from "@/lib/utils";

interface Room {
  _creationTime: number;
  _id: Id<"rooms">;
  imageUrl: string | null;
  role: "collaborator" | "owner";
  status: "ready" | "generating" | "error";
  title?: string;
  versionCount: number;
}

const SKELETON_COUNT = 7;

function versionsLabel(count: number): string {
  return count === 1 ? "1 version" : `${count} versions`;
}

function RoomCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}

function RoomCard({ room }: { room: Room }) {
  const rename = useMutation(api.rooms.rename);
  const remove = useMutation(api.rooms.remove);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState(room.title ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const displayTitle = room.title || "Untitled room";

  const openRenameDialog = () => {
    setTitleDraft(room.title ?? "");
    setRenameOpen(true);
  };

  const handleRenameSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = titleDraft.trim();
    if (!trimmed) {
      toast.error("Please enter a name.");
      return;
    }
    setIsSaving(true);
    try {
      await rename({ roomId: room._id, title: trimmed });
      setRenameOpen(false);
    } catch {
      toast.error("Couldn't rename this room. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await remove({ roomId: room._id });
      setDeleteOpen(false);
    } catch {
      toast.error("Couldn't delete this room. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="group relative">
      <Link
        className="block space-y-3"
        href={`/room/${room._id}`}
        prefetch={false}
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-greige/40">
          {room.imageUrl ? (
            <Image
              alt={displayTitle}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 20vw"
              src={room.imageUrl}
            />
          ) : null}
          {room.status === "generating" && (
            <Badge className="absolute bottom-2 left-2 gap-1 border-none bg-ink/80 text-white">
              <Loader2 className="size-3 animate-spin" />
              Generating
            </Badge>
          )}
          {room.role === "collaborator" && room.status !== "generating" && (
            <Badge className="absolute bottom-2 left-2 gap-1 border-none bg-ink/80 text-white">
              <Users className="size-3" />
              Shared with you
            </Badge>
          )}
        </div>
        <div>
          <h3 className="truncate font-medium text-ink">{displayTitle}</h3>
          <p className="text-ink/60 text-sm">
            {versionsLabel(room.versionCount)}
          </p>
        </div>
      </Link>

      <div
        className={cn(
          "absolute top-2 right-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100",
          room.role === "collaborator" && "hidden"
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Room options"
              className="size-8"
              size="icon"
              type="button"
              variant="glass-dark"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                openRenameDialog();
              }}
            >
              <Pencil className="size-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setDeleteOpen(true);
              }}
              variant="destructive"
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog onOpenChange={setRenameOpen} open={renameOpen}>
        <DialogContent>
          <form onSubmit={handleRenameSubmit}>
            <DialogHeader>
              <DialogTitle>Rename room</DialogTitle>
              <DialogDescription>
                Give this room a name you'll recognize later.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                autoFocus
                disabled={isSaving}
                maxLength={120}
                onChange={(event) => setTitleDraft(event.target.value)}
                placeholder="Untitled room"
                value={titleDraft}
              />
            </div>
            <DialogFooter>
              <Button
                disabled={isSaving}
                onClick={() => setRenameOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isSaving} type="submit">
                {isSaving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={setDeleteOpen} open={deleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this room?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes "{displayTitle}" and every version of it. This can't
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} type="button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={handleDelete}
              type="button"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Rooms made without an account are real rooms on a deadline. Say so once,
 * above the grid, rather than putting a countdown on every card.
 */
function RetentionNotice() {
  const signUpHref = useSignUpHref();

  return (
    <p className="mb-6 rounded-xl border border-greige/60 bg-white/60 px-4 py-3 text-ink/70 text-sm backdrop-blur-sm">
      Your rooms are kept for {ANONYMOUS_ROOM_TTL_DAYS} days.{" "}
      <Link className="font-medium text-ink underline" href={signUpHref}>
        Sign in to keep them.
      </Link>
    </p>
  );
}

export default function RoomsPage() {
  const rooms = useQuery(api.rooms.list);
  const isAnonymous = useIsAnonymous();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-normal font-serif text-3xl text-ink">
            Your rooms
          </h1>
          <p className="mt-1 text-ink/60 text-sm">
            Upload a photo, leave a comment, watch it change.
          </p>
        </div>
      </div>

      {isAnonymous ? <RetentionNotice /> : null}

      {rooms === undefined && (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from(
            { length: SKELETON_COUNT },
            (_, i) => `room-skeleton-${i}`
          ).map((key) => (
            <RoomCardSkeleton key={key} />
          ))}
        </div>
      )}

      {rooms && rooms.length === 0 && (
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-greige/60 border-dashed py-20 text-center">
          <div className="space-y-2">
            <h2 className="font-normal font-serif text-2xl text-ink">
              No rooms yet
            </h2>
            <p className="mx-auto max-w-sm text-ink/60 text-sm">
              Upload a photo of any room to start leaving comments and shopping
              the furniture in it.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <UploadRoomButton variant="hero" />
          </div>
        </div>
      )}

      {rooms && rooms.length > 0 && (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          <UploadRoomButton variant="tile" />
          {rooms.map((room) => (
            <RoomCard key={room._id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}
