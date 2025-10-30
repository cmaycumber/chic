"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

type PublicHeaderProps = {
  isAuthenticated?: boolean;
};

export function PublicHeader({
  isAuthenticated: serverAuth,
}: PublicHeaderProps) {
  const { data: session } = useSession();
  const clientAuth = !!session;
  const isAuthenticated = serverAuth ?? clientAuth;

  return (
    <header className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link className="flex items-center" href="/">
          <Logo className="text-foreground" height={18} width={44} />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <Link href="/chat">
              <Button className="h-8 text-xs sm:h-9 sm:text-sm" size="sm">
                Chat with AI
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button
                  className="h-8 text-xs sm:h-9 sm:text-sm"
                  size="sm"
                  variant="ghost"
                >
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="h-8 text-xs sm:h-9 sm:text-sm" size="sm">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
