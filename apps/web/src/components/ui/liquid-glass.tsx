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
  style?: React.CSSProperties;
  /**
   * light: over light backgrounds; dark: smoked glass over photos;
   * frost: bright translucent glass over photos (iOS style).
   */
  tone?: "light" | "dark" | "frost";
}

const PILL_RADIUS = 999;
const DEFAULT_DISPLACEMENT = 40;
const DEFAULT_BLUR = 0.08;

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
}: LiquidGlassProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "liquid-glass",
          tone === "dark" && "liquid-glass-dark",
          tone === "frost" && "liquid-glass-frost",
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
        className={cn("lg-root", tone !== "light" && "text-white")}
        cornerRadius={cornerRadius}
        displacementScale={displacementScale}
        elasticity={0}
        mode="standard"
        onClick={onClick}
        overLight={tone === "light"}
        padding="0px"
      >
        <div className={className}>{children}</div>
      </LiquidGlassLib>
    </div>
  );
}
