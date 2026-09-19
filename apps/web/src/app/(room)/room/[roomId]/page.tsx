"use client";

import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { use } from "react";
import { RoomScreen } from "@/components/room/room-screen";

export default function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);

  return <RoomScreen roomId={roomId as Id<"rooms">} />;
}
