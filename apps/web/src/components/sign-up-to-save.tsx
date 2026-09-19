"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEFAULT_CALLBACK_URL = "/rooms";

/**
 * Whether the visitor is using the product without an account.
 *
 * `undefined` while the current user is still loading, so callers can hold
 * off rather than flash a sign-up prompt at someone who already signed up.
 */
export function useIsAnonymous(): boolean | undefined {
  const user = useQuery(api.auth.getCurrentUser);
  if (user === undefined) {
    return;
  }
  return Boolean(user?.isAnonymous);
}

/** Sign-up link that brings the visitor back to the page they were on. */
export function useSignUpHref(): Route {
  const pathname = usePathname();
  const callbackUrl = pathname || DEFAULT_CALLBACK_URL;
  return `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}` as Route;
}

/**
 * Replaces the account menu for anonymous visitors: their rooms are real,
 * they just have nowhere to come back to until they sign up.
 */
export function SignUpToSaveButton({ className }: { className?: string }) {
  const href = useSignUpHref();

  return (
    <Button asChild className={cn("shrink-0", className)} variant="glass-brass">
      <Link href={href}>
        {/* The whole offer does not fit beside the nav at 375px. */}
        <span className="sm:hidden">Save</span>
        <span className="hidden sm:inline">Sign up to save</span>
      </Link>
    </Button>
  );
}

/** The same offer, sized for the floating chrome over a room photo. */
export function SaveYourDesignsPill({ className }: { className?: string }) {
  const href = useSignUpHref();

  return (
    <Button
      asChild
      className={cn("h-8 px-3 text-xs", className)}
      size="sm"
      variant="glass-brass"
    >
      <Link href={href}>Save your designs</Link>
    </Button>
  );
}
