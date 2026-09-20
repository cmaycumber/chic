import { UploadRoomButton } from "@/components/upload-room-button";

interface RoomIdeasHeroProps {
  description: string;
  /** Shown under the headline when there is anything to count. */
  roomCount?: number;
  title: string;
}

function roomsLabel(count: number): string {
  return count === 1 ? "1 room shared so far" : `${count} rooms shared so far`;
}

/** The top of every ideas page: what this is, and how to be in it. */
export function RoomIdeasHero({
  description,
  roomCount,
  title,
}: RoomIdeasHeroProps) {
  return (
    <section className="container mx-auto px-4 pt-12 pb-10 sm:px-6 md:pt-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-sans text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
          Real rooms on Chic
        </p>
        <h1 className="mt-3 font-serif text-4xl text-foreground leading-[1.1] tracking-tight md:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          {description}
        </p>
        <div className="mt-7 flex flex-col items-center gap-2">
          <UploadRoomButton label="Upload your room" variant="compact" />
          <p className="text-muted-foreground text-xs">
            Free, no sign-up. About 20 seconds a change.
          </p>
        </div>
        {roomCount !== undefined && roomCount > 0 ? (
          <p className="mt-6 text-muted-foreground/80 text-sm">
            {roomsLabel(roomCount)}
          </p>
        ) : null}
      </div>
    </section>
  );
}
