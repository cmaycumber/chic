"use client";

import { ShoppingBag } from "lucide-react";
import { LiquidGlass } from "@/components/ui/liquid-glass";

const PILL_RADIUS = 999;
const PILL_DISPLACEMENT = 10;

/** Small frost pill explaining the shoppable hotspots on the home page. */
export function ShowcaseHint() {
  return (
    <LiquidGlass
      className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-white/85 text-xs"
      cornerRadius={PILL_RADIUS}
      displacementScale={PILL_DISPLACEMENT}
      hostClassName="w-fit"
      tone="frost"
    >
      <ShoppingBag className="size-3.5" />
      <span className="sm:hidden">Tap items to shop</span>
      <span className="hidden sm:inline">Tap any item to shop it</span>
    </LiquidGlass>
  );
}
