/**
 * PostHog Custom Properties
 * Store property names as constants to ensure consistency across the application
 */
export const POSTHOG_PROPERTIES = {
  // User properties
  userEmail: "email",
  userName: "name",
} as const;

/**
 * PostHog Event Names
 * Store event names as constants to ensure consistency across the application
 */
export const POSTHOG_EVENTS = {
  // Add custom event names here as needed
} as const;
