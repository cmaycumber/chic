"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAuthenticated = !!session;

  // Don't show sidebar on auth pages or when not authenticated
  const showSidebar =
    isAuthenticated && pathname !== "/login" && pathname !== "/signup";

  if (!showSidebar) {
    return <main className="w-full">{children}</main>;
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
