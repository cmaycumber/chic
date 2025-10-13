"use client";

import { Bookmark } from "lucide-react";

export default function SavedPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <Bookmark className="mb-4 size-16 text-muted-foreground" />
      <h1 className="font-bold text-2xl">Saved</h1>
      <p className="text-muted-foreground">Coming soon...</p>
    </div>
  );
}
