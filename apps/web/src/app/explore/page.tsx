"use client";

import { Compass } from "lucide-react";

export default function ExplorePage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <Compass className="mb-4 size-16 text-muted-foreground" />
      <h1 className="font-bold text-2xl">Explore</h1>
      <p className="text-muted-foreground">Coming soon...</p>
    </div>
  );
}
