import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RoomDesignerTool } from "./room-designer-tool";

export const metadata: Metadata = {
  description:
    "Upload a photo of your room, leave a comment to change anything about it, and see it redesigned in about 20 seconds. Tap any piece of furniture to shop it on Amazon. Free, no sign-up needed.",
  keywords: [
    "ai room designer",
    "redesign my room from a photo",
    "see furniture in my room",
    "shop the look from a photo",
    "free room design tool",
    "ai interior design",
  ],
  openGraph: {
    description:
      "Upload a photo of your room, comment on what to change, and see it redesigned in about 20 seconds. Tap any piece of furniture to shop it on Amazon.",
    images: [
      {
        alt: "Chic AI room designer: upload a photo, comment to change it, shop the look",
        height: 630,
        url: "/images/ai-room-designer-hero.png",
        width: 1200,
      },
    ],
    title: "AI Room Designer: Redesign Your Room From a Photo",
    type: "website",
  },
  title: "AI Room Designer: Redesign Your Room From a Photo | Chic",
  twitter: {
    card: "summary_large_image",
    description:
      "Upload a photo of your room, comment on what to change, and see it redesigned in about 20 seconds. Tap any piece of furniture to shop it on Amazon.",
    images: ["/images/ai-room-designer-hero.png"],
    title: "AI Room Designer: Redesign Your Room From a Photo",
  },
};

