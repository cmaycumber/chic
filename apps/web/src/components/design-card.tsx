import { Heart, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MAX_DISPLAYED_TAGS = 3;

const ROOM_TYPE_LABELS: Record<string, string> = {
  "living-room": "Living Room",
  bedroom: "Bedroom",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  "dining-room": "Dining Room",
  "home-office": "Home Office",
  "family-room": "Family Room",
  nursery: "Nursery",
  outdoor: "Outdoor Space",
};

type DesignCardProps = {
  design: {
    _id: string;
    title: string;
    description: string;
    imageUrl: string | null;
    roomType?: string;
    designStyle?: string;
    likes?: number;
    budget?: number;
    tags?: string[];
    featured?: boolean;
  };
  showRoomType?: boolean;
};

export function DesignCard({ design, showRoomType = false }: DesignCardProps) {
  return (
    <Link href={`/design/${design._id}`}>
      <Card className="group hover:-translate-y-1 h-full overflow-hidden pt-0 transition-all hover:shadow-lg">
        {design.imageUrl ? (
          <div className="relative aspect-square w-full overflow-hidden bg-muted">
            <Image
              alt={design}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              src={design.imageUrl}
            />
            <div className="absolute top-2 right-2 left-2 flex items-start justify-between gap-2">
              {showRoomType && design.roomType ? (
                <Badge className="bg-background/80 backdrop-blur-sm">
                  {ROOM_TYPE_LABELS[design.roomType] || design.roomType}
                </Badge>
              ) : null}
              {design.featured ? (
                <Badge
                  className="bg-background/80 backdrop-blur-sm"
                  variant="secondary"
                >
                  <Sparkles className="mr-1 size-3" />
                  Featured
                </Badge>
              ) : null}
            </div>
          </div>
        ) : null}

        <CardHeader>
          <div className="flex items-center justify-between">
            {design.designStyle ? (
              <Badge variant="outline">
                {design.designStyle.charAt(0).toUpperCase() +
                  design.designStyle.slice(1)}
              </Badge>
            ) : null}
            {design.likes && design.likes > 0 ? (
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <Heart className="size-4" />
                <span>{design.likes}</span>
              </div>
            ) : null}
          </div>
          <CardTitle className="line-clamp-2 transition-colors group-hover:text-primary">
            {design.title}
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {design.description}
          </CardDescription>
        </CardHeader>

        <CardFooter className="flex-col items-start gap-3">
          {design.budget ? (
            <div className="font-medium text-sm">
              Budget: ${design.budget.toLocaleString()}
            </div>
          ) : null}

          {design.tags && design.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {design.tags.slice(0, MAX_DISPLAYED_TAGS).map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardFooter>
      </Card>
    </Link>
  );
}
