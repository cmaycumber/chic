import { Sparkles } from "lucide-react";
import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="bg-muted/30 py-16">
      <div className="container mx-auto px-6">
        <div className="mb-12 space-y-2">
          <div className="flex items-center gap-2.5">
            <Sparkles className="size-5 text-foreground" />
            <span className="font-medium text-base">chic</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Your AI interior designer
          </p>
        </div>

        <div className="mb-12 grid gap-12 md:grid-cols-5">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Product</h4>
            <div className="flex flex-col gap-2 text-muted-foreground text-sm">
              <Link
                className="transition-colors hover:text-foreground"
                href="/pricing"
              >
                Pricing
              </Link>
              <Link
                className="transition-colors hover:text-foreground"
                href="/about"
              >
                About
              </Link>
              <Link
                className="transition-colors hover:text-foreground"
                href="/blog"
              >
                Blog
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Tools</h4>
            <div className="flex flex-col gap-2 text-muted-foreground text-sm">
              <Link
                className="transition-colors hover:text-foreground"
                href="/design-tools/ai-room-designer"
              >
                AI Room Designer
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Ideas</h4>
            <div className="flex flex-col gap-2 text-muted-foreground text-sm">
              <Link
                className="transition-colors hover:text-foreground"
                href="/ideas"
              >
                Explore All Ideas
              </Link>
              <Link
                className="transition-colors hover:text-foreground"
                href="/ideas/living-room"
              >
                Living Room Ideas
              </Link>
              <Link
                className="transition-colors hover:text-foreground"
                href="/ideas/bedroom"
              >
                Bedroom Ideas
              </Link>
              <Link
                className="transition-colors hover:text-foreground"
                href="/ideas/family-room"
              >
                Family Room Ideas
              </Link>
              <Link
                className="transition-colors hover:text-foreground"
                href="/ideas/kitchen"
              >
                Kitchen Ideas
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Legal</h4>
            <div className="flex flex-col gap-2 text-muted-foreground text-sm">
              <Link
                className="transition-colors hover:text-foreground"
                href="/privacy"
              >
                Privacy
              </Link>
              <Link
                className="transition-colors hover:text-foreground"
                href="/terms"
              >
                Terms
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Connect</h4>
            <div className="flex flex-col gap-2 text-muted-foreground text-sm">
              <Link
                className="transition-colors hover:text-foreground"
                href="/login"
              >
                Sign in
              </Link>
              <Link
                className="transition-colors hover:text-foreground"
                href="/signup"
              >
                Sign up
              </Link>
              <a
                className="transition-colors hover:text-foreground"
                href="mailto:chad.maycumber11@gmail.com"
              >
                Contact
              </a>
            </div>
          </div>
        </div>

        <div className="border-t pt-8">
          <p className="text-muted-foreground text-sm">
            © 2025 chic. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
