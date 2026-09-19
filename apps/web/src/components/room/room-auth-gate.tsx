"use client";

import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

/** How long to wait for the Convex client to pick up the new session. */
const SESSION_TIMEOUT_MS = 10_000;

function hasInviteParam(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return new URLSearchParams(window.location.search).has("invite");
}

function Waiting() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-ink">
      <Spinner className="size-6 text-white/70" />
      <span className="sr-only">Opening the room you were invited to</span>
    </div>
  );
}

/**
 * The room shell's front door.
 *
 * Someone arriving on an invite link has usually never been here, and the
 * point of a link is that it works on the first click — so they are signed in
 * anonymously on the spot rather than sent to a sign-up form. Everyone else
 * gets the ordinary gate.
 */
export function RoomAuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  // Undefined until the browser has been asked. The server cannot see the
  // query string, so reading it during render would make this tree hydrate
  // into something the server never sent.
  const [isInvited, setIsInvited] = useState<boolean | undefined>();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    setIsInvited(hasInviteParam());
  }, []);

  useEffect(() => {
    if (!isInvited || isLoading || isAuthenticated || isSigningIn) {
      return;
    }
    setIsSigningIn(true);

    const run = async () => {
      // The Convex client can lag behind a session that already exists, and
      // signing in anonymously over one would drop the account it belongs to.
      const { data: session } = await authClient.getSession();
      if (session) {
        return;
      }
      const { error } = await authClient.signIn.anonymous();
      if (error) {
        setHasFailed(true);
      }
    };

    run().catch(() => setHasFailed(true));
  }, [isAuthenticated, isInvited, isLoading, isSigningIn]);

  // A session that never arrives should not spin forever behind a spinner.
  useEffect(() => {
    if (!(isSigningIn && !isAuthenticated)) {
      return;
    }
    const timer = setTimeout(() => setHasFailed(true), SESSION_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isAuthenticated, isSigningIn]);

  // Before the query string has been read, and for everyone who arrived
  // without a link, this is the ordinary gate — which is also what the server
  // rendered, so hydration has nothing to disagree about.
  if (isInvited && !(isAuthenticated || hasFailed)) {
    return <Waiting />;
  }

  return <AuthGate>{children}</AuthGate>;
}
