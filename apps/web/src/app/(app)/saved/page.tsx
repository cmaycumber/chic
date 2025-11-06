"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Heart, Loader2 } from "lucide-react";
import Link from "next/link";
import { DesignCard } from "@/components/design-card";
import { Button } from "@/components/ui/button";

export default function SavedDesignsPage() {
  const likedDesigns = useQuery(api.likes.getUserLikedDesigns);

  const renderContent = () => {
    if (likedDesigns === undefined) {
      return (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground text-sm">
              Loading your saved designs...
            </p>
          </div>
        </div>
      );
    }

    if (likedDesigns.length === 0) {
      return (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Heart className="mx-auto mb-4 size-12 text-muted-foreground/50" />
            <p className="text-lg text-muted-foreground">
              No saved designs yet
            </p>
            <p className="mt-2 text-muted-foreground text-sm">
              Start exploring and save designs you love
            </p>
            <Button asChild className="mt-4" size="sm">
              <Link as="/explore" href="/explore">
                Explore Designs
              </Link>
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {likedDesigns.map((design) => (
          <DesignCard design={design} key={design._id} />
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="border-border/40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="mx-auto max-w-7xl p-4 sm:p-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Heart className="size-6 text-red-500" />
                <h1 className="font-bold text-2xl tracking-tight sm:text-3xl">
                  Saved Designs
                </h1>
              </div>
              <p className="text-muted-foreground text-sm">
                Your collection of liked and saved designs
              </p>
            </div>
          </div>
        </div>

        {/* Designs Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 sm:p-6">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
