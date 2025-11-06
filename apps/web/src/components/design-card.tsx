"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
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
  { value: "living-room", label: "Living Room" },
  { value: "bedroom", label: "Bedroom" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "dining-room", label: "Dining Room" },
  { value: "home-office", label: "Home Office" },
  { value: "family-room", label: "Family Room" },
  { value: "nursery", label: "Nursery" },
  { value: "outdoor", label: "Outdoor" },
];

const DESIGN_STYLES: Array<{ value: DesignStyle; label: string }> = [
  { value: "modern", label: "Modern" },
  { value: "minimalist", label: "Minimalist" },
  { value: "scandinavian", label: "Scandinavian" },
  { value: "industrial", label: "Industrial" },
  { value: "bohemian", label: "Bohemian" },
  { value: "coastal", label: "Coastal" },
  { value: "traditional", label: "Traditional" },
  { value: "contemporary", label: "Contemporary" },
];

type DesignCardProps = {
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
  showLikeButton?: boolean;
  href?: string;
};

export function DesignCard({
  design,
  showLikeButton = true,
  href,
}: DesignCardProps) {
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

  const isLiked = useQuery(api.likes.isDesignLiked, {
    designId: design._id,
  });

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

  const cardContent = (
    <>
      {design.imageUrl && (
        <div className="relative aspect-video overflow-hidden bg-muted">
          <Image
            alt={design.title}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            src={design.imageUrl}
          />
          <div className="absolute top-2 right-2 flex gap-2">
            {design.featured && <Badge variant="secondary">Featured</Badge>}
            {showLikeButton && (
              <Button
                className={cn(
                  "size-8 cursor-pointer rounded-full bg-background/80 p-0 backdrop-blur hover:bg-background/90",
                  isLiked && "bg-red-50 hover:bg-red-100"
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
                    isLiked ? "fill-red-500 text-red-500" : "text-foreground"
                  )}
                />
                <span className="sr-only">
                  {isLiked ? "Unlike design" : "Like design"}
                </span>
              </Button>
            )}
          </div>
        </div>
      )}
      <CardHeader className="space-y-1 p-3">
        <CardTitle className="line-clamp-1 text-sm">{design.title}</CardTitle>
        <CardDescription className="line-clamp-2 text-xs">
          {design.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-0">
        <div className="flex flex-wrap gap-1.5">
          {design.roomType && (
            <Badge className="text-xs" variant="outline">
              {ROOM_TYPES.find((rt) => rt.value === design.roomType)?.label ||
                design.roomType}
            </Badge>
          )}
          {design.designStyle && (
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
                hasLikes ? "fill-current text-red-500" : "text-muted-foreground"
              )}
            />
            {displayLikesCount}
          </span>
          {design.views !== undefined && design.views > 0 && (
            <span>👁️ {design.views}</span>
          )}
        </div>
        {design.budget && (
          <div className="font-medium text-xs">
            ${design.budget.toLocaleString()}
          </div>
        )}
      </CardFooter>
    </>
  );

  return (
    <Link
      href={{
        pathname: href ?? null,
      }}
    >
      <Card className="group cursor-pointer overflow-hidden pt-0 transition-shadow hover:shadow-lg">
        {cardContent}
      </Card>
    </Link>
  );
}
