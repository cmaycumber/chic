"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link className="flex items-center" href="/">
          <Logo className="text-foreground" height={20} width={49} />
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login">
            <Button size="sm" variant="ghost">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Sign up</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
