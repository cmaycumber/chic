"use client";

import { useSession } from "@/lib/auth-client";
import { PublicFooter } from "./public-footer";
import { PublicHeader } from "./public-header";

type PublicLayoutProps = {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
};

export function PublicLayout({
  children,
  showHeader = true,
  showFooter = true,
}: PublicLayoutProps) {
  const { data: session, isPending } = useSession();
  const isAuthenticated = !!session;

  // Show loading state to prevent layout shift
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  // If user is authenticated, don't show public header/footer
  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      {showHeader && <PublicHeader />}
      <main className={showHeader ? "pt-16" : ""}>{children}</main>
      {showFooter && <PublicFooter />}
    </div>
  );
}
