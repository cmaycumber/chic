import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection } from "@/components/legal-section";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

const DESCRIPTION =
  "Help with Chic: how rooms work, keeping or deleting them, the public gallery, the Chic app in ChatGPT, product prices, and how to reach us.";

export const metadata: Metadata = {
  alternates: { canonical: "/support" },
  description: DESCRIPTION,
  openGraph: {
    description: DESCRIPTION,
    title: "Support | Chic",
    type: "website",
  },
  title: "Support | Chic",
};

export default function SupportPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-4xl px-6 py-16">
        <div className="space-y-8">
          <div>
            <h1 className="font-bold text-4xl tracking-tight">Support</h1>
            <p className="mt-4 text-muted-foreground">
              Answers to the common questions, and a real person at the other
              end of the email if yours is not here.
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">
            <LegalSection id="how-it-works" title="How does Chic work?">
              <p>
                Upload a photo of a room on the <Link href="/">home page</Link>.
                Leave a comment on what you want different, like “swap the sofa
                for green velvet”, and Chic edits the photo in about 20 seconds.
                Tap any piece of furniture in the result to see products that
                look like it.
              </p>
            </LegalSection>

            <LegalSection id="keep-rooms" title="Why did my room disappear?">
              <p>
                You do not need an account to use Chic, but rooms made without
                one are deleted 7 days after they are created. To keep a room,{" "}
                <Link href="/signup">sign up</Link> from the same browser before
                then: everything you made moves into your account and stays
                until you delete it.
              </p>
            </LegalSection>

            <LegalSection
              id="delete"
              title="How do I delete a room or my account?"
            >
              <p>
                Open the room, choose the menu at the top, and pick “Delete
                room”, or use Delete on your <Link href="/rooms">rooms</Link>{" "}
                page. This removes every version, comment and image, and cannot
                be undone.
              </p>
              <p>
                To delete your account, email{" "}
                <a href={`mailto:${siteConfig.supportEmail}`}>
                  {siteConfig.supportEmail}
                </a>{" "}
                from the address you signed up with.
              </p>
            </LegalSection>

            <LegalSection
              id="gallery"
              title="How do I take a room out of the gallery?"
            >
              <p>
                Sharing a room also offers it to the public{" "}
                <Link href="/ideas">gallery</Link>. Open the room's menu and
                switch off “Show in Chic gallery” to remove it while keeping the
                share link working, or choose “Make private” to turn off the
                link as well.
              </p>
            </LegalSection>

            <LegalSection id="chatgpt" title="Using Chic in ChatGPT">
              <p>
                Chic is also an app inside ChatGPT. Connect it from the apps
                directory in ChatGPT, then attach a room photo and ask for a
                change. You can disconnect it at any time from your ChatGPT
                settings.
              </p>
              <p>
                Each edit gets a share link on {siteConfig.domain}. Those rooms
                are not listed in the gallery and are deleted after 7 days, so
                save any image you want to keep.
              </p>
            </LegalSection>

            <LegalSection
              id="prices"
              title="Why is the price different at the store?"
            >
              <p>
                Chic finds products automatically through search services, and
                retailers change prices and stock often. The retailer's page is
                always the one that counts. Matches are lookalikes, so check the
                details before you buy.
              </p>
            </LegalSection>

            <LegalSection id="affiliate" title="Does Chic get paid when I buy?">
              <p>
                Sometimes. Product links are affiliate links, so Chic may earn a
                commission from the retailer when you buy through them. It does
                not change the price you pay, and we do not sell anything
                ourselves.
              </p>
            </LegalSection>
          </div>

          <div className="rounded-lg border bg-card p-8 text-center sm:p-12">
            <h2 className="font-bold text-2xl">Still stuck?</h2>
            <p className="mt-4 text-muted-foreground">
              Email us and we will get back to you.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <Button asChild size="lg" variant="brass">
                <a href={`mailto:${siteConfig.supportEmail}`}>Email support</a>
              </Button>
              <p className="break-all text-muted-foreground text-sm">
                {siteConfig.supportEmail}
              </p>
            </div>
            <p className="mt-6 text-muted-foreground text-xs">
              Chic is made by {siteConfig.company}. See our{" "}
              <Link className="underline underline-offset-4" href="/privacy">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link className="underline underline-offset-4" href="/terms">
                Terms of Service
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
