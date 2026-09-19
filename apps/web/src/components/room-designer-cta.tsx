import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface RoomDesignerCtaProps {
  roomType: string;
}

export function RoomDesignerCta({ roomType }: RoomDesignerCtaProps) {
  const roomLabel = roomType
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <section className="container mx-auto px-4 py-12">
      <Card className="mx-auto max-w-7xl border-2 border-primary/20 bg-linear-to-br from-primary/5 to-primary/10">
        <CardContent className="flex flex-col items-center gap-6 p-8 text-center md:p-12">
          <h2 className="font-bold text-3xl md:text-4xl">
            Design Your Own {roomLabel}
          </h2>
          <p className="text-lg text-muted-foreground">
            Love these designs but want something personalized? Use our free AI
            room designer to create a custom {roomLabel.toLowerCase()} tailored
            to your style, space, and budget.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/design-tools/ai-room-designer">
                Try AI Room Designer
              </Link>
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">
            ✓ 100% Free &nbsp;•&nbsp; ✓ Instant Results &nbsp;•&nbsp; ✓
            Personalized for Your Space
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
