# PostHog analytics

What Chic tracks, why, and the funnels and breakdowns to build in PostHog once the project is in the Automatons org and `NEXT_PUBLIC_POSTHOG_KEY` is set.

Event names and payloads are defined once, in `apps/web/src/lib/analytics.ts`'s `AnalyticsEvents` interface — that file is the source of truth; this doc explains how to use them.

## Where traffic comes from

Three dimensions, all available on every event (person properties, or a super property) without any extra setup:

- **`$initial_referring_domain`** — the site that linked here on this person's first visit (set once per person by posthog-js).
- **`$initial_utm_source`** (and `$initial_utm_medium`, `$initial_utm_campaign`) — UTM params from that first visit. ChatGPT's links carry `utm_source=chatgpt&utm_medium=app&utm_campaign=chatgpt_app` (see `shareUrl` in `apps/web/src/lib/chatgpt-app/server.ts`), so filtering `$initial_utm_source = chatgpt` isolates everyone who arrived from the ChatGPT app.
- **`entry_source`** — one simple breakdown value Chic computes itself in `apps/web/src/instrumentation-client.ts`: `utm_source`, else the referring domain, else `"direct"`. Registered with `posthog.register_once`, so it reflects the *first* visit even if someone returns later through a different path (e.g. a shared room link). Use this for a single-column breakdown instead of combining the two `$initial_*` properties.

Pageviews fire on every App Router navigation (`capture_pageview: "history_change"`), so the standard Web Analytics / Paths views work across the whole app, not just full page loads.

## Identity

- A guest is identified by their Better Auth user id as soon as they get an anonymous session (no email or name attached) — see `apps/web/src/components/identify-user.tsx`.
- Signing up replaces that anonymous user with a new one server-side (`onLinkAccount` in `apps/backend/convex/auth.ts`), so the client calls `posthog.alias(newId, anonymousId)` before identifying the new id with email/name. Without this, PostHog would start a second person at sign-up and split the funnel between "guest" and "account" activity.
- A ChatGPT user is never a Chic session, so their events carry a server-generated `distinctId` instead (see "ChatGPT app events" below).

## Funnel: landing → purchase

Build this as a PostHog funnel using these exact event names, in order:

1. `$pageview` (the first one; filter to the landing page path if needed)
2. `upload_started`
3. `room_created`
4. `comment_submitted`
5. *(render seen — no dedicated event; use `room_created`/`comment_submitted`'s implicit next step, or add one later if render abandonment needs its own number)*
6. `product_sheet_opened`
7. `product_clicked`
8. `out_of_credits_shown`
9. `checkout_started`
10. `credits_purchased`

Steps 4 and 8–10 are fired by the billing half of this work (comment/credits/checkout flows); 1–3 and 5–7 are in this change.

Break any step down by `entry_source` to compare how ChatGPT-sourced traffic converts versus direct/organic/referral traffic.

## Events

| Event | Properties | Fired from |
|---|---|---|
| `upload_started` | `source` (`"picker" \| "drag-drop" \| "paste"`) | `components/upload-room-button.tsx`, on any entry point into the upload flow, right after validation passes |
| `room_created` | `anonymous` (bool), `roomId` | `components/upload-room-button.tsx`, right after `rooms.create` resolves |
| `room_shared` | `method` (`"clipboard" \| "share-sheet"`), `roomId` | `components/room/room-topbar.tsx`, when the share button is tapped (method is a best-effort guess at which path `deliverShareLink` will take, made the same way it decides) |
| `product_sheet_opened` | `item`, `roomId` | `components/room/item-products-sheet.tsx`, when the sheet mounts for an item |
| `product_clicked` | `price?`, `retailer?`, `source` (`"room" \| "share"`) | The "View on {retailer}" link in `item-products-sheet.tsx` and `share-shop.tsx`, and `ProductChip` (used in the room's comment panel and on the public share page) |
| `product_added_to_room` | `retailer?`, `roomId` | `components/room/item-products-sheet.tsx`, after `rooms.addProductComment` resolves |
| `signup_completed` | `method` (currently always `"email"`) | `components/sign-up-form.tsx`, on successful sign-up |
| `comment_submitted` | `anchored`, `roomId`, `source` | Billing/comment flow (not this change) |
| `out_of_credits_shown` | `balance`, `trigger` | Billing flow (not this change) |
| `checkout_started` | `credits`, `priceUsd` | Billing flow (not this change) |
| `credits_purchased` | `credits` | Billing flow (not this change) |

## ChatGPT app events

The MCP server (`apps/web/src/lib/chatgpt-app/server.ts`) captures server-side with `posthog-node`, since a ChatGPT user never loads a Chic page:

| Event | Properties | Notes |
|---|---|---|
| `chatgpt_tool_called` | `tool` (`"redesign_room" \| "get_room" \| "shop_item"`), `status` (`"ok" \| "error"`), `isError`, `ms`, `products` | One per tool call. `distinctId` is `chatgpt:<sha-256 of the OpenAI subject, first 32 hex chars>` — the same hash `ownerFor` in `apps/backend/convex/chatgpt.ts` uses for the Convex `userId`, so a ChatGPT person's analytics line up with their rooms. Calls with no subject use `chatgpt-anon` instead of Convex's shared `chatgpt-app` id, so they don't all collapse into one PostHog person. |

Capture is best-effort: a PostHog outage never fails a tool call, and the client is flushed immediately (rather than left on its usual timer) because the route can freeze right after the response in a serverless runtime.

Filter these to `$initial_utm_source = chatgpt` on the web side (the room link ChatGPT gets back carries that UTM) to connect "used the ChatGPT app" to what that person did once they clicked through to usechic.com.

## Verifying locally

With `NEXT_PUBLIC_POSTHOG_KEY` set in `apps/web/.env.local` and the dev server running, open the browser console and run:

```js
window.posthog.capture = ((original) => (...args) => {
  console.log("[posthog]", ...args);
  return original(...args);
})(window.posthog.capture.bind(window.posthog));
```

Then visit `/?utm_source=test`, upload a photo, and click a product link — each should log the matching event name and properties before the request goes out.
