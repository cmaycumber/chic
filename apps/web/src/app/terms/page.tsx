import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <Link className="flex items-center gap-2" href="/">
            <Sparkles className="size-6 text-primary" />
            <span className="font-semibold text-lg">chic</span>
          </Link>
          <div className="flex items-center gap-2">
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

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-6 py-16">
        <div className="space-y-8">
          <div>
            <h1 className="font-bold text-4xl tracking-tight">
              Terms of Service
            </h1>
            <p className="mt-4 text-muted-foreground">
              Last updated: October 11, 2025
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">Agreement to Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using chic, you agree to be bound by these Terms
                of Service and all applicable laws and regulations. If you do
                not agree with any of these terms, you are prohibited from using
                or accessing this service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">Use License</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Permission is granted to temporarily access and use chic for
                  personal, non-commercial purposes. This license does not
                  include the right to:
                </p>
                <ul className="list-inside list-disc space-y-2 text-muted-foreground">
                  <li>Modify or copy the materials</li>
                  <li>
                    Use the materials for commercial purposes or public display
                  </li>
                  <li>Attempt to decompile or reverse engineer any software</li>
                  <li>
                    Remove any copyright or proprietary notations from the
                    materials
                  </li>
                  <li>
                    Transfer the materials to another person or mirror the
                    materials on any other server
                  </li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">User Accounts</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  When you create an account with us, you must provide accurate,
                  complete, and current information. You are responsible for:
                </p>
                <ul className="list-inside list-disc space-y-2 text-muted-foreground">
                  <li>Maintaining the confidentiality of your account</li>
                  <li>All activities that occur under your account</li>
                  <li>
                    Notifying us immediately of any unauthorized use of your
                    account
                  </li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">AI-Generated Content</h2>
              <p className="text-muted-foreground">
                chic uses artificial intelligence to generate interior design
                recommendations. While we strive for accuracy, the suggestions
                provided are for informational purposes only and should not be
                considered professional design advice. You should use your own
                judgment and consult with qualified professionals before making
                significant design or renovation decisions.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">Intellectual Property</h2>
              <p className="text-muted-foreground">
                The service and its original content, features, and
                functionality are owned by chic and are protected by
                international copyright, trademark, patent, trade secret, and
                other intellectual property laws.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">User-Generated Content</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  By submitting content to chic, you grant us a worldwide,
                  non-exclusive, royalty-free license to use, reproduce, modify,
                  and display that content for the purpose of providing and
                  improving our service.
                </p>
                <p className="text-muted-foreground">
                  You agree not to submit content that:
                </p>
                <ul className="list-inside list-disc space-y-2 text-muted-foreground">
                  <li>Violates any laws or regulations</li>
                  <li>Infringes on intellectual property rights</li>
                  <li>Contains harmful or malicious code</li>
                  <li>Is offensive, threatening, or harassing</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">Disclaimer</h2>
              <p className="text-muted-foreground">
                The service is provided "as is" without any warranties,
                expressed or implied. We do not warrant that the service will be
                uninterrupted, timely, secure, or error-free. We do not warrant
                the accuracy or reliability of any information obtained through
                the service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">
                Limitation of Liability
              </h2>
              <p className="text-muted-foreground">
                In no event shall chic or its suppliers be liable for any
                damages arising out of the use or inability to use the service,
                even if we have been notified of the possibility of such
                damages.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">Termination</h2>
              <p className="text-muted-foreground">
                We may terminate or suspend your account and access to the
                service immediately, without prior notice or liability, for any
                reason, including if you breach these Terms of Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify or replace these Terms at any
                time. If a revision is material, we will provide at least 30
                days' notice before any new terms take effect.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance
                with the laws of the United States, without regard to its
                conflict of law provisions.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms of Service, please
                contact us at legal@chic.ai
              </p>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="container mx-auto px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-6 text-primary" />
                <span className="font-semibold text-lg">chic</span>
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
                © 2025 chic. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
