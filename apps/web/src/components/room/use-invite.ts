"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { useConvexAuth, useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { errorMessage } from "./utils";

const INVITE_PARAM = "invite";

/** The token in `?invite=…`, read once so a rewrite cannot re-trigger a join. */
function readInviteToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return new URLSearchParams(window.location.search).get(INVITE_PARAM);
}

/** Drop the token from the address bar; it has been spent. */
function stripInviteToken() {
  const url = new URL(window.location.href);
  url.searchParams.delete(INVITE_PARAM);
  window.history.replaceState(null, "", url.toString());
}

/**
 * Accepts an invite link on arrival.
 *
 * Returns true while the join is in flight, because until it lands the room
 * query answers "not found" for someone who is, in fact, welcome here.
 */
export function useJoinWithInvite(roomId: Id<"rooms">): boolean {
  const join = useMutation(api.rooms.joinWithInvite);
  const { isAuthenticated } = useConvexAuth();
  // Undefined until the browser has been asked: the server cannot see the
  // query string, so reading it during render would break hydration.
  const [token, setToken] = useState<string | null | undefined>();
  const [hasJoined, setHasJoined] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    setToken(readInviteToken());
  }, []);

  useEffect(() => {
    if (!(token && isAuthenticated) || hasRun.current) {
      return;
    }
    hasRun.current = true;

    join({ roomId, token })
      .catch((error: unknown) => toast.error(errorMessage(error)))
      .finally(() => {
        stripInviteToken();
        setHasJoined(true);
      });
  }, [isAuthenticated, join, roomId, token]);

  return Boolean(token) && !hasJoined;
}
