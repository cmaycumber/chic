"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { DesignCard } from "@/components/design-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface Design {
  _creationTime: number;
  _id: Id<"designs">;
  budget?: number;
  description: string;
  designStyle?: DesignStyle;
  featured?: boolean;
  imageUrl: string | null;
  likesCount?: number;
  roomType?: RoomType;
  tags?: string[];
  title: string;
}

interface FilterOptions {
  styles: {
    style: string;
    count: number;
  }[];
  tags: {
    tag: string;
    count: number;
  }[];
}

interface RoomIdeasGalleryProps {
  initialFeatured: Design[];
  initialFilters: FilterOptions;
  roomLabel: string;
  roomType: RoomType;
}

export function RoomIdeasGallery({
  roomType,
  roomLabel,
  initialFeatured,
  initialFilters,
}: RoomIdeasGalleryProps) {
  const [selectedStyle, setSelectedStyle] = useState<DesignStyle | "all">(
    "all"
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Use initial data from SSR
  const featuredDesigns = initialFeatured;
  const filterOptions = initialFilters;

  // Fetch all designs with current filters
  const allDesigns = useQuery(api.ideas.getRoomIdeas, {
    limit: 50,
    roomType,
    style: selectedStyle === "all" ? undefined : selectedStyle,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
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
        {featuredDesigns.length > 0 ? (
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
              {featuredDesigns.map((design) => (
                <DesignCard design={design} key={design._id} />
              ))}
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
                  {filterOptions.styles.map(
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
              {allDesigns.map((design) => (
                <DesignCard design={design} key={design._id} />
              ))}
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
