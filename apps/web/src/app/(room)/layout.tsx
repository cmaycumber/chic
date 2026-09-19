import { RoomAuthGate } from "@/components/room/room-auth-gate";

/**
 * Immersive shell for the room screen: no site header, no page scroll. The
 * photo fills the viewport and every control floats on top of it.
 */
export default function RoomLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoomAuthGate>
      <div className="h-dvh w-full overflow-hidden bg-ink text-white">
        {children}
      </div>
    </RoomAuthGate>
  );
}
