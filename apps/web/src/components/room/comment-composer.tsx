"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { ArrowUp, MapPin, X } from "lucide-react";
import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { Spinner } from "@/components/ui/spinner";
import { useIsMobile } from "@/hooks/use-mobile";
import { anchorChipLabel } from "./pin-composer";
import type { Anchor } from "./types";
import {
  COMPOSER_RADIUS,
  errorMessage,
  GLASS_RESET,
  PILL_DISPLACEMENT,
} from "./utils";

const MAX_TEXTAREA_HEIGHT = 84;

/** The example only fits where there is room for it; a phone gets the ask. */
const PLACEHOLDER_SHORT = "Comment to change something…";
const PLACEHOLDER_LONG =
  "Comment to change something… e.g. “swap the sofa for a green velvet one”";

interface CommentComposerProps {
  /**
   * Bumped when a pin lands somewhere the keyboard will not cover, so the
   * phone opens its keyboard on the tap instead of asking for a second one.
   */
  focusToken: number;
  isGenerating: boolean;
  /** The detected item under the pin, when the tap landed on one. */
  itemLabel: string | null;
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
  focusToken,
  isGenerating,
  itemLabel,
  onClearAnchor,
  onSubmitted,
  pendingAnchor,
  roomId,
}: CommentComposerProps) {
  const addComment = useMutation(api.rooms.addComment);
  const isMobile = useIsMobile();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  // Seeded with the token we mounted on, so remounting never steals focus.
  const handledFocusToken = useRef(focusToken);

  useEffect(() => {
    if (focusToken === handledFocusToken.current) {
      return;
    }
    handledFocusToken.current = focusToken;
    textareaRef.current?.focus();
  }, [focusToken]);

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
          // Refraction layers mis-size around a growing textarea on a narrow
          // screen, leaving the send button outside the glass.
          tone="dark"
        >
          {/* The chip takes a row of its own: sharing one with the text left
              the placeholder wrapping under the send button at 375px. */}
          <div className="flex w-full flex-col gap-1 p-2 font-sans">
            {Boolean(pendingAnchor) && (
              <span className="inline-flex w-fit max-w-full items-center gap-1 self-start rounded-full bg-brass/40 py-1 pr-1 pl-2 text-white text-xs">
                <MapPin className="size-3 shrink-0" />
                <span className="truncate">{anchorChipLabel(itemLabel)}</span>
                <button
                  className="shrink-0 rounded-full p-0.5 hover:bg-white/20"
                  onClick={onClearAnchor}
                  type="button"
                >
                  <X className="size-3" />
                  <span className="sr-only">Remove the pin</span>
                </button>
              </span>
            )}

            <div className="flex w-full items-end gap-2">
              <textarea
                aria-label="Comment to change something in the photo"
                className="max-h-[84px] min-h-9 min-w-0 flex-1 resize-none bg-transparent py-2 pl-2 text-sm text-white leading-snug outline-none placeholder:text-white/50 disabled:opacity-60"
                disabled={isBusy}
                onChange={(event) => {
                  setText(event.target.value);
                  resize();
                }}
                onKeyDown={handleKeyDown}
                placeholder={isMobile ? PLACEHOLDER_SHORT : PLACEHOLDER_LONG}
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
          </div>
        </LiquidGlass>
      </form>
    </div>
  );
}
