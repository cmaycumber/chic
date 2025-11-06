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
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header with filters */}
        <div className="border-border/40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="mx-auto max-w-7xl p-4 sm:p-6">
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
                  onValueChange={(value) =>
                    setSelectedRoomType(value as RoomType)
                  }
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
                  onValueChange={(value) =>
                    setSelectedStyle(value as DesignStyle)
                  }
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

                {(selectedRoomType || selectedStyle) && (
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
          </div>
        </div>

        {/* Designs Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 sm:p-6">{renderDesigns()}</div>
        </div>
      </div>
    </div>
  );
}
