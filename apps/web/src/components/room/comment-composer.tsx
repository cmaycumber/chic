"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { ArrowUp, MapPin, X } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { Spinner } from "@/components/ui/spinner";
import type { Anchor } from "./types";
import {
  COMPOSER_RADIUS,
  errorMessage,
  GLASS_RESET,
  PILL_DISPLACEMENT,
} from "./utils";

const MAX_TEXTAREA_HEIGHT = 84;

interface CommentComposerProps {
  isGenerating: boolean;
  onClearAnchor: () => void;
  onSubmitted: () => void;
  pendingAnchor: Anchor | null;
  roomId: Id<"rooms">;
}

/**
 * The only way to change the photo: say what you want in plain words, with an
 * optional pin telling us where you mean.
 */
export function CommentComposer({
  isGenerating,
  onClearAnchor,
  onSubmitted,
  pendingAnchor,
  roomId,
}: CommentComposerProps) {
  const addComment = useMutation(api.rooms.addComment);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const isBusy = isGenerating || isSending;
  const canSend = text.trim().length > 0 && !isBusy;

  const resize = () => {
    const node = textareaRef.current;
    if (!node) {
      return;
    }
    node.style.height = "0px";
    node.style.height = `${Math.min(node.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || isBusy) {
      return;
    }
    setIsSending(true);
    addComment({
      anchor: pendingAnchor ?? undefined,
      roomId,
      text: value,
    })
      .then(() => {
        setText("");
        onSubmitted();
        requestAnimationFrame(resize);
      })
      .catch((error: unknown) => toast.error(errorMessage(error)))
      .finally(() => setIsSending(false));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {!pendingAnchor && (
        <p className="pointer-events-none rounded-full bg-black/35 px-3 py-1 text-[11px] text-white/70 backdrop-blur-sm">
          Tap the photo to pin your comment
        </p>
      )}

      <form
        className="pointer-events-auto w-full max-w-xl"
        onSubmit={handleSubmit}
      >
        <LiquidGlass
          className={`w-full ${GLASS_RESET}`}
          cornerRadius={COMPOSER_RADIUS}
          displacementScale={PILL_DISPLACEMENT}
          tone="dark"
        >
          <div className="flex w-full items-end gap-2 p-2 font-sans">
            {Boolean(pendingAnchor) && (
              <span className="mb-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--accent-brass)]/30 py-1 pr-1 pl-2 text-white text-xs">
                <MapPin className="size-3" />
                Pinned
                <button
                  className="rounded-full p-0.5 hover:bg-white/20"
                  onClick={onClearAnchor}
                  type="button"
                >
                  <X className="size-3" />
                  <span className="sr-only">Remove the pin</span>
                </button>
              </span>
            )}

            <textarea
              aria-label="Comment to change something in the photo"
              className="max-h-[84px] min-h-9 flex-1 resize-none bg-transparent py-2 pl-2 text-sm text-white leading-snug outline-none placeholder:text-white/50 disabled:opacity-60"
              disabled={isBusy}
              onChange={(event) => {
                setText(event.target.value);
                resize();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Comment to change something… e.g. “swap the sofa for a green velvet one”"
              ref={textareaRef}
              rows={1}
              value={text}
            />

            <Button
              className="mb-0.5 shrink-0"
              disabled={!canSend}
              size="icon"
              type="submit"
              variant="glass-brass"
            >
              {isBusy ? <Spinner /> : <ArrowUp className="size-4" />}
              <span className="sr-only">Send comment</span>
            </Button>
          </div>
        </LiquidGlass>
      </form>
    </div>
  );
}
