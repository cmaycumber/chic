"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { ArrowUp, MapPin } from "lucide-react";
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
import type { Anchor } from "./types";
import { errorMessage, GLASS_RESET, PIN_POPOVER_RADIUS } from "./utils";

const MAX_TEXTAREA_HEIGHT = 96;

interface PinComposerProps {
  anchor: Anchor;
  isGenerating: boolean;
  /** The detected item under the pin, when the tap landed on one. */
  itemLabel: string | null;
  onCancel: () => void;
  onSubmitted: () => void;
  roomId: Id<"rooms">;
}

/** Names what you pinned, so you can say "make it green" and be understood. */
export function anchorChipLabel(itemLabel: string | null): string {
  return itemLabel === null ? "Pinned" : `On: ${itemLabel}`;
}

/**
 * The composer that opens beside a fresh pin, the way a comment opens in a
 * design tool: it says what you pinned, takes a sentence, and sends.
 */
export function PinComposer({
  anchor,
  isGenerating,
  itemLabel,
  onCancel,
  onSubmitted,
  roomId,
}: PinComposerProps) {
  const addComment = useMutation(api.rooms.addComment);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const isBusy = isGenerating || isSending;
  const canSend = text.trim().length > 0 && !isBusy;

  // Tapping the photo moves the pin and hands focus to the tap target, so
  // the popover takes it back each time it re-targets. The draft survives.
  const focusedAnchor = useRef<Anchor | null>(null);
  useEffect(() => {
    if (focusedAnchor.current === anchor) {
      return;
    }
    focusedAnchor.current = anchor;
    textareaRef.current?.focus();
  }, [anchor]);

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
    addComment({ anchor, roomId, text: value })
      .then(() => {
        setText("");
        onSubmitted();
      })
      .catch((error: unknown) => toast.error(errorMessage(error)))
      .finally(() => setIsSending(false));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <LiquidGlass
        className={`w-full ${GLASS_RESET}`}
        cornerRadius={PIN_POPOVER_RADIUS}
        refract={false}
        tone="frost"
      >
        <div className="flex w-full flex-col gap-2 p-3 font-sans">
          <span className="inline-flex w-fit max-w-full items-center gap-1 rounded-full bg-brass/40 py-0.5 pr-2.5 pl-2 text-[11px] text-white">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{anchorChipLabel(itemLabel)}</span>
          </span>

          <textarea
            aria-label="Say what to change here"
            className="max-h-24 min-h-10 w-full resize-none bg-transparent text-sm text-white leading-snug outline-none placeholder:text-white/55 disabled:opacity-60"
            disabled={isBusy}
            onChange={(event) => {
              setText(event.target.value);
              resize();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Say what to change here…"
            ref={textareaRef}
            rows={2}
            value={text}
          />

          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-white/55">
              Enter to send · Esc to cancel
            </span>
            <Button
              disabled={!canSend}
              size="icon-sm"
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
  );
}
