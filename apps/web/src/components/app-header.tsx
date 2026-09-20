"use client";

import { LayoutGrid } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import UserMenu from "@/components/user-menu";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/rooms", icon: LayoutGrid, label: "Rooms" },
] as const;

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="liquid-glass glass-shimmer flex w-full max-w-3xl items-center justify-between gap-2 rounded-full px-3 py-2 text-ink sm:gap-4 sm:px-6">
        <Link className="flex shrink-0 items-center" href="/rooms">
          <Logo className="text-ink" />
        </Link>

        {/* A phone has no width for three words plus an account button, so
            the labels drop to icons until there is room for them. */}
        <nav className="flex min-w-0 items-center gap-0.5 sm:gap-2">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                className={cn(
                  "glass-press flex size-9 items-center justify-center rounded-full font-medium text-sm transition-colors sm:size-auto sm:px-3 sm:py-1.5",
                  isActive
                    ? "bg-white/40 text-ink"
                    : "text-ink/70 hover:bg-white/25 hover:text-ink"
                )}
                href={link.href}
                key={link.href}
              >
                <Icon aria-hidden="true" className="size-4 sm:hidden" />
                <span className="sr-only sm:not-sr-only">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
