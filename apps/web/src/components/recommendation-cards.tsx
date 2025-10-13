"use client";

import {
  Compass,
  Image as ImageIcon,
  Lightbulb,
  MapPin,
  Palette,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const forYouCards = [
  {
    title: "Modern Minimalist",
    category: "Style",
    image: "bg-gradient-to-br from-slate-100 to-slate-300",
    icon: Palette,
  },
  {
    title: "Scandinavian Comfort",
    category: "Living Room",
    image: "bg-gradient-to-br from-amber-100 to-amber-300",
    icon: MapPin,
  },
  {
    title: "Industrial Chic",
    category: "Kitchen",
    image: "bg-gradient-to-br from-zinc-200 to-zinc-400",
    icon: Lightbulb,
  },
];

const getStartedCards = [
  {
    title: "Take our style quiz",
    description: "Discover your design personality",
    image: "bg-gradient-to-br from-cyan-100 to-cyan-300",
  },
  {
    title: "Create a design board",
    description: "Start planning your space",
    image: "bg-gradient-to-br from-blue-200 to-blue-400",
  },
  {
    title: "Designer tools",
    description: "Professional planning features",
    image: "bg-gradient-to-br from-amber-200 to-amber-400",
  },
];

const inspiredCards = [
  {
    title: "Bohemian Retreat: Textures, Colors, Comfort",
    location: "Bedroom Design",
    image: "bg-gradient-to-br from-rose-200 to-rose-400",
  },
  {
    title: "FREE | Industrial & Modern Fusion",
    location: "Loft Design",
    image: "bg-gradient-to-br from-slate-300 to-slate-500",
  },
  {
    title: "A Coastal Sanctuary",
    location: "Beach House",
    image: "bg-gradient-to-br from-sky-200 to-sky-400",
  },
];

export function RecommendationCards() {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-6">
      {/* Location Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-lg">For you in</h2>
          <div className="flex items-center gap-1">
            <MapPin className="size-4 text-primary" />
            <span className="font-semibold text-lg">Your Space</span>
          </div>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-sm hover:bg-accent"
          type="button"
        >
          <Compass className="size-4" />
          <span>Map</span>
        </button>
      </div>

      {/* For You Section */}
      <div className="grid grid-cols-3 gap-3">
        {forYouCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              className="group relative overflow-hidden border-0 shadow-md transition-all hover:scale-105 hover:shadow-xl"
              key={card.title}
            >
              <CardContent className="p-0">
                <div className={cn("h-32 w-full", card.image)} />
                <div className="p-3">
                  <h3 className="line-clamp-2 font-semibold text-sm">
                    {card.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-1 text-muted-foreground text-xs">
                    <Icon className="size-3" />
                    <span>{card.category}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Get Started Section */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Get started</h2>
        <div className="grid grid-cols-3 gap-3">
          {getStartedCards.map((card) => (
            <Card
              className="group relative overflow-hidden border-0 shadow-md transition-all hover:scale-105 hover:shadow-xl"
              key={card.title}
            >
              <CardContent className="p-0">
                <div
                  className={cn(
                    "flex h-32 w-full items-center justify-center",
                    card.image
                  )}
                >
                  <ImageIcon className="size-12 text-white/40" />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm">{card.title}</h3>
                  <p className="mt-0.5 text-muted-foreground text-xs">
                    {card.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Get Inspired Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Get inspired</h2>
          <button
            className="text-primary text-sm hover:underline"
            type="button"
          >
            See all
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {inspiredCards.map((card) => (
            <Card
              className="group relative overflow-hidden border-0 shadow-md transition-all hover:scale-105 hover:shadow-xl"
              key={card.title}
            >
              <CardContent className="p-0">
                <div className={cn("h-40 w-full", card.image)} />
                <div className="p-3">
                  <h3 className="line-clamp-2 font-semibold text-sm">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-muted-foreground text-xs">
                    {card.location}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Explore Button */}
      <button
        className="rounded-lg border bg-background px-4 py-3 font-medium text-sm hover:bg-accent"
        type="button"
      >
        Explore
      </button>
    </div>
  );
}
