"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type RoomType =
  | "living-room"
  | "bedroom"
  | "kitchen"
  | "bathroom"
  | "dining-room"
  | "home-office"
  | "family-room"
  | "nursery"
  | "outdoor";

type DesignStyle =
  | "modern"
  | "minimalist"
  | "scandinavian"
  | "industrial"
  | "bohemian"
  | "coastal"
  | "traditional"
  | "contemporary";

const ROOM_TYPES: Array<{ value: RoomType; label: string }> = [
  { label: "Living Room", value: "living-room" },
  { label: "Bedroom", value: "bedroom" },
  { label: "Kitchen", value: "kitchen" },
  { label: "Bathroom", value: "bathroom" },
  { label: "Dining Room", value: "dining-room" },
  { label: "Home Office", value: "home-office" },
  { label: "Family Room", value: "family-room" },
  { label: "Nursery", value: "nursery" },
  { label: "Outdoor", value: "outdoor" },
];

const DESIGN_STYLES: Array<{ value: DesignStyle; label: string }> = [
  { label: "Modern", value: "modern" },
  { label: "Minimalist", value: "minimalist" },
  { label: "Scandinavian", value: "scandinavian" },
  { label: "Industrial", value: "industrial" },
  { label: "Bohemian", value: "bohemian" },
  { label: "Coastal", value: "coastal" },
  { label: "Traditional", value: "traditional" },
  { label: "Contemporary", value: "contemporary" },
];

interface DesignCardProps {
  design: {
    _id: Id<"designs">;
    _creationTime: number;
    title: string;
    description: string;
    imageUrl: string | null;
    roomType?: RoomType;
    designStyle?: DesignStyle;
    likesCount?: number;
    views?: number;
    budget?: number;
    tags?: string[];
    featured?: boolean;
  };
  href?: string;
  showLikeButton?: boolean;
}

export function DesignCard({
  design,
  showLikeButton = true,
  href,
}: DesignCardProps) {
  const { isAuthenticated } = useConvexAuth();
  const toggleLike = useMutation(
    api.likes.toggleDesignLike
  ).withOptimisticUpdate((localStore, args) => {
    // Optimistically toggle the liked state
    const currentValue = localStore.getQuery(api.likes.isDesignLiked, {
      designId: args.designId,
    });

    if (currentValue !== undefined) {
      localStore.setQuery(
        api.likes.isDesignLiked,
        { designId: args.designId },
        !currentValue
      );
    }
  });

  const isLiked = useQuery(
    api.likes.isDesignLiked,
    isAuthenticated
      ? {
          designId: design._id,
        }
      : "skip"
  );

  // Get the real-time likes count from the aggregate
  const likesCount = useQuery(api.likes.getDesignLikesCount, {
    designId: design._id,
  });

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike({ designId: design._id });
  };

  const displayLikesCount = likesCount ?? design.likesCount ?? 0;
  const hasLikes = displayLikesCount > 0;

  const linkHref = href ?? `/explore/${design._id}`;

  return (
    <Link href={{ pathname: linkHref }}>
      <Card className="group cursor-pointer overflow-hidden pt-0 transition-shadow hover:shadow-lg">
        <div className="relative aspect-video overflow-hidden bg-muted">
          <Image
            alt={design.title}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            src={design.imageUrl ?? ""}
          />
          <div className="absolute top-2 right-2 flex gap-2">
            {Boolean(design.featured) && (
              <Badge variant="secondary">Featured</Badge>
            )}
            {Boolean(showLikeButton) && (
              <Button
                className={cn(
                  "size-8 cursor-pointer rounded-full bg-background/80 p-0 backdrop-blur hover:bg-background/90",
                  isLiked && "bg-like-muted hover:bg-like-muted-hover"
                )}
                disabled={isLiked === undefined}
                onClick={handleLikeClick}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Heart
                  className={cn(
                    "size-4 transition-colors",
                    isLiked ? "fill-like text-like" : "text-foreground"
                  )}
                />
                <span className="sr-only">
                  {isLiked ? "Unlike design" : "Like design"}
                </span>
              </Button>
            )}
          </div>
        </div>
        <CardHeader className="space-y-1 p-3">
          <CardTitle className="line-clamp-1 text-sm">{design.title}</CardTitle>
          <CardDescription className="line-clamp-2 text-xs">
            {design.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 p-3 pt-0">
          <div className="flex flex-wrap gap-1.5">
            {Boolean(design.roomType) && (
              <Badge className="text-xs" variant="outline">
                {ROOM_TYPES.find((rt) => rt.value === design.roomType)?.label ||
                  design.roomType}
              </Badge>
            )}
            {Boolean(design.designStyle) && (
              <Badge className="text-xs" variant="outline">
                {DESIGN_STYLES.find((ds) => ds.value === design.designStyle)
                  ?.label || design.designStyle}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-border/40 border-t p-3">
          <div className="flex items-center gap-3 text-muted-foreground text-xs">
            <span className="flex items-center gap-1">
              <Heart
                className={cn(
                  "size-3",
                  hasLikes ? "fill-current text-like" : "text-muted-foreground"
                )}
              />
              {displayLikesCount}
            </span>
          </div>
          {design.budget ? (
            <div className="font-medium text-xs">
              ${design.budget.toLocaleString()}
            </div>
          ) : null}
        </CardFooter>
      </Card>
    </Link>
  );
}
