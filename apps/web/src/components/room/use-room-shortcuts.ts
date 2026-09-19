"use client";

import { useEffect } from "react";
import type { RoomMode } from "./types";
import { isTypingTarget } from "./utils";

interface RoomShortcuts {
  onEscape: () => void;
  onMode: (mode: RoomMode) => void;
}

function createKeyHandler({ onEscape, onMode }: RoomShortcuts) {
  return (event: KeyboardEvent) => {
    if (isTypingTarget(event.target)) {
      return;
    }
    if (event.key === "Escape") {
      onEscape();
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    if (event.key === "c") {
      onMode("comment");
    }
    if (event.key === "s") {
      onMode("shop");
    }
  };
}

/** Escape backs out, `c` comments, `s` shops. Never while typing. */
export function useRoomShortcuts({ onEscape, onMode }: RoomShortcuts) {
  useEffect(() => {
    const handleKeyDown = createKeyHandler({ onEscape, onMode });

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onEscape, onMode]);
}
