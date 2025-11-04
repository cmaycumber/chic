"use client";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import { authClient } from "@/lib/auth-client";
import { Toaster } from "./ui/sonner";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL ?? "");

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ConvexBetterAuthProvider authClient={authClient} client={convex}>
        {children}
      </ConvexBetterAuthProvider>
      <Toaster richColors />
    </>
  );
}
