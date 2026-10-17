"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { track } from "@/lib/analytics";
import { authClient } from "@/lib/auth-client";
import { safeReturnPath } from "./return-path";

/** The one pack on sale. Must match the checkout product in `auth.ts`. */
export const EDITS_PACK = {
  credits: 50,
  priceUsd: 5,
  slug: "edits-50",
} as const;

/** Query param that starts checkout once a guest has signed up. */
export const CHECKOUT_PARAM = "checkout";

const DRAFT_KEY_PREFIX = "chic:draft:";

export interface Credits {
  balance: number;
  freeEditsLeft?: number;
}

/**
 * What the signed-in person can still render: undefined while loading, null
 * when billing is off (no balance to show).
 */
export function useCredits(enabled = true): Credits | null | undefined {
  return useQuery(api.billing.getCredits, enabled ? {} : "skip");
}

/** "2 free edits left" while on free edits, "48 edits left" after. */
export function creditsLabel(credits: Credits): string {
  if (credits.balance <= 0) {
    return "No edits left";
  }
  const isFree = credits.freeEditsLeft !== undefined;
  const noun = credits.balance === 1 ? "edit" : "edits";
  return `${credits.balance} ${isFree ? "free " : ""}${noun} left`;
}

/**
 * Keep a comment that was refused for want of credits, so it is still in the
 * composer after sign-up and checkout bring the person back to the room.
 */
export function saveDraft(roomId: string, text: string): void {
  try {
    sessionStorage.setItem(`${DRAFT_KEY_PREFIX}${roomId}`, text);
  } catch {
    // Storage blocked: the draft is a convenience, not a promise.
  }
}

/** The saved draft for a room, removed as it is read. */
export function takeDraft(roomId: string): string | null {
  try {
    const key = `${DRAFT_KEY_PREFIX}${roomId}`;
    const draft = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    return draft;
  } catch {
    return null;
  }
}

/**
 * Send a signed-in person to Polar's checkout for the edits pack. Polar sends
 * them to `/success`, which links back to `returnTo`.
 */
export async function startCheckout(returnTo: string): Promise<void> {
  track("checkout_started", {
    credits: EDITS_PACK.credits,
    priceUsd: EDITS_PACK.priceUsd,
  });
  const back = safeReturnPath(returnTo);
  const { data, error } = await authClient.checkout({
    redirect: false,
    returnUrl: back,
    slug: EDITS_PACK.slug,
    successUrl: `/success?checkout_id={CHECKOUT_ID}&returnTo=${encodeURIComponent(back)}`,
  });
  if (error || !data?.url) {
    throw new Error("Checkout is unavailable right now. Please try again.");
  }
  window.location.assign(data.url);
}
