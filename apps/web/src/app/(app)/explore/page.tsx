"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { DesignCard } from "@/components/design-card";
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

export default function ExplorePage() {
  const [selectedRoomType, setSelectedRoomType] = useState<
    RoomType | undefined
  >();
  const [selectedStyle, setSelectedStyle] = useState<DesignStyle | undefined>();

  const designs = useQuery(api.ideas.exploreAllDesigns, {
    roomType: selectedRoomType,
    style: selectedStyle,
  });

  const renderDesigns = () => {
    if (designs === undefined) {
      return (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Loading designs...</p>
          </div>
        </div>
      );
    }

    if (designs.length === 0) {
      return (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">No designs found</p>
            <p className="mt-2 text-muted-foreground text-sm">
              Try adjusting your filters or check back later
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {designs.map((design) => (
          <DesignCard
            design={design}
            href={`/explore/${design._id}`}
            key={design._id}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-4">
        <div>
          <h1 className="font-bold text-2xl tracking-tight sm:text-3xl">
            Explore Designs
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Discover inspiring room designs and ideas
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            onValueChange={(value) => setSelectedRoomType(value as RoomType)}
            value={selectedRoomType}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Room Type" />
            </SelectTrigger>
            <SelectContent>
              {ROOM_TYPES.map((roomType) => (
                <SelectItem key={roomType.value} value={roomType.value}>
                  {roomType.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) => setSelectedStyle(value as DesignStyle)}
            value={selectedStyle}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Design Style" />
            </SelectTrigger>
            <SelectContent>
              {DESIGN_STYLES.map((style) => (
                <SelectItem key={style.value} value={style.value}>
                  {style.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {Boolean(selectedRoomType || selectedStyle) && (
            <Button
              onClick={() => {
                setSelectedRoomType(undefined);
                setSelectedStyle(undefined);
              }}
              size="sm"
              type="button"
              variant="ghost"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Designs Grid */}
      <div className="mt-6">{renderDesigns()}</div>
    </div>
  );
}
