"use client";

import { ArrowUp, Camera, Loader2, Plus } from "lucide-react";
import type {
  ChangeEvent,
  KeyboardEvent,
  ClipboardEvent as ReactClipboardEvent,
} from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import {
  busyLabel,
  HiddenFileInput,
  useUploadController,
} from "@/components/upload-room-button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const COMPOSER_CORNER_RADIUS = 999;
const COMPOSER_DISPLACEMENT_SCALE = 25;
const COMPOSER_PLACEHOLDER = "What would you change about your room?";
/** The long ask runs under the send button once the bar is phone-width. */
const COMPOSER_PLACEHOLDER_SHORT = "What would you change?";

interface RoomComposerBarProps {
  className?: string;
}

/** The first image on the clipboard, whether it arrived as a file or an item. */
function imageFromClipboard(data: DataTransfer | null): File | null {
  if (!data) {
    return null;
  }

  const dropped = Array.from(data.files).find((file) =>
    file.type.startsWith("image/")
  );
  if (dropped) {
    return dropped;
  }

  for (const item of Array.from(data.items)) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) {
        return file;
      }
    }
  }

  return null;
}

export function RoomComposerBar({ className }: RoomComposerBarProps) {
  const isMobile = useIsMobile();
  const [text, setText] = useState("");
  const controller = useUploadController({ initialComment: text });
  const { openPicker, submitFile } = controller;
  // The same paste reaches both the element handler and the document
  // listener; whichever gets there first claims it.
  const handledPasteRef = useRef<Event | null>(null);

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
  }, []);

  const acceptPaste = useCallback(
    (data: DataTransfer | null, nativeEvent: Event) => {
      if (handledPasteRef.current === nativeEvent) {
        return false;
      }
      const file = imageFromClipboard(data);
      if (!file) {
        return false;
      }
      handledPasteRef.current = nativeEvent;
      submitFile(file);
      return true;
    },
    [submitFile]
  );

  const handlePaste = useCallback(
    (event: ReactClipboardEvent<HTMLElement>) => {
      if (acceptPaste(event.clipboardData, event.nativeEvent)) {
        event.preventDefault();
      }
    },
    [acceptPaste]
  );

  // Catches a paste made while nothing in the composer has focus. Scoped to
  // this component, which only the home page renders.
  useEffect(() => {
    const onDocumentPaste = (event: ClipboardEvent) => {
      if (acceptPaste(event.clipboardData, event)) {
        event.preventDefault();
      }
    };
    document.addEventListener("paste", onDocumentPaste);
    return () => document.removeEventListener("paste", onDocumentPaste);
  }, [acceptPaste]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") {
        return;
      }
      event.preventDefault();
      openPicker();
    },
    [openPicker]
  );

  return (
    <div
      className={cn("flex w-full flex-col items-center gap-3", className)}
      onPaste={handlePaste}
      {...controller.dragHandlers}
    >
      <HiddenFileInput controller={controller} />
      <Button
        className="h-9 px-4 text-xs uppercase tracking-wider"
        disabled={controller.isBusy}
        onClick={controller.openPicker}
        type="button"
        variant="glass-dark"
      >
        <Camera className="size-3.5" />
        Upload your room
      </Button>
      <LiquidGlass
        className={cn(
          "flex items-center gap-2 p-2 transition-opacity sm:gap-3",
          controller.isDragActive && "opacity-80"
        )}
        cornerRadius={COMPOSER_CORNER_RADIUS}
        displacementScale={COMPOSER_DISPLACEMENT_SCALE}
        hostClassName="w-full"
        refract
        tone="frost"
      >
        <Button
          className="shrink-0"
          disabled={controller.isBusy}
          onClick={controller.openPicker}
          size="icon-lg"
          type="button"
          variant="glass-inset"
        >
          {controller.isBusy ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Plus className="size-5" />
          )}
          <span className="sr-only">Add a photo of your room</span>
        </Button>
        {controller.isBusy ? (
          <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-white/80 sm:text-base">
            <span className="truncate">{busyLabel(controller.busy)}</span>
          </div>
        ) : (
          <input
            aria-label="What would you change about your room?"
            className="min-w-0 flex-1 truncate bg-transparent text-sm text-white placeholder:text-white/60 focus:outline-none sm:text-base"
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              isMobile ? COMPOSER_PLACEHOLDER_SHORT : COMPOSER_PLACEHOLDER
            }
            type="text"
            value={text}
          />
        )}
        <Button
          className="shrink-0"
          disabled={controller.isBusy}
          onClick={controller.openPicker}
          size="icon-lg"
          type="button"
          variant="glass-brass"
        >
          <ArrowUp className="size-5" />
          <span className="sr-only">Send</span>
        </Button>
      </LiquidGlass>
    </div>
  );
}
