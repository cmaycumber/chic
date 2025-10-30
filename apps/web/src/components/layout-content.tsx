"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";

const AUTH_ROUTES = ["/login", "/signup"];
const MOBILE_BREAKPOINT = 768;

type MobileSidebarContextType = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
};

const MobileSidebarContext = createContext<MobileSidebarContextType>({
  isOpen: false,
  // biome-ignore lint/suspicious/noEmptyBlockStatements: Default no-op function for context initialization
  setIsOpen: () => {},
  isMobile: false,
});

export const useMobileSidebar = () => useContext(MobileSidebarContext);

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const isAuthenticated = !!session;
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  // Don't show sidebar on auth pages or when not authenticated
  const showSidebar = isAuthenticated && !isAuthRoute;

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close mobile sidebar on route change

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  if (!showSidebar) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <MobileSidebarContext.Provider
      value={{
        isOpen: isMobileSidebarOpen,
        setIsOpen: setIsMobileSidebarOpen,
        isMobile,
      }}
    >
      {/* Mobile Sidebar Sheet - Outside SidebarProvider */}
      {isMobile && (
        <Sheet onOpenChange={setIsMobileSidebarOpen} open={isMobileSidebarOpen}>
          <SheetContent className="h-full w-[280px] p-0" side="left">
            <SidebarProvider defaultOpen>
              <AppSidebar collapsible="none" />
            </SidebarProvider>
          </SheetContent>
        </Sheet>
      )}

      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden bg-background">
          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <AppSidebar />
          </div>

          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </SidebarProvider>
    </MobileSidebarContext.Provider>
  );
}
