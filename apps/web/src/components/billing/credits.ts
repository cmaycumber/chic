"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { useAction, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useCallback } from "react";
import { track } from "@/lib/analytics";
import { safeReturnPath } from "./return-path";

/** The one pack on sale. Must match `STRIPE_PRICE_EDITS_50` in `stripe.ts`. */
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

/** The message a checkout failure should show, from the server if it said. */
function checkoutErrorMessage(error: unknown): string {
  if (
    error instanceof ConvexError &&
    typeof error.data === "object" &&
    error.data !== null &&
    "message" in error.data &&
    typeof error.data.message === "string"
  ) {
    return error.data.message;
  }
  return "Checkout is unavailable right now. Please try again.";
}

/**
 * Sends a signed-in person to Stripe Checkout for the edits pack. Stripe
 * sends them to `/success`, which links back to `returnTo`.
 */
export function useStartCheckout(): (returnTo: string) => Promise<void> {
  const createCheckoutSession = useAction(api.stripe.createCheckoutSession);

  return useCallback(
    async (returnTo: string) => {
      track("checkout_started", {
        credits: EDITS_PACK.credits,
        priceUsd: EDITS_PACK.priceUsd,
      });
      let url: string;
      try {
        ({ url } = await createCheckoutSession({
          returnTo: safeReturnPath(returnTo),
        }));
      } catch (error) {
        throw new Error(checkoutErrorMessage(error), { cause: error });
      }
      window.location.assign(url);
    },
    [createCheckoutSession]
  );
}
