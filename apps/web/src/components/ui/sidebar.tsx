"use client";

import { PanelLeftOpenIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SidebarContextValue = {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (value: boolean) => void;
  isMobile: boolean;
};

const SidebarContext = createContext<SidebarContextValue | undefined>(
  undefined
);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sidebar:collapsed");
      if (stored != null) {
        setCollapsed(stored === "1");
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sidebar:collapsed", collapsed ? "1" : "0");
    } catch {
      // ignore storage errors
    }
  }, [collapsed]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const media = window.matchMedia("(max-width: 768px)");
    const handle = () => setIsMobile(media.matches);
    handle();
    media.addEventListener?.("change", handle);
    return () => media.removeEventListener?.("change", handle);
  }, []);

  const value = useMemo<SidebarContextValue>(
    () => ({
      collapsed,
      toggle: () => setCollapsed((v) => !v),
      setCollapsed,
      isMobile,
    }),
    [collapsed, isMobile]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return ctx;
}

export function Sidebar({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { collapsed } = useSidebar();
  return (
    <aside
      className={cn(
        "flex-none shrink-0 border-r bg-background text-foreground transition-[width] duration-300 ease-in-out",
        collapsed ? "w-12 bg-muted/30" : "w-64",
        className
      )}
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return <div className={cn("px-2 py-2", className)}>{children}</div>;
}

export function SidebarFooter({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return <div className={cn("mt-auto px-2 py-2", className)}>{children}</div>;
}

export function SidebarContent({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("flex h-svh flex-col", className)}>{children}</div>;
}

export function SidebarMain({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("flex-1 overflow-hidden", className)}>{children}</div>
  );
}

export function SidebarToggle({ className }: { className?: string }) {
  const { collapsed, toggle } = useSidebar();
  return (
    <Button
      aria-expanded={!collapsed}
      aria-label="Toggle sidebar"
      className={cn("size-8 cursor-pointer", className)}
      onClick={toggle}
      size="icon"
      type="button"
      variant="ghost"
    >
      <PanelLeftOpenIcon className="size-4" />
    </Button>
  );
}

// Menu primitives used by NavUser and other nav components
export const SidebarMenu = ({ className, ...props }: ComponentProps<"ul">) => (
  <ul
    className={cn("flex list-none flex-col gap-1 p-0", className)}
    {...props}
  />
);

export const SidebarMenuItem = ({
  className,
  ...props
}: ComponentProps<"li">) => <li className={cn("m-0", className)} {...props} />;

export const SidebarMenuButton = forwardRef<
  HTMLButtonElement,
  ComponentProps<"button">
>(({ className, ...props }, ref) => (
  <button
    className={cn(
      "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted/40",
      className
    )}
    ref={ref}
    {...props}
  />
));
SidebarMenuButton.displayName = "SidebarMenuButton";

// Reusable action for sidebar with fixed 32px icon column and animated label
export function SidebarAction({
  icon,
  label,
  className,
  type,
  ...props
}: {
  icon: ReactNode;
  label: string;
} & Omit<ComponentProps<"button">, "children">) {
  const { collapsed } = useSidebar();
  return (
    <button
      aria-label={
        ((props as { [key: string]: unknown })["aria-label"] as
          | string
          | undefined) ?? label
      }
      className={cn(
        "flex h-8 w-full cursor-pointer items-center justify-start rounded-md px-2 text-left text-sm hover:bg-muted/40",
        className
      )}
      type={type ?? "button"}
      {...props}
    >
      <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
      <span
        className={
          collapsed
            ? "max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity,margin] duration-300"
            : "ml-2 max-w-[160px] overflow-hidden whitespace-nowrap opacity-100 transition-[max-width,opacity,margin] duration-300"
        }
      >
        {label}
      </span>
    </button>
  );
}
