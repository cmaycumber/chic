/** biome-ignore-all lint/style/useNamingConvention: PostHog configuration uses snake_case properties from their API */
import posthog from "posthog-js";

// Only initialize PostHog if the API key is set
if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "/users",
    capture_exceptions: true, // This enables capturing exceptions using Error Tracking, set to false if you don't want this
    debug: process.env.NODE_ENV === "development",
    defaults: "2025-05-24",
    ui_host: "https://us.posthog.com",
  });
}
