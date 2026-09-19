"use client";

import { UploadRoomButton } from "@/components/upload-room-button";

export function TryOnYourRoomCta() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      <div className="pointer-events-auto">
        <UploadRoomButton
          label="Try this look on your room"
          variant="compact"
        />
      </div>
    </div>
  );
}
