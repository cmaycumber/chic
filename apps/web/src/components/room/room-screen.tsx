"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useIsAnonymous } from "@/components/sign-up-to-save";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useIsMobile } from "@/hooks/use-mobile";
import { CommentComposer } from "./comment-composer";
import { CommentsPanel } from "./comments-panel";
import { ItemProductsSheet } from "./item-products-sheet";
import { PinComposer } from "./pin-composer";
import { RoomCanvas } from "./room-canvas";
import { useRoomPeople } from "./room-people";
import { RoomTopBar } from "./room-topbar";
import type {
  Anchor,
  Collaborator,
  RoomComment,
  RoomMode,
  RoomVersion,
} from "./types";
import { useJoinWithInvite } from "./use-invite";
import { useRoomShortcuts } from "./use-room-shortcuts";
import {
  buildAnchorLabels,
  buildPinNumbers,
  buildPins,
  canEditRoom,
  errorMessage,
  findItemLabelAt,
  resolveCurrentVersion,
} from "./utils";
import { VersionStrip } from "./version-strip";

const NO_VERSIONS: RoomVersion[] = [];
const NO_COMMENTS: RoomComment[] = [];
const NO_COLLABORATORS: Collaborator[] = [];

function RoomLoading() {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-ink">
      <Spinner className="size-6 text-white/70" />
      <span className="sr-only">Loading your room</span>
    </div>
  );
}

function RoomNotFound() {
  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center gap-4 bg-ink px-6 text-center">
      <p className="font-serif text-2xl text-white">Room not found</p>
      <p className="max-w-sm text-sm text-white/60">
        This room does not exist, or it belongs to someone else.
      </p>
      <Button asChild variant="glass">
        <Link href="/rooms">Back to your rooms</Link>
      </Button>
    </div>
  );
}

/**
 * The room screen: your photo, full bleed, with every control floating on
 * glass above it. Comment to change the photo, shop what is in it.
 */
