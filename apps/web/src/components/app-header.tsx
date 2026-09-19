"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import UserMenu from "@/components/user-menu";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/rooms", label: "Rooms" },
  { href: "/explore", label: "Explore" },
  { href: "/saved", label: "Saved" },
] as const;

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="liquid-glass glass-shimmer flex w-full max-w-3xl items-center justify-between gap-4 rounded-full px-4 py-2 text-ink sm:px-6">
        <Link className="flex shrink-0 items-center" href="/rooms">
          <Logo className="text-ink" />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                className={cn(
                  "glass-press rounded-full px-3 py-1.5 font-medium text-sm transition-colors",
                  isActive
                    ? "bg-white/40 text-ink"
                    : "text-ink/70 hover:bg-white/25 hover:text-ink"
                )}
                href={link.href}
                key={link.href}
              >
                {link.label}
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
