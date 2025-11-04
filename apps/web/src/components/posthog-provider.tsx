"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import posthog from "posthog-js";
import { useEffect, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import { POSTHOG_PROPERTIES } from "@/lib/posthog";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const user = useQuery(api.auth.getCurrentUser);
  const identifiedRef = useRef(false);

  useEffect(() => {
    // Only proceed if PostHog is initialized
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      return;
    }

    // User is authenticated and we have user data
    if (session && user) {
      // Identify user if not already identified
      if (!identifiedRef.current) {
        posthog.identify(user._id, {
          [POSTHOG_PROPERTIES.USER_EMAIL]: user.email,
          [POSTHOG_PROPERTIES.USER_NAME]: user.name,
        });
        identifiedRef.current = true;
      }
    } else if (!session && identifiedRef.current) {
      // User logged out, reset PostHog
      posthog.reset();
      identifiedRef.current = false;
    }
  }, [session, user]);

  return <>{children}</>;
}
