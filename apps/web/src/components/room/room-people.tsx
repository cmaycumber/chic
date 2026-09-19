"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Link2Off, LogOut, UserPlus, Users } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useSignUpHref } from "@/components/sign-up-to-save";
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { deliverShareLink } from "./share-link";
import type { Collaborator, RoomRole } from "./types";
import { errorMessage, initialOf } from "./utils";

/** Beyond this the stack says "+N" instead of growing along the top bar. */
const MAX_VISIBLE_AVATARS = 3;

export function inviteUrl(roomId: string, token: string): string {
  return `${window.location.origin}/room/${roomId}?invite=${token}`;
}

const INVITE_SHARE_TITLE = "Edit this room with me";

/** Everything the top bar and its menu need to manage who is in a room. */
export interface RoomPeople {
  closePeople: () => void;
  collaborators: Collaborator[];
  dismissFallback: () => void;
  /** Set when the invite link could not be delivered and needs the dialog. */
  fallbackUrl: string | null;
  hasInviteLink: boolean;
  invite: () => void;
  /** Where an anonymous owner goes instead of getting a link. */
  inviteSignUpHref: Route | null;
  isInviting: boolean;
  leave: () => void;
  openPeople: () => void;
  peopleOpen: boolean;
  revoke: () => void;
  role: RoomRole;
}

/**
 * Read-only sharing is open to anyone, but an invited editor writes into a
 * room that has to outlive the session that made it — so inviting is the one
 * thing here that asks the owner for an account first.
 */
export function useRoomPeople({
  collaborators,
  inviteToken,
  isAnonymous,
  role,
  roomId,
}: {
  collaborators: Collaborator[];
  inviteToken: string | undefined;
  isAnonymous: boolean | undefined;
  role: RoomRole;
  roomId: Id<"rooms">;
}): RoomPeople {
  const createInvite = useMutation(api.rooms.createInvite);
  const revokeInvite = useMutation(api.rooms.revokeInvite);
  const leaveRoom = useMutation(api.rooms.leaveRoom);
  const router = useRouter();
  const signUpHref = useSignUpHref();

  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);

  const invite = useCallback(() => {
    setIsInviting(true);
    const run = async () => {
      const token = await createInvite({ roomId });
      const url = inviteUrl(roomId, token);
      const outcome = await deliverShareLink(INVITE_SHARE_TITLE, url);
      if (outcome === "needs-fallback") {
        setFallbackUrl(url);
      }
    };
    run()
      .catch((error: unknown) => toast.error(errorMessage(error)))
      .finally(() => setIsInviting(false));
  }, [createInvite, roomId]);

  const revoke = useCallback(() => {
    revokeInvite({ roomId })
      .then(() => toast.success("Invite link revoked"))
      .catch((error: unknown) => toast.error(errorMessage(error)));
  }, [revokeInvite, roomId]);

  const leave = useCallback(() => {
    leaveRoom({ roomId })
      .then(() => router.push("/rooms"))
      .catch((error: unknown) => toast.error(errorMessage(error)));
  }, [leaveRoom, roomId, router]);

  return {
    closePeople: () => setPeopleOpen(false),
    collaborators,
    dismissFallback: () => setFallbackUrl(null),
    fallbackUrl,
    hasInviteLink: Boolean(inviteToken),
    invite,
    inviteSignUpHref: isAnonymous ? signUpHref : null,
    isInviting,
    leave,
    openPeople: () => setPeopleOpen(true),
    peopleOpen,
    revoke,
    role,
  };
}

/**
 * A person as one letter. The owner is brass everywhere; everyone else takes
 * their contrast from whatever they are sitting on, since the same avatar
 * appears on dark glass in the top bar and on a light dialog.
 */
function Avatar({
  className,
  isOwner,
  name,
  surface = "dark",
}: {
  className?: string;
  isOwner?: boolean;
  name: string;
  surface?: "dark" | "light";
}) {
  const plain = surface === "light" ? "bg-ink/15 text-ink" : "bg-white/25";

  return (
    <span
      className={cn(
        "flex size-6 items-center justify-center rounded-full font-medium text-[10px] text-white",
        isOwner ? "bg-[var(--accent-brass)]" : plain,
        className
      )}
    >
      {initialOf(name)}
    </span>
  );
}

/** Who else is in this room, at a glance, on a screen wide enough to say so. */
export function CollaboratorStack({
  collaborators,
  onClick,
}: {
  collaborators: Collaborator[];
  onClick: () => void;
}) {
  if (collaborators.length === 0) {
    return null;
  }
  const visible = collaborators.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = collaborators.length - visible.length;

  return (
    <button
      className="liquid-glass liquid-glass-dark glass-press flex items-center rounded-full p-1 pr-2"
      onClick={onClick}
      type="button"
    >
      <span className="flex items-center -space-x-1.5">
        {visible.map((person) => (
          <Avatar
            className="ring-1 ring-black/40"
            key={person.id}
            name={person.name}
          />
        ))}
      </span>
      {overflow > 0 ? (
        <span className="ml-1.5 text-[11px] text-white/70">+{overflow}</span>
      ) : null}
      <span className="sr-only">
        {collaborators.length === 1
          ? "1 person can edit this room"
          : `${collaborators.length} people can edit this room`}
      </span>
    </button>
  );
}

