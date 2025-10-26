"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import type { Preloaded } from "convex/react";
import { usePreloadedQuery, useQuery } from "convex/react";
import { Heart, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const maxDisplayedTags = 3;

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

type RoomIdeasGalleryProps = {
  roomType: RoomType;
  roomLabel: string;
  preloadedFeatured: Preloaded<typeof api.ideas.getFeaturedRoomDesigns>;
  preloadedFilters: Preloaded<typeof api.ideas.getRoomFilterOptions>;
};

export function RoomIdeasGallery({
  roomType,
  roomLabel,
  preloadedFeatured,
  preloadedFilters,
}: RoomIdeasGalleryProps) {
  const [selectedStyle, setSelectedStyle] = useState<DesignStyle | "all">(
    "all"
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const featuredDesigns = usePreloadedQuery(preloadedFeatured);
  const filterOptions = usePreloadedQuery(preloadedFilters);

  // Fetch all designs with current filters
  const allDesigns = useQuery(api.ideas.getRoomIdeas, {
    roomType,
    style: selectedStyle === "all" ? undefined : selectedStyle,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    limit: 50,
  });

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-7xl">
        {/* Featured Section */}
        {featuredDesigns && featuredDesigns.length > 0 ? (
          <section className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="mb-2 font-bold text-3xl">
                  Featured {roomLabel} Designs
                </h2>
                <p className="text-muted-foreground">
                  Hand-picked designs from our community
                </p>
              </div>
              <Sparkles className="size-8 text-primary" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredDesigns.map(
                (design: {
                  _id: string;
                  title: string;
                  description: string;
                  imageUrl: string | null;
                  designStyle?: string;
                  likes?: number;
                  budget?: number;
                  tags?: string[];
                  featured?: boolean;
                }) => (
                  <DesignCard design={design} key={design._id} />
                )
              )}
            </div>
          </section>
        ) : null}

        {/* Filters */}
        <section className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <p className="mb-2 block font-medium text-sm">Filter by Style</p>
              <Select
                onValueChange={(value) =>
                  setSelectedStyle(value as DesignStyle | "all")
                }
                value={selectedStyle}
              >
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="All Styles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Styles</SelectItem>
                  {filterOptions?.styles.map(
                    (style: { style: string; count: number }) => (
                      <SelectItem key={style.style} value={style.style}>
                        {style.style.charAt(0).toUpperCase() +
                          style.style.slice(1)}{" "}
                        ({style.count})
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {filterOptions && filterOptions.tags.length > 0 ? (
              <div className="flex-1">
                <p className="mb-2 block font-medium text-sm">Filter by Tags</p>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.tags
                    .slice(0, 10)
                    .map((tagOption: { tag: string; count: number }) => (
                      <Badge
                        className="cursor-pointer"
                        key={tagOption.tag}
                        onClick={() => handleTagToggle(tagOption.tag)}
                        variant={
                          selectedTags.includes(tagOption.tag)
                            ? "default"
                            : "outline"
                        }
                      >
                        {tagOption.tag} ({tagOption.count})
                      </Badge>
                    ))}
                </div>
              </div>
            ) : null}
          </div>

          {selectedStyle !== "all" || selectedTags.length > 0 ? (
            <div className="mt-4">
              <Button
                onClick={() => {
                  setSelectedStyle("all");
                  setSelectedTags([]);
                }}
                size="sm"
                variant="ghost"
              >
                Clear Filters
              </Button>
            </div>
          ) : null}
        </section>

        {/* All Designs Grid */}
        <section>
          <h2 className="mb-6 font-bold text-2xl">
            All {roomLabel} Designs
            {allDesigns ? ` (${allDesigns.length})` : ""}
          </h2>

          {allDesigns && allDesigns.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {allDesigns.map(
                (design: {
                  _id: string;
                  title: string;
                  description: string;
                  imageUrl: string | null;
                  designStyle?: string;
                  likes?: number;
                  budget?: number;
                  tags?: string[];
                  featured?: boolean;
                }) => (
                  <DesignCard design={design} key={design._id} />
                )
              )}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                No designs found with the selected filters. Try adjusting your
                selection.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function DesignCard({
  design,
}: {
  design: {
    _id: string;
    title: string;
    description: string;
    imageUrl: string | null;
    designStyle?: string;
    likes?: number;
    budget?: number;
    tags?: string[];
    featured?: boolean;
  };
}) {
  return (
    <Link href={`/design/${design._id}`}>
      <Card className="group hover:-translate-y-1 h-full overflow-hidden transition-all hover:shadow-lg">
        {design.imageUrl ? (
          <div className="relative aspect-square w-full overflow-hidden bg-muted">
            <Image
              alt={design.title}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              src={design.imageUrl}
            />
            {design.featured ? (
              <Badge className="absolute top-2 right-2" variant="secondary">
                <Sparkles className="mr-1 size-3" />
                Featured
              </Badge>
            ) : null}
          </div>
        ) : null}

        <CardHeader>
          <div className="mb-2 flex items-center justify-between">
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

        <CardContent>
          <div className="flex items-center justify-between">
            {design.budget ? (
              <span className="font-medium text-sm">
                Budget: ${design.budget.toLocaleString()}
              </span>
            ) : null}
          </div>

          {design.tags && design.tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1">
              {design.tags.slice(0, maxDisplayedTags).map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