export function RoomScreen({ roomId }: { roomId: Id<"rooms"> }) {
  const isJoining = useJoinWithInvite(roomId);
  const data = useQuery(api.rooms.get, { roomId });
  const setCurrentVersion = useMutation(api.rooms.setCurrentVersion);
  const isMobile = useIsMobile();
  const isAnonymous = useIsAnonymous();

  const [mode, setMode] = useState<RoomMode>("comment");
  const [pendingAnchor, setPendingAnchor] = useState<Anchor | null>(null);
  const [composerFocusToken, setComposerFocusToken] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const versions = data?.versions ?? NO_VERSIONS;
  const comments = data?.comments ?? NO_COMMENTS;
  const collaborators = data?.collaborators ?? NO_COLLABORATORS;
  const roomCurrentVersionId = data?.room.currentVersionId;
  const roomError = data?.room.error ?? null;
  // In a room of one there is only ever one name to show, so the pins and the
  // panel stay as quiet as they were before anyone else arrived.
  const showAuthors = collaborators.length > 0;

  const people = useRoomPeople({
    collaborators,
    inviteToken: data?.room.inviteToken,
    isAnonymous,
    role: data?.role ?? "owner",
    roomId,
  });

  const currentVersion = useMemo(
    () => resolveCurrentVersion(versions, roomCurrentVersionId),
    [versions, roomCurrentVersionId]
  );
  const currentVersionId = currentVersion?._id ?? null;

  const pinNumbers = useMemo(() => buildPinNumbers(comments), [comments]);
  const pins = useMemo(
    () => buildPins(comments, pinNumbers, currentVersionId, showAuthors),
    [comments, pinNumbers, currentVersionId, showAuthors]
  );
  const anchorLabels = useMemo(
    () => buildAnchorLabels(comments, versions),
    [comments, versions]
  );
  const pendingItemLabel = useMemo(
    () => findItemLabelAt(currentVersion?.items, pendingAnchor),
    [currentVersion, pendingAnchor]
  );

  const lastErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (roomError && roomError !== lastErrorRef.current) {
      toast.error(roomError);
    }
    lastErrorRef.current = roomError;
  }, [roomError]);

  const handleEscape = useCallback(() => {
    setPendingAnchor(null);
    setSelectedItemId(null);
  }, []);

  const handlePickAnchor = useCallback(
    (anchor: Anchor | null, isAboveKeyboard: boolean) => {
      setPendingAnchor(anchor);
      // Opening the keyboard over the spot you just pinned hides the thing
      // you are talking about, so a low pin waits for a deliberate tap.
      if (anchor && isAboveKeyboard) {
        setComposerFocusToken((token) => token + 1);
      }
    },
    []
  );
  useRoomShortcuts({ onEscape: handleEscape, onMode: setMode });

  const handleSelectItem = useCallback((itemId: string) => {
    setSelectedItemId((current) => (current === itemId ? null : itemId));
  }, []);

  const handleSelectVersion = useCallback(
    (versionId: Id<"roomVersions">) => {
      // Items belong to a version, so a product sheet cannot survive the jump.
      setSelectedItemId(null);
      setCurrentVersion({ roomId, versionId }).catch((error: unknown) =>
        toast.error(errorMessage(error))
      );
    },
    [roomId, setCurrentVersion]
  );

  const handleSelectPin = useCallback(() => setCommentsOpen(true), []);

  if (data === undefined || isJoining) {
    return <RoomLoading />;
  }

  if (data === null) {
    return <RoomNotFound />;
  }

  const isGenerating = data.room.status === "generating";
  // `rooms.get` only answers people who may edit, but the product sheet asks
  // anyway so a future read-only role cannot slip a write button through.
  const canEdit = canEditRoom(data.role);
  // On a wide screen a pin gets its own composer beside it, the way a design
  // tool does; the bottom bar stands down so there is only ever one.
  const pinComposerOpen =
    mode === "comment" && !isMobile && pendingAnchor !== null && !isGenerating;
  const selectedItem =
    currentVersion?.items.find((item) => item.id === selectedItemId) ?? null;
  const versionIndex = versions.findIndex(
    (version) => version._id === currentVersionId
  );

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-ink">
      <RoomCanvas
        anchorPopover={
          pinComposerOpen && pendingAnchor ? (
            <PinComposer
              anchor={pendingAnchor}
              isGenerating={isGenerating}
              itemLabel={pendingItemLabel}
              onCancel={() => setPendingAnchor(null)}
              onSubmitted={() => setPendingAnchor(null)}
              roomId={roomId}
            />
          ) : null
        }
        isGenerating={isGenerating}
        isSheetOpen={isMobile && selectedItem !== null}
        mode={mode}
        onPickAnchor={handlePickAnchor}
        onSelectItem={handleSelectItem}
        onSelectPin={handleSelectPin}
        pendingAnchor={pendingAnchor}
        pins={pins}
        selectedItemId={selectedItemId}
        version={currentVersion}
      />

      <RoomTopBar
        commentCount={comments.length}
        commentsOpen={commentsOpen}
        historyOpen={historyOpen}
        imageUrl={currentVersion?.imageUrl ?? null}
        itemsFailed={currentVersion?.itemsStatus === "error"}
        mode={mode}
        onModeChange={setMode}
        onToggleComments={() => setCommentsOpen((open) => !open)}
        onToggleHistory={() => setHistoryOpen((open) => !open)}
        owner={data.owner}
        people={people}
        room={data.room}
        versionCount={versions.length}
        versionIndex={Math.max(versionIndex, 0)}
      />

      {Boolean(historyOpen) && (
        <VersionStrip
          currentVersionId={currentVersionId}
          hasComposer={mode === "comment"}
          onSelect={handleSelectVersion}
          versions={versions}
        />
      )}

      {mode === "comment" && !pinComposerOpen && (
        <CommentComposer
          focusToken={composerFocusToken}
          isGenerating={isGenerating}
          itemLabel={pendingItemLabel}
          onClearAnchor={() => setPendingAnchor(null)}
          onSubmitted={() => setPendingAnchor(null)}
          pendingAnchor={pendingAnchor}
          roomId={roomId}
        />
      )}

      {Boolean(commentsOpen) && (
        <CommentsPanel
          anchorLabels={anchorLabels}
          comments={comments}
          currentVersionId={currentVersionId}
          onClose={() => setCommentsOpen(false)}
          onJump={handleSelectVersion}
          pinNumbers={pinNumbers}
          roomId={roomId}
          showAuthors={showAuthors}
        />
      )}

      {selectedItem && currentVersion ? (
        <ItemProductsSheet
          canEdit={canEdit}
          isGenerating={isGenerating}
          item={selectedItem}
          onClose={() => setSelectedItemId(null)}
          roomId={roomId}
          versionId={currentVersion._id}
        />
      ) : null}
    </main>
  );
}
