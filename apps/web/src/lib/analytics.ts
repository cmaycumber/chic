/**
 * Product analytics events. Every funnel step Chic cares about is named
 * here, so the PostHog funnels (land → upload → comment → render → shop →
 * pay) read the same event names everywhere.
 */
import posthog from "posthog-js";

export interface AnalyticsEvents {
  checkout_started: { credits: number; priceUsd: number };
  comment_submitted: {
    anchored: boolean;
    roomId: string;
    source: "composer" | "pin";
  };
  credits_purchased: { credits: number };
  out_of_credits_shown: { balance: number; trigger: string };
  product_added_to_room: { retailer?: string; roomId: string };
  product_clicked: {
    price?: number;
    retailer?: string;
    source: "room" | "share";
  };
  product_sheet_opened: { item: string; roomId: string };
  room_created: { anonymous: boolean; roomId: string };
  room_shared: { method: "clipboard" | "share-sheet"; roomId: string };
  signup_completed: { method: string };
  upload_started: { source: string };
}

export type AnalyticsEvent = keyof AnalyticsEvents;

/** Capture one event; a no-op when PostHog is not configured. */
export function track<E extends AnalyticsEvent>(
  event: E,
  properties: AnalyticsEvents[E]
): void {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return;
  }
  posthog.capture(event, properties);
}
