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
  title: "Free AI Room Designer Tool - Transform Your Space in Seconds | Chic",
  description:
    "Transform any room with our free AI room designer. Upload a photo, describe your vision, and get professional interior design ideas instantly. Free forever, no credit card required.",
  keywords: [
    "ai room designer",
    "free room design tool",
    "interior design ai",
    "room redesign",
    "virtual room designer",
    "ai interior design",
  ],
  openGraph: {
    title: "Free AI Room Designer Tool - Transform Your Space in Seconds",
    description:
      "Transform any room with our free AI room designer. Upload a photo, describe your vision, and get professional interior design ideas instantly.",
    type: "website",
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
              AI Room Designer Free Tool for Instant Interior Design Ideas
            </h1>
            <p className="text-muted-foreground md:text-lg">
              Transform any room with our free AI room designer. Upload a photo,
              customize your style, and watch AI create stunning design
              variations. 100% free—no credit card required.
            </p>
          </div>

          {/* Tool Interface - Prominently Placed */}
          <RoomDesignerTool />
        </div>
      </section>

      {/* Main Content Section */}
      <section className="container mx-auto px-4 py-12">
        <article className="prose prose-lg dark:prose-invert mx-auto max-w-4xl">
          <h2>Transform Any Room with Our Free AI Room Designer Tool</h2>
          <p>
            Are you looking to redesign your living space but don't know where
            to start? Whether you're moving into a new home, refreshing a tired
            room, or just dreaming about your perfect space, our free AI room
            designer is here to help.
          </p>
          <p>
            Interior design can be expensive and time-consuming. Hiring a
            professional designer can cost thousands of dollars, and even then,
            you might not get exactly what you envisioned. That's where
            AI-powered interior design comes in.
          </p>
          <p>
            Our AI room designer uses advanced artificial intelligence to
            analyze your space and generate professional-quality design concepts
            in seconds. Simply upload a photo of your room, select your
            preferred style, and let our AI do the rest. You'll get multiple
            design variations to choose from, each one tailored to your specific
            space and style preferences.
          </p>

          <h2>What is an AI Room Designer Tool?</h2>
          <p>
            An AI room designer tool is an innovative piece of software that
            uses artificial intelligence and machine learning to create interior
            design concepts for your space. Unlike traditional design software
            that requires manual placement of furniture and decor, AI room
            designers analyze your room's dimensions, lighting, and existing
            features to automatically generate cohesive, professional design
            ideas.
          </p>
          <p>
            This free AI room designer is incredibly easy to use. Just upload a
            photo of your current room, select your desired style and room type,
            and our AI will generate multiple design variations in seconds. No
            design experience necessary, no complicated software to learn—just
            beautiful results.
          </p>

          <h2>How to Use the Free AI Room Designer Tool</h2>
          <p>
            Ready to start transforming your space? Using our AI room designer
            is simple and takes just a few steps:
          </p>

          <h3>1. Upload a Photo of Your Room</h3>
          <p>
            Start by taking a clear photo of the room you want to redesign. Make
            sure the photo captures the entire space, including windows, doors,
            and any existing furniture. Natural lighting works best, so try to
            take the photo during the day. Upload the photo using the tool
            above.
          </p>

          <h3>2. Select Your Room Type</h3>
          <p>
            Choose what type of room you're designing from our dropdown menu.
            Whether it's a living room, bedroom, kitchen, or any other space,
            selecting the correct room type helps our AI understand the
            functional requirements and generate more appropriate designs.
          </p>

          <h3>3. Choose Your Design Style</h3>
          <p>
            Select the interior design style that resonates with you. We offer a
            wide range of styles including Modern, Scandinavian, Industrial,
            Bohemian, and many more. Not sure which style suits you? Check out
            our <Link href="/ideas">design ideas gallery</Link> for examples of
            each style.
          </p>

          <h3>4. Add Your Design Vision (Optional)</h3>
          <p>
            Want to be more specific? Use the description field to tell our AI
            exactly what you're looking for. Maybe you want "a cozy reading nook
            with warm earth tones" or "a minimalist workspace with plenty of
            natural light." The more details you provide, the more personalized
            your results will be.
          </p>

          <h3>5. Generate Your AI Design</h3>
          <p>
            Click the "Generate AI Design" button and watch the magic happen!
            Our AI will process your photo and preferences to create
            professional design concepts in seconds. You'll receive multiple
            variations to choose from, and you can regenerate as many times as
            you like—it's completely free.
          </p>

          <div className="not-prose my-12">
            <div className="relative mx-auto aspect-square max-w-2xl overflow-hidden rounded-3xl">
              <Image
                alt="Minimalist abstract bedroom interior design illustration"
                className="object-cover"
                fill
                src="/images/ai-room-designer-bedroom.png"
              />
            </div>
          </div>

          <h2>Why Use an AI Room Designer?</h2>
          <p>
            There are countless benefits to using an AI-powered interior design
            tool instead of traditional methods:
          </p>

          <h3>Save Thousands on Designer Fees</h3>
          <p>
            Professional interior designers typically charge $50-$200 per hour,
            with full room designs often costing $2,000-$5,000 or more. Our AI
            room designer is completely free, giving you professional-quality
            designs without the hefty price tag.
          </p>

          <h3>Get Instant Results</h3>
          <p>
            Traditional design consultations can take weeks or even months. With
            our AI tool, you get multiple design concepts in seconds. You can
            experiment with different styles, iterate on ideas, and find your
            perfect design in a fraction of the time.
          </p>

          <h3>Visualize Before You Buy</h3>
          <p>
            Making expensive furniture and decor purchases without knowing how
            they'll look in your space is risky. Our AI room designer lets you
            see exactly how different pieces, colors, and arrangements will look
            before you spend a penny on physical items.
          </p>

          <h3>Experiment Risk-Free</h3>
          <p>
            Want to try a bold color on your walls but nervous about committing?
            Curious how that expensive sofa would look in your living room? With
            our AI tool, you can experiment with unlimited design ideas without
            any risk or commitment.
          </p>

          <h3>Get Professional-Quality Designs</h3>
          <p>
            Our AI has been trained on thousands of professionally designed
            interiors. It understands color theory, spatial relationships,
            proportion, and all the principles that make a room feel cohesive
            and beautiful. You get expert-level design knowledge without needing
            any expertise yourself.
          </p>

          <h2>Popular Design Styles for Your AI Room Redesign</h2>
          <p>
            Not sure which design style is right for you? Here's a quick guide
            to some of the most popular interior design styles available in our
            AI room designer:
          </p>

          <div className="not-prose my-12">
            <div className="relative mx-auto aspect-square max-w-2xl overflow-hidden rounded-3xl">
              <Image
                alt="Minimalist abstract design style variations showing modern, bohemian, and scandinavian aesthetics"
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
            function over form. Perfect for those who appreciate simplicity and
            contemporary aesthetics.
          </p>

          <h3>Scandinavian Design</h3>
          <p>
            Light, airy, and functional—Scandinavian design emphasizes
            minimalism, natural materials, and plenty of white space. It's cozy
            yet uncluttered, warm yet minimalist. Ideal for creating serene,
            welcoming spaces.
          </p>

          <h3>Industrial Style</h3>
          <p>
            Exposed brick, metal fixtures, and raw materials characterize
            industrial design. This style celebrates the beauty of unfinished
            spaces and often features open floor plans, high ceilings, and a mix
            of old and new elements.
          </p>

          <h3>Bohemian (Boho) Design</h3>
          <p>
            Eclectic, colorful, and relaxed—bohemian style is all about
            self-expression and comfort. Mix patterns, textures, and colors
            freely. Layer textiles, display art and plants, and create a space
            that feels collected over time.
          </p>

          <h3>Mid-Century Modern</h3>
          <p>
            Popular from the 1940s-1960s and experiencing a major revival,
            mid-century modern features organic curves, clean lines, and a mix
            of natural and man-made materials. Think iconic furniture pieces and
            retro-inspired color palettes.
          </p>

          <h2>Tips for Getting the Best Results from Your AI Room Designer</h2>
          <p>
            Want to maximize the quality of your AI-generated room designs?
            Follow these expert tips:
          </p>

          <h3>1. Use High-Quality Photos</h3>
          <p>
            The better your input photo, the better your results. Take photos in
            good natural lighting, ensure the entire room is visible, and avoid
            heavily filtered or edited images. A clear, well-lit photo helps the
            AI accurately understand your space.
          </p>

          <h3>2. Declutter Your Space First</h3>
          <p>
            While our AI can work with any room, starting with a decluttered
            space gives you a clearer canvas to work from. Remove unnecessary
            items from surfaces and floors before taking your photo.
          </p>

          <h3>3. Be Specific with Your Description</h3>
          <p>
            The more details you provide about your vision, the more
            personalized your results will be. Instead of "nice living room,"
            try "cozy living room with a fireplace focal point, warm earth
            tones, and space for family game nights."
          </p>

          <h3>4. Try Multiple Styles</h3>
          <p>
            Don't limit yourself to one style! Our tool is free, so experiment
            with different design styles to see what resonates with you. You
            might be surprised by a style you hadn't considered before.
          </p>

          <h3>5. Consider Your Lifestyle</h3>
          <p>
            Beautiful design should also be functional. Consider who uses the
            space and how. If you have kids or pets, mention that in your
            description. If you work from home, emphasize the need for a
            productive workspace.
          </p>

          <h3>6. Think About Lighting</h3>
          <p>
            Natural and artificial lighting dramatically affect how a design
            looks. Consider your room's lighting situation and mention it in
            your description if it's particularly important to your design
            vision.
          </p>

          <h2>What Makes Our AI Room Designer Different?</h2>
          <p>
            There are several AI design tools on the market, but ours stands out
            for several reasons:
          </p>

          <h3>It's Truly Free (Forever)</h3>
          <p>
            Unlike other tools that offer limited free trials or require credit
            cards, our AI room designer is completely free. No hidden fees, no
            subscription required, no credit card necessary. We believe everyone
            deserves access to great design.
          </p>

          <h3>Professional-Quality Results</h3>
          <p>
            Our AI has been trained on thousands of professionally designed
            interiors from top designers around the world. It understands the
            principles of good design and applies them to create cohesive,
            beautiful spaces.
          </p>

          <h3>Easy to Use</h3>
          <p>
            You don't need any design experience or technical knowledge. Our
            interface is intuitive and straightforward—upload, select, describe,
            and generate. That's it.
          </p>

          <h3>Multiple Variations</h3>
          <p>
            We don't just give you one design option. Our AI generates multiple
            variations so you can choose the one that best fits your vision. And
            you can regenerate as many times as you want.
          </p>

          <h3>Integrated with Full Design Platform</h3>
          <p>
            Our AI room designer isn't just a standalone tool. It's part of the
            complete Chic platform, which includes a shopping assistant,
            inspiration galleries, project management tools, and more. Design
            your space, find the perfect furniture, and manage your entire
            redesign project all in one place.
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
              <AccordionTrigger>
                Is the AI room designer really free?
              </AccordionTrigger>
              <AccordionContent>
                Yes, absolutely! Our AI room designer is 100% free to use, with
                no hidden fees, no trial periods, and no credit card required.
                We believe everyone should have access to professional-quality
                interior design tools, regardless of budget. You can generate
                unlimited room designs completely free.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>
                How does the AI room designer work?
              </AccordionTrigger>
              <AccordionContent>
                Our AI room designer uses advanced machine learning algorithms
                trained on thousands of professionally designed interiors. When
                you upload a photo, the AI analyzes your room's dimensions,
                lighting, architectural features, and existing elements. It then
                applies your selected style preferences and generates multiple
                design concepts that are both beautiful and feasible for your
                specific space.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>
                Do I need design experience to use this tool?
              </AccordionTrigger>
              <AccordionContent>
                Not at all! Our AI room designer is built for everyone, whether
                you're a design professional or someone who's never thought
                about interior design before. The interface is intuitive and
                straightforward—just upload a photo, make a few selections, and
                let the AI do the heavy lifting. No design knowledge required.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>
                What types of rooms can I design?
              </AccordionTrigger>
              <AccordionContent>
                You can design any room in your home! Our AI works with living
                rooms, bedrooms, kitchens, bathrooms, dining rooms, home
                offices, nurseries, and even outdoor spaces. Each room type is
                handled differently by the AI to account for the unique
                functional requirements and design considerations of that space.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>
                How accurate are the AI-generated designs?
              </AccordionTrigger>
              <AccordionContent>
                Our AI generates highly realistic and feasible designs based on
                your actual room dimensions and features. While the designs are
                computer-generated visualizations, they're based on real design
                principles and proportions. The furniture, colors, and layouts
                shown are all achievable in real life. Think of them as
                professional design renderings that give you a clear vision of
                what your space could become.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>
                Can I buy the furniture shown in my AI design?
              </AccordionTrigger>
              <AccordionContent>
                Yes! Once you've generated a design you love, you can use our
                integrated shopping assistant to find similar furniture and
                decor items from various retailers. Our platform can help you
                source pieces that match your AI-generated design, making it
                easy to bring your vision to life.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger>
                How many designs can I generate?
              </AccordionTrigger>
              <AccordionContent>
                Unlimited! Since our tool is free, you can generate as many
                design variations as you like. Try different styles, experiment
                with various descriptions, or upload multiple angles of the same
                room. There are no limits or restrictions.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger>
                What photo format should I use?
              </AccordionTrigger>
              <AccordionContent>
                We accept JPG, PNG, and WebP image formats. For best results,
                use a high-resolution photo taken in good natural lighting. Make
                sure the entire room is visible in the frame, including floors,
                walls, and any existing furniture or architectural features.
                Avoid heavily filtered or edited photos.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9">
              <AccordionTrigger>
                Can I save and share my AI-generated designs?
              </AccordionTrigger>
              <AccordionContent>
                Yes! Once you create a free account, you can save your favorite
                designs, create project boards, and share them with family,
                friends, or contractors. You can also download high-resolution
                images of your designs to use as reference when shopping or
                working with professionals.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10">
              <AccordionTrigger>
                What if I don't like the AI-generated designs?
              </AccordionTrigger>
              <AccordionContent>
                No problem! Simply adjust your inputs and generate again. Try a
                different design style, modify your description, or provide more
                specific details about what you're looking for. The AI learns
                from your inputs, so the more specific you are, the better the
                results. Since it's free, you can experiment as much as you want
                until you find a design you love.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-11">
              <AccordionTrigger>
                How is this different from hiring an interior designer?
              </AccordionTrigger>
              <AccordionContent>
                While our AI can't fully replace the personalized service and
                expertise of a human interior designer, it offers several
                advantages: it's free, instant, and great for exploring ideas.
                Think of it as a powerful tool to help you discover your style
                and visualize possibilities before making decisions. Some people
                use our AI to develop concepts, then work with a designer to
                refine and implement them. Others use it to complete entire
                projects themselves.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-12">
              <AccordionTrigger>
                Do I need to create an account to use the tool?
              </AccordionTrigger>
              <AccordionContent>
                You can explore the tool and see how it works without an
                account, but creating a free account allows you to generate
                designs, save your favorites, create projects, and access all of
                our platform's features. Account creation is quick, free, and
                requires no credit card.
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
              Ready to Transform Your Space?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of people who have already redesigned their homes
              with our free AI room designer. No credit card required, no hidden
              fees—just beautiful design at your fingertips.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/signup">Start Designing for Free</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/ideas">View Design Examples</Link>
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              ✓ 100% Free Forever &nbsp;•&nbsp; ✓ No Design Experience Needed
              &nbsp;•&nbsp; ✓ Unlimited Designs
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Design Ideas Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 font-bold text-3xl">
            Browse Interior Design Ideas by Room
          </h2>
          <p className="mb-8 text-muted-foreground">
            Explore hundreds of professionally curated design ideas for every
            room in your home. Get inspired, save your favorites, and recreate
            them with our AI room designer.
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
                    View All Design Ideas
                  </Link>
                </CardTitle>
                <CardDescription>
                  Browse 500+ designs across all room types and styles
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
