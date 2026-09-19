"use client";

import LiquidGlassLib from "liquid-glass-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LiquidGlassProps {
  blurAmount?: number;
  children: React.ReactNode;
  /** Classes for the content box inside the glass (layout, padding, text). */
  className?: string;
  /** Border radius in px. Defaults to a full pill. */
  cornerRadius?: number;
  /** Refraction intensity. Lower for text-heavy surfaces. */
  displacementScale?: number;
  /** Classes for the outer host element (sizing and positioning in flow). */
  hostClassName?: string;
  onClick?: () => void;
  /**
   * Opt in to the refracting library surface (hero surfaces only). The
   * default is the single-layer CSS material, which stays crisp everywhere.
   */
  refract?: boolean;
  style?: React.CSSProperties;
  /**
   * light: over light backgrounds; dark: smoked glass over photos;
   * frost: bright translucent glass over photos (iOS style).
   */
  tone?: "light" | "dark" | "frost" | "panel";
}

const PILL_RADIUS = 999;
const DEFAULT_DISPLACEMENT = 40;
const DEFAULT_BLUR = 0.08;
/** Fixed mouse values switch off the library's per-surface mousemove tracking. */
const STATIC_MOUSE = { x: 0, y: 0 };

/**
 * Apple-style liquid glass surface that behaves like a normal block element.
 *
 * Renders the CSS material on the server and on first paint, then upgrades to
 * liquid-glass-react (real refraction in Chromium) once mounted. The library
 * expects to be absolutely centred, so `.lg-host` / `.lg-root` styles in
 * global.css neutralise its translate and pull its helper layers out of flow.
 * Safari and Firefox keep the CSS material because they cannot display the
 * SVG displacement filter.
 */
export function LiquidGlass({
  children,
  className,
  hostClassName,
  cornerRadius = PILL_RADIUS,
  tone = "light",
  displacementScale = DEFAULT_DISPLACEMENT,
  blurAmount = DEFAULT_BLUR,
  onClick,
  style,
  refract = false,
}: LiquidGlassProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!(mounted && refract)) {
    return (
      <div
        className={cn(
          "liquid-glass",
          tone === "dark" && "liquid-glass-dark",
          tone === "frost" && "liquid-glass-frost",
          tone === "panel" && "liquid-glass-panel",
          "overflow-hidden",
          hostClassName,
          className
        )}
        style={{ borderRadius: cornerRadius, ...style }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "lg-host relative w-full",
        tone === "frost" && "lg-frost",
        onClick && "glass-press cursor-pointer",
        hostClassName
      )}
      style={style}
    >
      <LiquidGlassLib
        aberrationIntensity={1.5}
        blurAmount={blurAmount}
        className={cn(
          "lg-root",
          tone === "dark" && "liquid-glass-dark",
          tone === "frost" && "liquid-glass-frost",
          tone === "panel" && "liquid-glass-panel",
          tone !== "light" && "text-white"
        )}
        cornerRadius={cornerRadius}
        displacementScale={displacementScale}
        elasticity={0}
        globalMousePos={STATIC_MOUSE}
        mode="standard"
        mouseOffset={STATIC_MOUSE}
        onClick={onClick}
        overLight={tone === "light"}
        padding="0px"
      >
        <div className={className}>{children}</div>
      </LiquidGlassLib>
    </div>
  );
}
