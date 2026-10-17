/** biome-ignore-all lint/style/useNamingConvention: PostHog configuration uses snake_case properties from their API */
import posthog from "posthog-js";

/**
 * Where a visitor's very first pageview came from, as one breakdown value:
 * a UTM campaign (ChatGPT's links carry `utm_source=chatgpt`), else the
 * referring site, else "direct". posthog-js already stores the richer
 * `$initial_utm_source` / `$initial_referring_domain` person properties on
 * their own; this just gives funnels one simple dimension to split on.
 */
function entrySource(): string {
  try {
    const utmSource = new URLSearchParams(window.location.search).get(
      "utm_source"
    );
    if (utmSource) {
      return utmSource;
    }
    const { referrer } = document;
    return referrer ? new URL(referrer).hostname : "direct";
  } catch {
    return "direct";
  }
}

// Only initialize PostHog if the API key is set
if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "/users",
    capture_exceptions: true, // This enables capturing exceptions using Error Tracking, set to false if you don't want this
    // The App Router never does a full page load after the first one, so
    // pageviews need to follow history changes rather than just `load`.
    capture_pageview: "history_change",
    debug: process.env.NODE_ENV === "development",
    defaults: "2025-05-24",
    ui_host: "https://us.posthog.com",
  });

  // Set once per person (browser), so a visit deep into the funnel (e.g. a
  // shared room link) doesn't overwrite how they first arrived.
  posthog.register_once({ entry_source: entrySource() });
}
