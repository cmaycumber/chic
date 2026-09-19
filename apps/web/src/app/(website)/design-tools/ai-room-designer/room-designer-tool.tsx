"use client";

import { UploadRoomButton } from "@/components/upload-room-button";

export function RoomDesignerTool() {
  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-[32px] bg-ink p-8 text-center shadow-xl">
      <div className="space-y-2">
        <h2 className="font-normal font-serif text-2xl text-white">
          Upload a photo to start
        </h2>
        <p className="text-sm text-white/70">
          Drop in a photo of your room, then leave a comment to change anything
          about it.
        </p>
      </div>
      <UploadRoomButton variant="hero" />
    </div>
  );
}