export default function AiRoomDesignerPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      {/* Hero Section with Tool */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <h1 className="mb-4 font-bold text-4xl tracking-tight md:text-5xl">
              AI Room Designer: Redesign Your Room From a Photo
            </h1>
            <p className="text-muted-foreground md:text-lg">
              Upload a photo of your room, leave a comment on what you want
              changed, and watch it redesign itself in about 20 seconds. Then
              tap any piece of furniture to shop it on Amazon. Free, no sign-up
              required.
            </p>
          </div>

          {/* Tool Interface - Prominently Placed */}
          <RoomDesignerTool />
        </div>
      </section>

      {/* Main Content Section */}
      <section className="container mx-auto px-4 py-12">
        <article className="prose prose-lg dark:prose-invert mx-auto max-w-4xl">
          <h2>See Your Room Redesigned From a Single Photo</h2>
          <p>
            Looking to change up a room but not sure where to start? Whether
            you're staging a place to sell, refreshing a room you're tired of,
            or just curious what a different sofa would look like, Chic's free
            AI room designer redesigns a real photo of your space in seconds.
          </p>
          <p>
            Most design tools ask you to write a prompt describing the room you
            want, or to hire someone to sketch it for you. Chic works
            differently: you comment on the photo you already have.
          </p>
          <p>
            Upload a photo of your room, leave a comment describing the change,
            something like "swap the sofa for a green velvet one," "make the rug
            lighter," or "add a floor lamp by the window," and the AI redesigns
            the photo around exactly what you asked for. No dropdowns, no style
            quiz, no waiting.
          </p>

          <h2>How Chic's AI Room Designer Works</h2>
          <p>
            An AI room designer uses machine learning to generate interior
            design concepts from a photo instead of a blank page. Chic takes
            that a step further: instead of describing a whole room from
            scratch, you comment on the one you already have, the same way you'd
            leave feedback on a document or a design file.
          </p>
          <p>
            Pin a comment to a specific spot in the photo, or just describe the
            change in general. The AI reads your comment, re-renders the photo
            with that change applied, and leaves the rest of the room alone. It
            usually takes about 20 seconds.
          </p>

          <h2>How to Use Chic: Upload, Comment, Shop</h2>
          <p>
            Redesigning a room with Chic takes three steps. Sharing it is a
            fourth, if you want a second opinion first.
          </p>

          <h3>1. Upload a Photo</h3>
          <p>
            Take a photo of the room you want to change. Get the whole space in
            frame, including furniture, windows, and doors, and use natural
            light if you can. Drop it into the tool above.
          </p>

          <h3>2. Comment on What to Change</h3>
          <p>
            Leave a comment describing what you want different, or click a spot
            in the photo and pin your comment there. Something like "swap the
            sofa for a green velvet one" or "make the rug lighter" works. Leave
            as many comments as you like.
          </p>

          <h3>3. Shop the Look</h3>
          <p>
            Once the room re-renders, tap any piece of furniture in the photo to
            see where to find it on Amazon. If you like the new lamp but not the
            new couch, leave another comment and keep going.
          </p>

          <h3>4. Share It</h3>
          <p>
            Send a before-and-after link to anyone. No account is required to
            view it. Invite someone to comment on the room alongside you if you
            want a second opinion before you buy anything.
          </p>

          <div className="not-prose my-12">
            <div className="relative mx-auto aspect-square max-w-2xl overflow-hidden rounded-3xl">
              <Image
                alt="A bedroom photo redesigned by Chic's AI room designer"
                className="object-cover"
                fill
                src="/images/ai-room-designer-bedroom.png"
              />
            </div>
          </div>

          <h2>Why Use Chic's AI Room Designer?</h2>
          <p>
            A few things make Chic worth trying over sketching it out yourself
            or booking a consultation:
          </p>

          <h3>See It Before You Buy</h3>
          <p>
            Buying furniture you haven't seen in your actual room is a gamble.
            Upload a photo, comment on the piece you're considering, and see how
            it looks in your space before you spend anything.
          </p>

          <h3>It Only Takes About 20 Seconds</h3>
          <p>
            No back-and-forth with a designer, no waiting days for a rendering.
            Leave a comment and the redesigned photo comes back in about 20
            seconds, so you can try five ideas in the time a consultation would
            take to schedule.
          </p>

          <h3>No Prompt-Writing Required</h3>
          <p>
            You don't need the vocabulary for "transitional" or "organic
            modern." Say what you'd say to a friend, like "get rid of that rug,"
            and comment on the photo you already have.
          </p>

          <h3>Every Piece Is Shoppable</h3>
          <p>
            A redesign you can't act on is just a picture. Tap any piece of
            furniture in the photo and we point you to it on Amazon.
          </p>

          <h3>Free, Unlimited Edits</h3>
          <p>
            There's no charge and no limit on how many comments you leave. Try a
            color you're nervous about, undo it with another comment, and keep
            going until the room looks right.
          </p>

          <h2>Popular Design Styles to Try in a Comment</h2>
          <p>
            Not sure what to ask for? Here's a quick guide to some of the styles
            people comment for most.
          </p>

          <div className="not-prose my-12">
            <div className="relative mx-auto aspect-square max-w-2xl overflow-hidden rounded-3xl">
              <Image
                alt="Modern, bohemian, and Scandinavian room style comparisons"
                className="object-cover"
                fill
                src="/images/ai-room-designer-styles.png"
              />
            </div>
          </div>

          <h3>Modern Interior Design</h3>
          <p>
            Clean lines, neutral colors, and minimal ornamentation define modern
            design. Think open spaces, natural materials, and a focus on
            function over form. Try commenting "give this room a modern, minimal
            feel."
          </p>

          <h3>Scandinavian Design</h3>
          <p>
            Light, airy, and functional, Scandinavian design emphasizes
            minimalism, natural materials, and plenty of white space. It's cozy
            yet uncluttered, warm yet minimalist. Try commenting "make this feel
            more Scandinavian."
          </p>

          <h3>Industrial Style</h3>
          <p>
            Exposed brick, metal fixtures, and raw materials characterize
            industrial design. This style celebrates the beauty of unfinished
            spaces, often with a mix of old and new elements. Try commenting
            "give this an industrial look."
          </p>

          <h3>Bohemian (Boho) Design</h3>
          <p>
            Eclectic, colorful, and relaxed, bohemian style is all about
            self-expression and comfort: mixed patterns, layered textiles,
            plants, and a space that feels collected over time. Try commenting
            "make this room more boho."
          </p>

          <h3>Mid-Century Modern</h3>
          <p>
            Popular from the 1940s through the 1960s and back in style again,
            mid-century modern features organic curves, clean lines, and a mix
            of natural and man-made materials. Try commenting "give this a
            mid-century modern look."
          </p>

          <h2>Tips for Getting the Best Results</h2>
          <p>Want to get more out of your comments? Follow these tips:</p>

          <h3>1. Use High-Quality Photos</h3>
          <p>
            The better your input photo, the better your results. Take photos in
            good natural lighting, get the entire room in frame, and avoid
            heavily filtered or edited images.
          </p>

          <h3>2. Declutter Your Space First</h3>
          <p>
            Chic can work with any room, but starting with a decluttered space
            gives you a clearer canvas. Remove unnecessary items from surfaces
            and floors before taking your photo.
          </p>

          <h3>3. Be Specific in Your Comment</h3>
          <p>
            The more specific your comment, the better the result. Instead of
            "nicer sofa," try "a low, curved sofa in green velvet." Pin the
            comment to the exact spot in the photo if you can.
          </p>

          <h3>4. Keep Commenting</h3>
          <p>
            Don't stop at the first result. It's free, so leave another comment,
            try a different color, or start over with a new style. Nothing is
            final until you say so.
          </p>

          <h3>5. Consider Your Lifestyle</h3>
          <p>
            Beautiful design should also be functional. If you have kids or
            pets, mention that in a comment. If you work from home, ask for a
            productive workspace.
          </p>

          <h3>6. Think About Lighting</h3>
          <p>
            Natural and artificial lighting dramatically affect how a design
            looks. If lighting matters to your vision, mention it in your
            comment.
          </p>

          <h2>What Makes Chic Different</h2>
          <p>
            There are plenty of AI design tools. Chic is built around a few
            different choices:
          </p>

          <h3>Free, No Sign-Up</h3>
          <p>
            No credit card, no subscription, no account required to start.
            Upload a photo and start commenting right away. Rooms stick around
            on their own for 7 days; sign in only if you want to keep one
            longer.
          </p>

          <h3>Comment, Don't Prompt</h3>
          <p>
            Instead of a blank text box and a style dropdown, you point at your
            actual photo and say what to change, the way you'd leave feedback on
            a document.
          </p>

          <h3>Every Piece Is Shoppable</h3>
          <p>
            The redesign isn't just something to look at. Tap any piece of
            furniture in the photo to find it, or something close to it, on
            Amazon.
          </p>

          <h3>Share and Get a Second Opinion</h3>
          <p>
            Send a before-and-after link to anyone, or invite someone to comment
            on the room alongside you. No account is required for them to see
            it.
          </p>
        </article>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 font-bold text-3xl">
            Frequently Asked Questions
          </h2>
          <Accordion className="w-full" collapsible type="single">
            <AccordionItem value="item-1">
              <AccordionTrigger>Is Chic really free?</AccordionTrigger>
              <AccordionContent>
                Yes. Uploading a photo and commenting on it to redesign your
                room is free, with no credit card and no sign-up required. Sign
                in only if you want to keep a room longer than 7 days or invite
                someone to edit it with you.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>
                Do I need to create an account?
              </AccordionTrigger>
              <AccordionContent>
                No. Upload a photo and start commenting without signing up.
                Anonymous rooms are kept for 7 days; sign in if you want to keep
                a room longer, access it from another device, or invite a
                collaborator.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>
                How does the AI room redesign actually work?
              </AccordionTrigger>
              <AccordionContent>
                Upload a photo of your room, then leave a comment describing the
                change you want, optionally pinned to the exact spot in the
                photo. The AI reads the comment and re-renders the photo with
                that change applied, usually in about 20 seconds.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>
                Can I ask for more than one change?
              </AccordionTrigger>
              <AccordionContent>
                Yes. Describe several changes in one comment, or leave one
                comment at a time and let the room update after each. There's no
                limit on how many comments you can leave.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>
                What if I don't like the result?
              </AccordionTrigger>
              <AccordionContent>
                Leave another comment and keep refining it. It's free, so
                there's no reason not to try a different color, swap something
                back, or start over with a new style.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>
                Can I buy the furniture shown in my redesigned room?
              </AccordionTrigger>
              <AccordionContent>
                Yes. Tap any piece of furniture in the redesigned photo and
                we'll point you to it, or something close to it, on Amazon.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger>Can I share my redesign?</AccordionTrigger>
              <AccordionContent>
                Yes. Generate a before-and-after link that anyone can view
                without an account, or invite someone to add their own comments
                and edit the room with you.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger>
                What photo format should I use?
              </AccordionTrigger>
              <AccordionContent>
                JPG, PNG, and WebP all work. For the best results, use a
                well-lit photo that shows the whole room, including floors,
                walls, and existing furniture.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9">
              <AccordionTrigger>
                What happens to my room after a few days?
              </AccordionTrigger>
              <AccordionContent>
                Rooms created without an account are kept for 7 days from your
                last edit. Sign in any time before then to keep a room
                indefinitely and reach it from any device.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10">
              <AccordionTrigger>
                What types of rooms can I redesign?
              </AccordionTrigger>
              <AccordionContent>
                Any indoor room with furniture in it: living rooms, bedrooms,
                kitchens, home offices, dining rooms, and more.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-11">
              <AccordionTrigger>
                Do I need design experience to use this?
              </AccordionTrigger>
              <AccordionContent>
                No. There's nothing to learn. Look at your photo, say what you'd
                change out loud, and type that as a comment.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12">
        <Card className="mx-auto max-w-4xl border-2 border-primary/20 bg-linear-to-br from-primary/5 to-primary/10">
          <CardContent className="flex flex-col items-center gap-6 p-8 text-center md:p-12">
            <h2 className="font-bold text-3xl md:text-4xl">
              Ready to See Your Room Redesigned?
            </h2>
            <p className="text-lg text-muted-foreground">
              It's free, takes about 20 seconds, and you don't need an account
              to start.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" variant="brass">
                <Link href="/">Upload a Photo</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/ideas">Browse Room Ideas</Link>
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              ✓ Free, no sign-up &nbsp;•&nbsp; ✓ Comment instead of describing
              &nbsp;•&nbsp; ✓ Shop what you see
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Design Ideas Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 font-bold text-3xl">
            Get Inspired, Room by Room
          </h2>
          <p className="mb-8 text-muted-foreground">
            Not sure where to start? Browse ideas for every room, then bring
            your own photo and make it real.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Link className="hover:underline" href="/ideas/living-room">
                    Living Room Ideas
                  </Link>
                </CardTitle>
                <CardDescription>
                  Discover cozy, stylish living room designs with real product
                  recommendations
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  <Link className="hover:underline" href="/ideas/bedroom">
                    Bedroom Design Ideas
                  </Link>
                </CardTitle>
                <CardDescription>
                  Create your perfect retreat with inspiring bedroom layouts and
                  decor
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  <Link className="hover:underline" href="/ideas/kitchen">
                    Kitchen Design Ideas
                  </Link>
                </CardTitle>
                <CardDescription>
                  Explore modern, farmhouse, and traditional kitchen designs
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  <Link className="hover:underline" href="/ideas/home-office">
                    Home Office Ideas
                  </Link>
                </CardTitle>
                <CardDescription>
                  Design a productive workspace with ergonomic furniture and
                  style
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  <Link className="hover:underline" href="/ideas/dining-room">
                    Dining Room Ideas
                  </Link>
                </CardTitle>
                <CardDescription>
                  Find elegant dining spaces perfect for entertaining and family
                  meals
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  <Link className="hover:underline" href="/ideas">
                    View All Room Ideas
                  </Link>
                </CardTitle>
                <CardDescription>
                  Browse designs across every room type and style
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
