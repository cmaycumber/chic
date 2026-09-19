"use client";

import {
  type AuthClient,
  ConvexBetterAuthProvider,
} from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import { authClient } from "@/lib/auth-client";
import { Toaster } from "./ui/sonner";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL ?? "");

export default function Providers({
  children,
  initialToken,
}: {
  children: React.ReactNode;
  /** Token resolved on the server so the first render is already signed in. */
  initialToken?: string | null;
}) {
  return (
    <>
      {/*
        `authClient` combines the Convex, Polar, and admin Better Auth client
        plugins. The provider's `AuthClient` type can't fully express that
        combination (TypeScript's structural check on `useSession` bottoms
        out to `never` once Polar's Zod-derived endpoint types are folded
        in), so we assert the type at this boundary only. `authClient` keeps
        its full inferred type everywhere else it's used.
      */}
      <ConvexBetterAuthProvider
        authClient={authClient as unknown as AuthClient}
        client={convex}
        initialToken={initialToken}
      >
        {children}
      </ConvexBetterAuthProvider>
      <Toaster richColors />
    </>
  );
}