/** The menu entries for inviting people, sharing the link and stepping out. */
export function PeopleMenuItems({ people }: { people: RoomPeople }) {
  const isOwner = people.role === "owner";

  return (
    <>
      {isOwner ? (
        <>
          {people.inviteSignUpHref === null ? (
            <DropdownMenuItem
              disabled={people.isInviting}
              onSelect={people.invite}
            >
              <UserPlus className="size-4" />
              Invite to edit
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild>
              <Link href={people.inviteSignUpHref}>
                <UserPlus className="size-4" />
                Invite to edit
              </Link>
            </DropdownMenuItem>
          )}

          {people.hasInviteLink ? (
            <DropdownMenuItem onSelect={people.revoke}>
              <Link2Off className="size-4" />
              Revoke invite link
            </DropdownMenuItem>
          ) : null}
        </>
      ) : null}

      <DropdownMenuItem onSelect={people.openPeople}>
        <Users className="size-4" />
        People
        {people.collaborators.length > 0 ? (
          <span className="ml-auto text-white/50 text-xs">
            {people.collaborators.length}
          </span>
        ) : null}
      </DropdownMenuItem>

      {isOwner ? null : (
        <DropdownMenuItem
          className="text-[var(--accent-coral)] focus:text-[var(--accent-coral)]"
          onSelect={people.leave}
        >
          <LogOut className="size-4" />
          Leave room
        </DropdownMenuItem>
      )}
    </>
  );
}

function CollaboratorRow({
  isOwner,
  onRemove,
  person,
}: {
  isOwner: boolean;
  onRemove: (person: Collaborator) => void;
  person: Collaborator;
}) {
  return (
    <li className="flex items-center gap-3 py-2">
      <Avatar className="size-8 text-xs" name={person.name} surface="light" />
      <span className="min-w-0 flex-1 truncate text-sm">{person.name}</span>
      <span className="text-muted-foreground text-xs">Can edit</span>
      {isOwner ? (
        <Button
          className="shrink-0"
          onClick={() => onRemove(person)}
          size="sm"
          type="button"
          variant="ghost"
        >
          Remove
          <span className="sr-only"> {person.name} from this room</span>
        </Button>
      ) : null}
    </li>
  );
}

/** The room's roster: the owner, then everyone they let in. */
export function PeopleDialog({
  owner,
  people,
  roomId,
}: {
  owner: Collaborator;
  people: RoomPeople;
  roomId: Id<"rooms">;
}) {
  const removeCollaborator = useMutation(api.rooms.removeCollaborator);
  const [pendingRemoval, setPendingRemoval] = useState<Collaborator | null>(
    null
  );
  const isOwner = people.role === "owner";

  const confirmRemoval = () => {
    if (!pendingRemoval) {
      return;
    }
    const person = pendingRemoval;
    setPendingRemoval(null);
    removeCollaborator({ roomId, userId: person.id })
      .then(() => toast.success(`${person.name} can no longer edit this room`))
      .catch((error: unknown) => toast.error(errorMessage(error)));
  };

  return (
    <>
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            people.closePeople();
          }
        }}
        open={people.peopleOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>People in this room</DialogTitle>
            <DialogDescription>
              Everyone here can comment and change the photo.
            </DialogDescription>
          </DialogHeader>

          <ul className="divide-y divide-border">
            <li className="flex items-center gap-3 py-2">
              <Avatar className="size-8 text-xs" isOwner name={owner.name} />
              <span className="min-w-0 flex-1 truncate text-sm">
                {owner.name}
              </span>
              <span className="text-muted-foreground text-xs">Owner</span>
            </li>
            {people.collaborators.map((person) => (
              <CollaboratorRow
                isOwner={isOwner}
                key={person.id}
                onRemove={setPendingRemoval}
                person={person}
              />
            ))}
          </ul>

          {people.collaborators.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nobody else yet. Share an invite link to bring someone in.
            </p>
          ) : null}

          {isOwner && people.inviteSignUpHref === null ? (
            <Button
              className="w-full"
              disabled={people.isInviting}
              onClick={people.invite}
              type="button"
              variant="brass"
            >
              <UserPlus className="size-4" />
              {people.hasInviteLink ? "Copy invite link" : "Invite to edit"}
            </Button>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setPendingRemoval(null);
          }
        }}
        open={pendingRemoval !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {pendingRemoval?.name ?? "this person"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They lose access to this room. The comments they already left stay
              where they are.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep access</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoval}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
