import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      {/* Content */}
      <div className="container mx-auto max-w-4xl px-6 py-16">
        <div className="space-y-8">
          <div>
            <h1 className="font-bold text-4xl tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-4 text-muted-foreground">
              Last updated: October 11, 2025
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">Introduction</h2>
              <p className="text-muted-foreground">
                At chic, we take your privacy seriously. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your
                information when you use our AI-powered interior design
                platform.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    Personal Information
                  </h3>
                  <p className="text-muted-foreground">
                    We collect information you provide directly to us,
                    including:
                  </p>
                  <ul className="list-inside list-disc space-y-2 text-muted-foreground">
                    <li>Name and email address</li>
                    <li>Account credentials</li>
                    <li>Design preferences and project details</li>
                    <li>Communications with our support team</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg">Usage Information</h3>
                  <p className="text-muted-foreground">
                    We automatically collect certain information about your
                    device and how you interact with our service, including:
                  </p>
                  <ul className="list-inside list-disc space-y-2 text-muted-foreground">
                    <li>Device information and identifiers</li>
                    <li>Browser type and version</li>
                    <li>Usage patterns and feature interactions</li>
                    <li>IP address and location data</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">
                How We Use Your Information
              </h2>
              <p className="text-muted-foreground">
                We use the information we collect to:
              </p>
              <ul className="list-inside list-disc space-y-2 text-muted-foreground">
                <li>Provide, maintain, and improve our services</li>
                <li>Generate personalized design recommendations</li>
                <li>Send you updates and marketing communications</li>
                <li>Respond to your questions and support requests</li>
                <li>Monitor and analyze usage patterns</li>
                <li>Detect and prevent fraud and abuse</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">
                Data Sharing and Disclosure
              </h2>
              <p className="text-muted-foreground">
                We do not sell your personal information. We may share your
                information in the following circumstances:
              </p>
              <ul className="list-inside list-disc space-y-2 text-muted-foreground">
                <li>With service providers who help us operate our platform</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
                <li>With your consent or at your direction</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational measures
                to protect your personal information against unauthorized
                access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">Your Rights</h2>
              <p className="text-muted-foreground">
                Depending on your location, you may have certain rights
                regarding your personal information, including:
              </p>
              <ul className="list-inside list-disc space-y-2 text-muted-foreground">
                <li>Access to your personal information</li>
                <li>Correction of inaccurate data</li>
                <li>Deletion of your data</li>
                <li>Objection to processing</li>
                <li>Data portability</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">Cookies and Tracking</h2>
              <p className="text-muted-foreground">
                We use cookies and similar tracking technologies to collect
                information about your browsing activities and to personalize
                your experience. You can control cookies through your browser
                settings.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">Children's Privacy</h2>
              <p className="text-muted-foreground">
                Our service is not intended for children under 13 years of age.
                We do not knowingly collect personal information from children
                under 13.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about this Privacy Policy or our privacy
                practices, please contact us at privacy@chic.ai
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
