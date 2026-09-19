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
  const identifiedRef = useRef<boolean>(false);

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
          [POSTHOG_PROPERTIES.userEmail]: user.email,
          [POSTHOG_PROPERTIES.userName]: user.name,
        });
        identifiedRef.current = true;
      }
    } else if (!session && identifiedRef.current) {
      // User logged out, reset PostHog
      posthog.reset();
      identifiedRef.current = false;
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
