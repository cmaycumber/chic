"use client";

import { CheckCircle } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { EDITS_PACK } from "./credits";

const TRACKED_KEY_PREFIX = "chic:purchase-tracked:";

/** Count each checkout once, however often the page is reloaded. */
function trackPurchaseOnce(checkoutId: string | null) {
  const key = `${TRACKED_KEY_PREFIX}${checkoutId ?? "unknown"}`;
  try {
    if (sessionStorage.getItem(key)) {
      return;
    }
    sessionStorage.setItem(key, "1");
  } catch {
    // Storage blocked: counting twice beats not counting.
  }
  track("credits_purchased", { credits: EDITS_PACK.credits });
}

interface PurchaseConfirmationProps {
  checkoutId: string | null;
  returnTo: string;
}

export function PurchaseConfirmation({
  checkoutId,
  returnTo,
}: PurchaseConfirmationProps) {
  useEffect(() => trackPurchaseOnce(checkoutId), [checkoutId]);

  const backToRoom = returnTo.startsWith("/room/");

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-greige/60 bg-white p-8 text-center shadow-sm">
        <div className="flex size-14 items-center justify-center rounded-full bg-brass/15">
          <CheckCircle className="size-8 text-brass" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-normal font-serif text-3xl text-ink">
            {EDITS_PACK.credits} edits added
          </h1>
          <p className="font-light text-base text-ink/70 leading-relaxed">
            They never expire. If your balance has not caught up yet, give it a
            moment.
          </p>
        </div>
        <Button asChild className="h-11 w-full rounded-full" variant="brass">
          <Link href={returnTo as Route}>
            {backToRoom ? "Back to your room" : "Back to your rooms"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
