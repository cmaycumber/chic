"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";

const AUTH_ROUTES = ["/login", "/signup"];

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isAuthenticated = !!session;
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  // Don't show sidebar on auth pages or when not authenticated
  const showSidebar = isAuthenticated && !isAuthRoute;

  if (!showSidebar) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </SidebarProvider>
  );
}
