"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { TravertineBackground } from "@/components/travertine-background";

type AuthLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <TravertineBackground />

      {/* Header */}
      <header className="relative z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <Link className="flex items-center gap-2" href="/">
            <Sparkles className="size-6 text-primary" />
            <span className="font-semibold text-lg">furnish</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-bold text-3xl tracking-tight">{title}</h1>
            {subtitle && (
              <p className="mt-2 text-muted-foreground">{subtitle}</p>
            )}
          </div>

          <div className="rounded-lg border bg-card/95 p-8 shadow-xl backdrop-blur-sm">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t bg-background/80 py-4 backdrop-blur-sm">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
          <p>Your AI Interior Design Assistant</p>
        </div>
      </footer>
    </div>
  );
}
