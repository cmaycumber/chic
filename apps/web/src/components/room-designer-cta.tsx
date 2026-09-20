import { UploadRoomButton } from "@/components/upload-room-button";

interface RoomDesignerCtaProps {
  /** Lowercase room name, e.g. "living room". Omit for the whole gallery. */
  roomLabel?: string;
}

/** The ask at the bottom of an ideas page: your room, changed by asking. */
export function RoomDesignerCta({ roomLabel }: RoomDesignerCtaProps) {
  const subject = roomLabel ? `your ${roomLabel}` : "your room";

  return (
    <section className="container mx-auto px-4 pb-20 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 rounded-3xl border border-border bg-muted/30 px-6 py-12 text-center sm:px-12">
        <h2 className="font-serif text-3xl text-foreground leading-tight md:text-4xl">
          Now do this to {subject}
        </h2>
        <p className="max-w-xl text-muted-foreground">
          Upload a photo, pin a comment on whatever you want different, and tap
          any piece of furniture to shop it on Amazon. Share the before and
          after when you like it.
        </p>
        <UploadRoomButton label="Upload a photo" variant="compact" />
        <p className="text-muted-foreground text-xs">
          Free, no sign-up required.
        </p>
      </div>
    </section>
  );
}
