"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * A room that cannot be read — a mistyped or truncated link the backend
 * rejects outright, or a connection that dropped mid-load — lands here
 * rather than on the bare framework error page.
 */
export default function RoomError({ retry }: { retry: () => void }) {
  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center gap-4 bg-ink px-6 text-center">
      <p className="font-serif text-2xl text-white">
        We couldn't open this room
      </p>
      <p className="max-w-sm text-sm text-white/60">
        The link may be incomplete, or the room was deleted. Check the link, or
        try again if your connection dropped.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={retry} type="button" variant="glass">
          Try again
        </Button>
        <Button asChild variant="glass-brass">
          <Link href="/rooms">Back to your rooms</Link>
        </Button>
      </div>
    </div>
  );
}
