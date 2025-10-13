"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const isAuthenticated = !!session;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't show sidebar on auth pages or when not authenticated
  const showSidebar =
    isAuthenticated && pathname !== "/login" && pathname !== "/signup";

  // Prevent layout shift during initial load
  if (!mounted || isPending) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      </main>
    );
  }

  if (!showSidebar) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <SidebarProvider>
      <div className="flex h-svh w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </SidebarProvider>
  );
}
