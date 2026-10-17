import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalSection } from "@/components/legal-section";
import { siteConfig } from "@/lib/site-config";

const DESCRIPTION =
  "How Automatons, LLC handles the photos, comments and account details you give Chic, who processes them, and how long we keep them.";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  description: DESCRIPTION,
  openGraph: {
    description: DESCRIPTION,
    images: [
      {
        alt: "Chic Privacy Policy",
        height: 630,
        url: "/images/ai-room-designer-hero.png",
        width: 1200,
      },
    ],
    title: "Privacy Policy | Chic",
    type: "website",
  },
  title: "Privacy Policy | Chic",
  twitter: {
    card: "summary_large_image",
    description: DESCRIPTION,
    images: ["/images/ai-room-designer-hero.png"],
    title: "Privacy Policy | Chic",
  },
};

const PROCESSORS = [
  {
    name: "Vercel",
    use: "hosts the website and the ChatGPT app server, and routes requests to AI models through the Vercel AI Gateway.",
  },
  {
    name: "Convex",
    use: "our database and file storage: rooms, photos, generated images, comments and accounts live here.",
  },
  {
    name: "Meta (Muse Image), through the Vercel AI Gateway",
    use: "edits your photo according to your comment.",
  },
  {
    name: "OpenAI (GPT Image)",
    use: "renders a specific product into your photo, and edits it when the main model is unavailable.",
  },
  {
    name: "Google (Gemini), through the Vercel AI Gateway",
    use: "finds the furniture in your photo, plans how to carry out a comment, and labels the room type and style of rooms listed in the gallery.",
  },
  {
    name: "SerpAPI",
    use: "runs product searches: cropped pieces of your photo are sent to Google Lens to find similar items, and short text descriptions are searched on Amazon and Google Shopping.",
  },
  {
    name: "Resend",
    use: "sends password reset emails.",
  },
  {
    name: "PostHog",
    use: "product analytics and error reports, described below.",
  },
  {
    name: "Stripe",
    use: "payments for edit packs. Stripe processes your payment details; we never see or store your card number.",
  },
  {
    name: "Amazon Associates, Sovrn Commerce and Skimlinks",
    use: "affiliate programs. When you follow a product link, the retailer or network may set its own cookies to attribute the purchase.",
  },
] as const;

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
              Last updated: October 12, 2026
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">
            <LegalSection title="Who we are">
              <p>
                Chic ({siteConfig.domain}) is operated by {siteConfig.company}{" "}
                (“we”, “us”). {siteConfig.company} also publishes the Chic app
                in ChatGPT. This policy explains what we collect when you use
                either one, what we do with it, and the choices you have.
              </p>
            </LegalSection>

            <LegalSection title="What we collect">
              <LegalList>
                <li>
                  <strong>Photos you upload.</strong> The room photo you start
                  with, stored so we can show and edit it.
                </li>
                <li>
                  <strong>Comments and generated images.</strong> What you ask
                  for, every version of the photo we generate in response, the
                  furniture we detect in it, and the products we match to that
                  furniture.
                </li>
                <li>
                  <strong>Account details, if you sign up.</strong> Your name,
                  email address and password. Passwords are stored hashed, never
                  in plain text.
                </li>
                <li>
                  <strong>Session cookies.</strong> When you upload a photo
                  without an account, we create an anonymous session and keep it
                  in a cookie so you can come back to your room. Signing in uses
                  the same kind of cookie.
                </li>
                <li>
                  <strong>Usage and analytics.</strong> We use PostHog to record
                  the pages you view, what you click (including product links),
                  basic device and browser information, your IP address, and
                  errors the site runs into. If you are signed in, we link these
                  events to your account, name and email.
                </li>
                <li>
                  <strong>People you invite.</strong> If you invite someone to
                  edit a room, we record that they joined it.
                </li>
                <li>
                  <strong>Messages to us.</strong> Anything you send to our
                  support email.
                </li>
              </LegalList>
            </LegalSection>

            <LegalSection title="How we use it">
              <LegalList>
                <li>To edit your photo the way your comments ask.</li>
                <li>
                  To find products that look like the furniture in your photo.
                </li>
                <li>
                  To show your rooms back to you, to people you share them with,
                  and, if you choose, in the public gallery.
                </li>
                <li>To keep your account working and reset your password.</li>
                <li>
                  To understand how Chic is used, fix bugs, and prevent abuse,
                  such as by enforcing daily limits.
                </li>
                <li>To answer you when you contact us.</li>
              </LegalList>
              <p>
                We do not sell your personal information, and we do not use your
                photos to train our own AI models.
              </p>
            </LegalSection>

            <LegalSection title="Who processes your data">
              <p>
                Chic runs on other companies' services. Your photo and comments
                are sent to AI providers so they can produce the edits you ask
                for; that is how the product works. These providers process the
                data on our behalf:
              </p>
              <LegalList>
                {PROCESSORS.map((processor) => (
                  <li key={processor.name}>
                    <strong>{processor.name}</strong>: {processor.use}
                  </li>
                ))}
              </LegalList>
              <p>
                Each provider handles data under its own terms and privacy
                policy. We may also disclose information if the law requires it,
                to protect people or our rights, or as part of a sale or
                reorganization of the business.
              </p>
            </LegalSection>

            <LegalSection title="Sharing and the public gallery">
              <p>
                Rooms are private until you share them. When you share a room,
                anyone with the link can see its photos, the comments that
                changed it and the products in it. Sharing also offers the room
                to the public gallery at /ideas unless you switch “Show in Chic
                gallery” off. Rooms in the gallery can be found by search
                engines, which may keep copies for a while after you take a room
                down.
              </p>
            </LegalSection>

            <LegalSection title="The Chic app in ChatGPT">
              <p>
                When you ask the Chic app in ChatGPT to change a photo, ChatGPT
                sends us that image and your request. We create a room for it
                that is shared by link (so ChatGPT can show you the result and
                you can open it at {siteConfig.domain}/r/…) but is never listed
                in the gallery.
              </p>
              <p>
                ChatGPT also sends an anonymized identifier for your ChatGPT
                account. We hash it and use it only to group your rooms and
                apply daily limits. We do not receive your name, email address
                or anything else from your ChatGPT account. Rooms made through
                ChatGPT are deleted after 7 days.
              </p>
            </LegalSection>

            <LegalSection title="How long we keep it">
              <LegalList>
                <li>
                  <strong>Rooms made without an account</strong> are deleted
                  automatically 7 days after they are created, along with their
                  photos, versions and comments. Signing up before then keeps
                  them.
                </li>
                <li>
                  <strong>Rooms in an account</strong> are kept until you delete
                  them or your account.
                </li>
                <li>
                  <strong>Shared and gallery rooms</strong> stay visible until
                  you make them private, take them out of the gallery, or delete
                  them.
                </li>
                <li>
                  <strong>Text product searches</strong> are cached without any
                  link to you and cleared once nobody has used them for a month.
                </li>
                <li>
                  <strong>Account details</strong> are kept until you ask us to
                  delete your account.
                </li>
              </LegalList>
            </LegalSection>

            <LegalSection title="Your choices">
              <LegalList>
                <li>
                  Delete a room from its menu or from your rooms list. This
                  removes every version, comment and stored image.
                </li>
                <li>Make a shared room private again from its menu.</li>
                <li>
                  Take a room out of the gallery by switching off “Show in Chic
                  gallery”.
                </li>
                <li>
                  Delete your account, or ask for a copy or correction of your
                  data, by emailing{" "}
                  <a href={`mailto:${siteConfig.supportEmail}`}>
                    {siteConfig.supportEmail}
                  </a>
                  . We will reply within 30 days.
                </li>
                <li>
                  Block or clear cookies in your browser. Chic needs its session
                  cookie to remember your rooms.
                </li>
              </LegalList>
              <p>
                Depending on where you live, you may have further rights over
                your data. Email us and we will honor them.
              </p>
            </LegalSection>

            <LegalSection title="Affiliate links">
              <p>
                Product links on Chic are affiliate links. If you buy through
                one, we may earn a commission from the retailer at no extra cost
                to you. We do not sell products ourselves; purchases happen on
                the retailer's site under its own privacy policy.
              </p>
            </LegalSection>

            <LegalSection title="Children">
              <p>
                Chic is not directed to children under 13, and we do not
                knowingly collect personal information from them. If you believe
                a child has given us information, email us and we will delete
                it.
              </p>
            </LegalSection>

            <LegalSection title="Security">
              <p>
                Chic is served only over encrypted connections (HTTPS). No
                service is perfectly secure, so please do not upload photos you
                would not want stored by us and our providers.
              </p>
            </LegalSection>

            <LegalSection title="Changes to this policy">
              <p>
                If we change this policy, we will post the new version here and
                update the date at the top.
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
