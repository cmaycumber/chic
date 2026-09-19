"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CommentComposer } from "./comment-composer";
import { CommentsPanel } from "./comments-panel";
import { ItemProductsSheet } from "./item-products-sheet";
import { RoomCanvas } from "./room-canvas";
import { RoomTopBar } from "./room-topbar";
import type { Anchor, RoomComment, RoomMode, RoomVersion } from "./types";
import { useRoomShortcuts } from "./use-room-shortcuts";
import {
  buildPinNumbers,
  buildPins,
  errorMessage,
  resolveCurrentVersion,
} from "./utils";
import { VersionStrip } from "./version-strip";

const NO_VERSIONS: RoomVersion[] = [];
const NO_COMMENTS: RoomComment[] = [];

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
  const data = useQuery(api.rooms.get, { roomId });
  const setCurrentVersion = useMutation(api.rooms.setCurrentVersion);

  const [mode, setMode] = useState<RoomMode>("comment");
  const [pendingAnchor, setPendingAnchor] = useState<Anchor | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const versions = data?.versions ?? NO_VERSIONS;
  const comments = data?.comments ?? NO_COMMENTS;
  const roomCurrentVersionId = data?.room.currentVersionId;
  const roomError = data?.room.error ?? null;

  const currentVersion = useMemo(
    () => resolveCurrentVersion(versions, roomCurrentVersionId),
    [versions, roomCurrentVersionId]
  );
  const currentVersionId = currentVersion?._id ?? null;

  const pinNumbers = useMemo(() => buildPinNumbers(comments), [comments]);
  const pins = useMemo(
    () => buildPins(comments, pinNumbers, currentVersionId),
    [comments, pinNumbers, currentVersionId]
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

  if (data === undefined) {
    return <RoomLoading />;
  }

  if (data === null) {
    return <RoomNotFound />;
  }

  const isGenerating = data.room.status === "generating";
  const selectedItem =
    currentVersion?.items.find((item) => item.id === selectedItemId) ?? null;
  const versionIndex = versions.findIndex(
    (version) => version._id === currentVersionId
  );

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-ink">
      <RoomCanvas
        isGenerating={isGenerating}
        mode={mode}
        onPickAnchor={setPendingAnchor}
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

      {mode === "comment" && (
        <CommentComposer
          isGenerating={isGenerating}
          onClearAnchor={() => setPendingAnchor(null)}
          onSubmitted={() => setPendingAnchor(null)}
          pendingAnchor={pendingAnchor}
          roomId={roomId}
        />
      )}

      {Boolean(commentsOpen) && (
        <CommentsPanel
          comments={comments}
          currentVersionId={currentVersionId}
          onClose={() => setCommentsOpen(false)}
          onJump={handleSelectVersion}
          pinNumbers={pinNumbers}
          roomId={roomId}
        />
      )}

      {selectedItem && currentVersion ? (
        <ItemProductsSheet
          item={selectedItem}
          onClose={() => setSelectedItemId(null)}
          versionId={currentVersion._id}
        />
      ) : null}
    </main>
  );
}
