"use client";

import Link from "next/link";
import { LOGO_HEIGHT, LOGO_WIDTH, Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface PublicHeaderProps {
  /** Optional element rendered in the centre of the header row. */
  center?: React.ReactNode;
  isAuthenticated?: boolean;
  /**
   * bar: solid header for content pages.
   * floating: no bar, white logo and a single glass action over imagery.
   */
  variant?: "bar" | "floating";
}

export function PublicHeader({
  center,
  isAuthenticated: serverAuth,
  variant = "bar",
}: PublicHeaderProps) {
  const { data: session } = useSession();
  const clientAuth = Boolean(session);
  const hasSession = serverAuth ?? clientAuth;
  // An anonymous session is a real session, but there is still no account to
  // come back to, so these visitors keep seeing the sign-up invitation.
  const isAnonymous = Boolean(session?.user.isAnonymous);
  const isAuthenticated = hasSession && !isAnonymous;
  const isFloating = variant === "floating";

  const primaryAction = isAuthenticated ? (
    <Button
      asChild
      className="h-9 px-4 text-sm"
      size="sm"
      variant={isFloating ? "glass-dark" : "glass"}
    >
      <Link href="/rooms">My rooms</Link>
    </Button>
  ) : (
    <Button
      asChild
      className="h-9 px-4 text-sm"
      size="sm"
      variant={isFloating ? "glass-dark" : "glass-brass"}
    >
      <Link href="/signup">Sign up</Link>
    </Button>
  );

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full",
        isFloating
          ? "pt-[env(safe-area-inset-top)]"
          : "bg-background/80 backdrop-blur-xl"
      )}
    >
      <div className="relative flex h-14 items-center justify-between px-4 sm:h-16 sm:px-6">
        {center ? (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {center}
          </div>
        ) : null}
        <Link className="flex items-center" href="/">
          <Logo
            className={cn(
              isFloating
                ? "text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)]"
                : "text-foreground"
            )}
            height={LOGO_HEIGHT}
            width={LOGO_WIDTH}
          />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          {isFloating ? null : (
            <Button asChild className="h-9 text-sm" size="sm" variant="ghost">
              <Link href="/pricing">Pricing</Link>
            </Button>
          )}
          {isFloating || isAuthenticated ? null : (
            <Button asChild className="h-9 text-sm" size="sm" variant="ghost">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
          {primaryAction}
        </div>
      </div>
    </header>
  );
}
