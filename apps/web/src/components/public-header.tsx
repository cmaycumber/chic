"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

export function PublicHeader() {
  const { data: session } = useSession();
  const isAuthenticated = !!session;

  return (
    <header className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        <Link className="flex items-center" href="/">
          <Logo className="text-foreground" height={20} width={49} />
        </Link>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link href="/chat">
              <Button size="sm">Chat with AI</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button size="sm" variant="ghost">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
