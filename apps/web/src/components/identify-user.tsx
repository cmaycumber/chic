"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { Authenticated, useQuery } from "convex/react";
import posthog from "posthog-js";
import { useEffect, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import { POSTHOG_PROPERTIES } from "@/lib/posthog";

function IdentifyUserComponent() {
  const { data: session } = useSession();
  const user = useQuery(api.auth.getCurrentUser);
  // The id PostHog is currently identified as, so a later id change (e.g.
  // an anonymous guest signing up) can be told apart from the first visit.
  const identifiedIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only proceed if PostHog is initialized
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      return;
    }

    // User is authenticated and we have user data
    if (session && user) {
      const previousId = identifiedIdRef.current;
      if (previousId === user._id) {
        return;
      }

      if (user.isAnonymous) {
        // No email or name for a guest: this only gives their pre-signup
        // activity (upload, comments, product clicks) a stable id so it
        // merges into one person if they sign up later.
        posthog.identify(user._id);
      } else {
        // Signing up replaces the anonymous user with a new one (see
        // `onLinkAccount` in auth.ts), so `user._id` just changed under us.
        // Without an alias, PostHog would start a second person at sign-up
        // and split the funnel between the guest and the account.
        if (previousId) {
          posthog.alias(user._id, previousId);
        }
        posthog.identify(user._id, {
          [POSTHOG_PROPERTIES.userEmail]: user.email,
          [POSTHOG_PROPERTIES.userName]: user.name,
        });
      }
      identifiedIdRef.current = user._id;
    } else if (!session && identifiedIdRef.current) {
      // User logged out, reset PostHog
      posthog.reset();
      identifiedIdRef.current = null;
    }
  }, [session, user]);

  return null;
}

export function IdentifyUser() {
  return (
    <Authenticated>
      <IdentifyUserComponent />
    </Authenticated>
  );
}
