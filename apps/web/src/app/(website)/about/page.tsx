import { Clock, MessageSquare, ShoppingBag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  description:
    "Chic turns a photo of your room into one you can change with a comment and shop from Amazon. No prompts, no design brief, no sign-up required.",
  keywords: [
    "about chic",
    "ai room redesign",
    "comment to edit a room photo",
    "shoppable room design",
    "free room design tool",
  ],
  openGraph: {
    description:
      "Upload a photo, comment on what to change, and shop the result. No prompts, no sign-up, free to use.",
    images: [
      {
        alt: "About Chic",
        height: 630,
        url: "/images/ai-room-designer-hero.png",
        width: 1200,
      },
    ],
    title: "About Chic",
    type: "website",
  },
  title: "About Chic | Redesign a Room With a Comment, Not a Prompt",
  twitter: {
    card: "summary_large_image",
    description:
      "Upload a photo, comment on what to change, and shop the result. No prompts, no sign-up, free to use.",
    images: ["/images/ai-room-designer-hero.png"],
    title: "About Chic",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="border-b bg-muted/30 py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-bold text-4xl tracking-tight md:text-5xl">
              About Chic
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Chic turns a photo of your room into a room you can actually
              change, and buy from. Upload a photo, leave a comment on what you
              want different, and watch it happen in about 20 seconds. Free, no
              sign-up required.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-4xl space-y-16">
            <div className="grid gap-12 md:grid-cols-3">
              <Card className="p-8 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <MessageSquare className="size-8 text-primary" />
                </div>
                <h3 className="mt-6 font-semibold text-xl">
                  Comment, don't prompt
                </h3>
                <p className="mt-4 text-muted-foreground">
                  Writing a paragraph to describe your dream room is slow, and
                  most people don't have the vocabulary for it anyway. So we
                  skip that step. Pin a comment to the exact spot in your photo,
                  like "swap this sofa for a green velvet one," and the room
                  updates around it.
                </p>
              </Card>

              <Card className="p-8 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <ShoppingBag className="size-8 text-primary" />
                </div>
                <h3 className="mt-6 font-semibold text-xl">
                  Every piece is shoppable
                </h3>
                <p className="mt-4 text-muted-foreground">
                  A redesign you can't buy from is just a picture. Tap any piece
                  of furniture in your new photo and we point you to it on
                  Amazon, so the room you imagined is one you can build.
                </p>
              </Card>

              <Card className="p-8 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="size-8 text-primary" />
                </div>
                <h3 className="mt-6 font-semibold text-xl">Free, no sign-up</h3>
                <p className="mt-4 text-muted-foreground">
                  Upload a photo and start commenting without creating an
                  account. Rooms stick around on their own for 7 days. Sign in
                  only if you want to keep one longer or invite someone else to
                  edit it with you.
                </p>
              </Card>
            </div>

            <div className="rounded-lg border bg-card p-12 text-center">
              <h3 className="font-bold text-2xl">Have a question?</h3>
              <p className="mt-4 text-muted-foreground">
                We read every message. Or just try it yourself, it takes about
                20 seconds.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link href="/">
                  <Button size="lg" variant="brass">
                    Upload a Photo
                  </Button>
                </Link>
                <a href="mailto:chad.maycumber11@gmail.com">
                  <Button size="lg" variant="outline">
                    Contact Us
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
