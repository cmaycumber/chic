"use client";

import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/**
 * Renders children only once the Convex client is authenticated.
 *
 * Private queries throw when they run without a token, so signed-in pages
 * wait here instead of firing queries during the auth handshake.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-background">
        <Spinner className="size-6 text-muted-foreground" />
        <span className="sr-only">Signing you in</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="font-serif text-2xl text-ink">Please sign in</p>
        <p className="max-w-sm text-ink/70 text-sm">
          Your session has ended. Sign in again to get back to your rooms.
        </p>
        <Button asChild variant="glass-brass">
          <Link href="/login?callbackUrl=%2Frooms">Sign in</Link>
        </Button>
      </div>
    );
  }

  return children;
}
