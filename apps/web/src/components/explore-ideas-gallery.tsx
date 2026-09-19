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

const maxFilterTags = 15;

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

interface ExploreIdeasGalleryProps {
  initialTrending: Design[];
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  bathroom: "Bathroom",
  bedroom: "Bedroom",
  "dining-room": "Dining Room",
  "family-room": "Family Room",
  "home-office": "Home Office",
  kitchen: "Kitchen",
  "living-room": "Living Room",
  nursery: "Nursery",
  outdoor: "Outdoor Space",
};

export function ExploreIdeasGallery({
  initialTrending,
}: ExploreIdeasGalleryProps) {
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | "all">(
    "all"
  );
  const [selectedStyle, setSelectedStyle] = useState<DesignStyle | "all">(
    "all"
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Use initial data from SSR
  const trendingDesigns = initialTrending;

  // Fetch filter options
  const filterOptions = useQuery(api.ideas.getExploreFilterOptions);

  // Fetch all designs with current filters
  const allDesigns = useQuery(api.ideas.exploreAllDesigns, {
    limit: 100,
    roomType: selectedRoomType === "all" ? undefined : selectedRoomType,
    style: selectedStyle === "all" ? undefined : selectedStyle,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
  });

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const hasActiveFilters =
    selectedRoomType !== "all" ||
    selectedStyle !== "all" ||
    selectedTags.length > 0;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-7xl">
        {/* Trending Section */}
        {trendingDesigns.length > 0 ? (
          <section className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="mb-2 font-bold text-3xl">Trending Designs</h2>
                <p className="text-muted-foreground">
                  Most popular designs this week
                </p>
              </div>
              <Sparkles className="size-8 text-primary" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {trendingDesigns.map((design) => (
                <DesignCard
                  design={design}
                  href={`/design/${design._id}`}
                  key={design._id}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* Filters */}
        <section className="mb-8">
          <h2 className="mb-4 font-bold text-2xl">Explore All Designs</h2>
          <div className="flex flex-col gap-4">
            {/* Primary Filters Row */}
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="mb-2 block font-medium text-sm">Room Type</p>
                <Select
                  onValueChange={(value) =>
                    setSelectedRoomType(value as RoomType | "all")
                  }
                  value={selectedRoomType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Rooms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rooms</SelectItem>
                    {filterOptions?.roomTypes.map(
                      (room: { roomType: string; count: number }) => (
                        <SelectItem key={room.roomType} value={room.roomType}>
                          {ROOM_TYPE_LABELS[room.roomType] || room.roomType} (
                          {room.count})
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="mb-2 block font-medium text-sm">Style</p>
                <Select
                  onValueChange={(value) =>
                    setSelectedStyle(value as DesignStyle | "all")
                  }
                  value={selectedStyle}
                >
                  <SelectTrigger>
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

              <div className="flex items-end">
                {hasActiveFilters ? (
                  <Button
                    className="w-full"
                    onClick={() => {
                      setSelectedRoomType("all");
                      setSelectedStyle("all");
                      setSelectedTags([]);
                    }}
                    variant="outline"
                  >
                    Clear All Filters
                  </Button>
                ) : null}
              </div>
            </div>

            {/* Tags Filter Row */}
            {filterOptions && filterOptions.tags.length > 0 ? (
              <div>
                <p className="mb-2 block font-medium text-sm">Filter by Tags</p>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.tags
                    .slice(0, maxFilterTags)
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
        </section>

        {/* All Designs Grid */}
        <section>
          <h3 className="mb-6 font-bold text-xl">
            {hasActiveFilters ? "Filtered Designs" : "All Designs"}
            {allDesigns ? ` (${allDesigns.length})` : ""}
          </h3>

          {allDesigns && allDesigns.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {allDesigns.map((design) => (
                <DesignCard
                  design={design}
                  href={`/design/${design._id}`}
                  key={design._id}
                />
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
