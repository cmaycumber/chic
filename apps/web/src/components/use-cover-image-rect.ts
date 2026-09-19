"use client";

import { type RefObject, useEffect, useState } from "react";

export interface CoverLayout {
  containerHeight: number;
  containerWidth: number;
  height: number;
  left: number;
  top: number;
  width: number;
}

interface NaturalSize {
  height: number;
  width: number;
}

interface FocalPoint {
  x: number;
  y: number;
}

const EMPTY_LAYOUT: CoverLayout = {
  containerHeight: 0,
  containerWidth: 0,
  height: 0,
  left: 0,
  top: 0,
  width: 0,
};

/**
 * `object-cover` overflows the container on one axis, so normalized hotspot
 * coordinates only map to pixels once we know the full (possibly off-screen)
 * extent of the rendered photo. Mirrors `useImageRect`'s letterbox math for
 * `object-contain`, but with `max` instead of `min`, and accounts for a
 * non-centered `object-position` focal point.
 */
export function useCoverImageRect(
  containerRef: RefObject<HTMLElement | null>,
  natural: NaturalSize,
  focal: FocalPoint
): CoverLayout {
  const [layout, setLayout] = useState<CoverLayout>(EMPTY_LAYOUT);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      setLayout(EMPTY_LAYOUT);
      return;
    }

    const measure = () => {
      const bounds = node.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) {
        return;
      }
      const scale = Math.max(
        bounds.width / natural.width,
        bounds.height / natural.height
      );
      const width = natural.width * scale;
      const height = natural.height * scale;
      setLayout({
        containerHeight: bounds.height,
        containerWidth: bounds.width,
        height,
        left: (bounds.width - width) * focal.x,
        top: (bounds.height - height) * focal.y,
        width,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [containerRef, natural, focal]);

  return layout;
}
