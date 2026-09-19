"use client";

import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { RoomVersion } from "./types";
import { versionLabel } from "./utils";

interface VersionStripProps {
  currentVersionId: string | null;
  /** The strip clears the composer when it is on screen. */
  hasComposer: boolean;
  onSelect: (versionId: Id<"roomVersions">) => void;
  versions: RoomVersion[];
}

/** Every render of this room, oldest first. Tap one to bring it back. */
export function VersionStrip({
  currentVersionId,
  hasComposer,
  onSelect,
  versions,
}: VersionStripProps) {
  const currentRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!currentVersionId) {
      return;
    }
    currentRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [currentVersionId]);

  if (versions.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-30 flex justify-center px-3",
        hasComposer
          ? "bottom-[7.5rem]"
          : "bottom-[max(1rem,env(safe-area-inset-bottom))]"
      )}
    >
      <div className="liquid-glass liquid-glass-dark pointer-events-auto flex max-w-full gap-2 overflow-x-auto rounded-3xl p-2">
        {versions.map((version, index) => {
          const isCurrent = version._id === currentVersionId;
          return (
            <button
              className={cn(
                "group relative h-16 w-20 shrink-0 overflow-hidden rounded-2xl bg-black/40 transition-all",
                isCurrent
                  ? "ring-2 ring-[var(--accent-brass)]"
                  : "opacity-70 hover:opacity-100"
              )}
              key={version._id}
              onClick={() => onSelect(version._id)}
              ref={isCurrent ? currentRef : undefined}
              type="button"
            >
              {version.imageUrl ? (
                <Image
                  alt=""
                  className="object-cover"
                  fill
                  sizes="80px"
                  src={version.imageUrl}
                />
              ) : null}
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1 pt-3 pb-1 text-[10px] text-white">
                {versionLabel(index)}
              </span>
              <span className="sr-only">
                Show {versionLabel(index)} of this room
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
