import { Sparkles } from "lucide-react";
import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t bg-background py-12">
      <div className="container mx-auto px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-6 text-primary" />
              <span className="font-semibold text-lg">furnish</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Your AI interior design assistant
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Company</h4>
            <div className="flex flex-col gap-2 text-muted-foreground text-sm">
              <Link className="hover:text-foreground" href="/about">
                About Us
              </Link>
              <Link className="hover:text-foreground" href="/blog">
                Blog
              </Link>
              <Link className="hover:text-foreground" href="/login">
                Sign In
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Legal</h4>
            <div className="flex flex-col gap-2 text-muted-foreground text-sm">
              <Link className="hover:text-foreground" href="/privacy">
                Privacy Policy
              </Link>
              <Link className="hover:text-foreground" href="/terms">
                Terms of Service
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Connect</h4>
            <p className="text-muted-foreground text-sm">
              © 2025 furnish. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
