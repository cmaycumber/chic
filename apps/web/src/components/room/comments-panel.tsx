"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { Spinner } from "@/components/ui/spinner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { Anchor, RoomComment } from "./types";
import {
  errorMessage,
  GLASS_RESET,
  PANEL_DISPLACEMENT,
  PANEL_RADIUS,
} from "./utils";

type RetryHandler = (text: string, anchor: Anchor | undefined) => void;

interface CommentsPanelProps {
  comments: RoomComment[];
  currentVersionId: string | null;
  onClose: () => void;
  onJump: (versionId: Id<"roomVersions">) => void;
  pinNumbers: Map<string, number>;
  roomId: Id<"rooms">;
}

function CommentRow({
  comment,
  isCurrent,
  onJump,
  onRetry,
  pinNumber,
}: {
  comment: RoomComment;
  isCurrent: boolean;
  onJump: (versionId: Id<"roomVersions">) => void;
  onRetry: RetryHandler;
  pinNumber: number | undefined;
}) {
  const resultVersionId =
    comment.status === "applied" ? comment.resultVersionId : undefined;
  const time = formatDistanceToNow(new Date(comment._creationTime), {
    addSuffix: true,
  });

  return (
    <li
      className={cn(
        "rounded-2xl p-3 transition-colors",
        isCurrent ? "bg-white/15" : "bg-white/5"
      )}
    >
      <div className="flex items-start gap-2">
        {pinNumber !== undefined && (
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-brass)] text-[10px] text-white">
            {pinNumber}
          </span>
        )}

        <div className="min-w-0 flex-1">
          {resultVersionId ? (
            <button
              className="text-left text-sm text-white leading-snug hover:underline"
              onClick={() => onJump(resultVersionId)}
              type="button"
            >
              {comment.text}
            </button>
          ) : (
            <p className="text-sm text-white leading-snug">{comment.text}</p>
          )}

          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-white/50">
            {comment.status === "pending" && <Spinner className="size-3" />}
            <span>{time}</span>
          </p>

          {comment.status === "failed" && (
            <div className="mt-2 flex flex-col items-start gap-2">
              <p className="text-[var(--accent-coral)] text-xs">
                {comment.error ?? "This change could not be applied."}
              </p>
              <Button
                onClick={() => onRetry(comment.text, comment.anchor)}
                size="sm"
                type="button"
                variant="glass-dark"
              >
                Try again
              </Button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function CommentsList({
  comments,
  currentVersionId,
  onJump,
  onRetry,
  pinNumbers,
}: {
  comments: RoomComment[];
  currentVersionId: string | null;
  onJump: (versionId: Id<"roomVersions">) => void;
  onRetry: RetryHandler;
  pinNumbers: Map<string, number>;
}) {
  if (comments.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-sm text-white/60">
        No comments yet. Tap the photo and tell us what to change.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {comments.map((comment) => (
        <CommentRow
          comment={comment}
          isCurrent={
            comment.resultVersionId !== undefined &&
            comment.resultVersionId === currentVersionId
          }
          key={comment._id}
          onJump={onJump}
          onRetry={onRetry}
          pinNumber={pinNumbers.get(comment._id)}
        />
      ))}
    </ul>
  );
}

/** Every change you have asked for, newest first. */
export function CommentsPanel({
  comments,
  currentVersionId,
  onClose,
  onJump,
  pinNumbers,
  roomId,
}: CommentsPanelProps) {
  const isMobile = useIsMobile();
  const addComment = useMutation(api.rooms.addComment);
  const newestFirst = [...comments].reverse();

  const handleRetry: RetryHandler = (text, anchor) => {
    addComment({ anchor, roomId, text }).catch((error: unknown) =>
      toast.error(errorMessage(error))
    );
  };

  const list = (
    <CommentsList
      comments={newestFirst}
      currentVersionId={currentVersionId}
      onJump={onJump}
      onRetry={handleRetry}
      pinNumbers={pinNumbers}
    />
  );

  if (isMobile) {
    return (
      <Drawer
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
        open
      >
        <DrawerContent className="max-h-[75dvh] border-white/10 bg-ink/95 text-white">
          <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2">
            <div>
              <DrawerTitle className="font-serif text-lg text-white">
                Comments
              </DrawerTitle>
              <DrawerDescription className="text-white/60 text-xs">
                Every change you have asked for.
              </DrawerDescription>
            </div>
            <Button
              onClick={onClose}
              size="icon-sm"
              type="button"
              variant="glass-dark"
            >
              <X className="size-4" />
              <span className="sr-only">Close comments</span>
            </Button>
          </div>
          <div className="overflow-y-auto px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {list}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <aside className="fixed top-24 left-4 z-40 w-[340px] max-w-[calc(100vw-2rem)]">
      <LiquidGlass
        className={`w-full ${GLASS_RESET}`}
        cornerRadius={PANEL_RADIUS}
        displacementScale={PANEL_DISPLACEMENT}
        refract={false}
        tone="panel"
      >
        <div className="flex max-h-[70vh] w-full flex-col overflow-hidden font-sans">
          <div className="flex shrink-0 items-center justify-between gap-3 p-4 pb-2">
            <p className="font-serif text-lg text-white">Comments</p>
            <Button
              onClick={onClose}
              size="icon-sm"
              type="button"
              variant="glass-dark"
            >
              <X className="size-4" />
              <span className="sr-only">Close comments</span>
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-4">
            {list}
          </div>
        </div>
      </LiquidGlass>
    </aside>
  );
}
