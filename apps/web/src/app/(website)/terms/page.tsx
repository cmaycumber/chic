import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalSection } from "@/components/legal-section";
import { siteConfig } from "@/lib/site-config";

const DESCRIPTION =
  "The terms for using Chic and the Chic app in ChatGPT, operated by Automatons, LLC: your photos, AI-generated images, affiliate links and acceptable use.";

export const metadata: Metadata = {
  alternates: { canonical: "/terms" },
  description: DESCRIPTION,
  openGraph: {
    description: DESCRIPTION,
    images: [
      {
        alt: "Chic Terms of Service",
        height: 630,
        url: "/images/ai-room-designer-hero.png",
        width: 1200,
      },
    ],
    title: "Terms of Service | Chic",
    type: "website",
  },
  title: "Terms of Service | Chic",
  twitter: {
    card: "summary_large_image",
    description: DESCRIPTION,
    images: ["/images/ai-room-designer-hero.png"],
    title: "Terms of Service | Chic",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      {/* Content */}
      <div className="container mx-auto max-w-4xl px-6 py-16">
        <div className="space-y-8">
          <div>
            <h1 className="font-bold text-4xl tracking-tight">
              Terms of Service
            </h1>
            <p className="mt-4 text-muted-foreground">
              Last updated: October 12, 2026
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">
            <LegalSection title="Who we are">
              <p>
                Chic ({siteConfig.domain}) and the Chic app in ChatGPT are
                operated by {siteConfig.company} (“we”, “us”). These terms are
                an agreement between you and {siteConfig.company}. By using
                Chic, you agree to them. If you do not agree, please do not use
                Chic.
              </p>
            </LegalSection>

            <LegalSection title="Using Chic">
              <p>
                Chic lets you upload a photo of a room, ask for changes in
                comments, and find products that look like the furniture in the
                result. You can use it without an account; rooms made that way
                are deleted after 7 days unless you sign up. If you create an
                account, keep your password safe and tell us if you think
                someone else is using it. You must be at least 13 years old to
                use Chic.
              </p>
              <p>
                Chic is free today. We may set daily limits, change features, or
                stop offering parts of the service.
              </p>
            </LegalSection>

            <LegalSection title="Your content">
              <p>
                You own the photos you upload and the comments you write. You
                must have the right to upload them.
              </p>
              <p>
                You give {siteConfig.company} a worldwide, non-exclusive,
                royalty-free license to store, copy, process and modify your
                content, and to send it to our service providers, in order to
                run Chic for you. That includes generating edited images and
                searching for products. If you share a room or list it in the
                public gallery, the license also covers displaying it, its
                comments and its images to the people who can see it, including
                in previews and search results. The license ends when you delete
                the content, except for copies others have already made or that
                remain in backups for a limited time.
              </p>
              <p>
                You may use the images Chic generates for you for any lawful
                purpose, subject to the rights of anyone else in the original
                photo.
              </p>
            </LegalSection>

            <LegalSection title="AI-generated images">
              <p>
                Edited photos are made by AI models and are illustrations, not
                plans. They may not be to scale, may not match real products
                exactly, and may contain mistakes. Do not rely on them for
                measurements, construction, safety or purchase decisions without
                checking for yourself.
              </p>
            </LegalSection>

            <LegalSection title="Products, retailers and affiliate links">
              <p>
                {siteConfig.company} does not sell products. Product matches are
                found automatically and may not be the exact item in an image.
                Prices, availability and details come from retailers and search
                services, can change at any time, and may differ from what Chic
                shows. When you buy something, you buy it from the retailer
                under its terms; returns, shipping and warranties are between
                you and the retailer.
              </p>
              <p>
                Product links are affiliate links, including through Amazon
                Associates and, for other retailers, affiliate networks such as
                Sovrn Commerce or Skimlinks. We may earn a commission when you
                buy through them, at no extra cost to you. As an Amazon
                Associate, we earn from qualifying purchases.
              </p>
            </LegalSection>

            <LegalSection title="Acceptable use">
              <p>Do not use Chic to:</p>
              <LegalList>
                <li>
                  Upload or create anything illegal, sexual, violent, hateful,
                  or that infringes someone else's rights.
                </li>
                <li>Upload photos of people without their consent.</li>
                <li>Harass, deceive or impersonate anyone.</li>
                <li>
                  Scrape Chic, access it with bots outside the published ChatGPT
                  app, or get around usage limits or security measures.
                </li>
                <li>
                  Overload, disrupt, or attempt to break into Chic or the
                  services it runs on.
                </li>
              </LegalList>
              <p>
                We may remove content, take rooms out of the gallery, or limit
                access when we believe these rules have been broken.
              </p>
            </LegalSection>

            <LegalSection title="The Chic app in ChatGPT">
              <p>
                When you use Chic inside ChatGPT, ChatGPT sends us the image you
                attach and the change you ask for. We create a room that is
                viewable by anyone with its link, is never listed in the
                gallery, and is deleted after 7 days. Your use of ChatGPT itself
                is governed by OpenAI's terms; {siteConfig.company} is not
                affiliated with OpenAI. These terms and our{" "}
                <Link href="/privacy">Privacy Policy</Link> apply to what Chic
                does with your request.
              </p>
            </LegalSection>

            <LegalSection title="Disclaimers">
              <p>
                Chic is provided “as is” and “as available”. To the fullest
                extent the law allows, {siteConfig.company} disclaims all
                warranties, express or implied, including merchantability,
                fitness for a particular purpose, and non-infringement. We do
                not promise that Chic will be uninterrupted, error-free, or that
                rooms will be stored forever. Keep your own copy of anything you
                care about.
              </p>
            </LegalSection>

            <LegalSection title="Limitation of liability">
              <p>
                To the fullest extent the law allows, {siteConfig.company} will
                not be liable for any indirect, incidental, special,
                consequential or punitive damages, or for lost profits, data or
                goodwill, arising from your use of Chic or from products you buy
                from retailers. Our total liability for any claim about Chic is
                limited to the greater of the amount you paid us in the past 12
                months or US$50.
              </p>
            </LegalSection>

            <LegalSection title="Ending your use">
              <p>
                You can stop using Chic at any time, delete your rooms, and ask
                us to delete your account. We may suspend or end your access if
                you break these terms or if we stop offering Chic. Sections that
                by their nature should survive, such as disclaimers and
                limitation of liability, survive the end of these terms.
              </p>
            </LegalSection>

            <LegalSection title="Governing law">
              {/* TODO(owner): name the state */}
              <p>
                These terms are governed by the laws of the state in which{" "}
                {siteConfig.company} is organized, without regard to
                conflict-of-law rules.
              </p>
            </LegalSection>

            <LegalSection title="Changes to these terms">
              <p>
                We may update these terms. We will post the new version here and
                update the date at the top. If you keep using Chic after a
                change takes effect, the new terms apply.
              </p>
            </LegalSection>

            <LegalSection title="Contact">
              <p>
                {siteConfig.company}, operator of Chic. Email{" "}
                <a href={`mailto:${siteConfig.supportEmail}`}>
                  {siteConfig.supportEmail}
                </a>{" "}
                or visit our <Link href="/support">support page</Link>.
              </p>
            </LegalSection>
          </div>
        </div>
      </div>
    </div>
  );
}
