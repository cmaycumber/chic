"use client";

import { type RefObject, useEffect, useState } from "react";

export interface ImageRect {
  height: number;
  left: number;
  top: number;
  width: number;
}

export interface NaturalSize {
  height: number;
  width: number;
}

const EMPTY_RECT: ImageRect = { height: 0, left: 0, top: 0, width: 0 };
const CENTER_DIVISOR = 2;

/**
 * `object-contain` letterboxes the photo inside its container, so normalized
 * coordinates only map to pixels once we know where the photo actually is.
 * This measures that rect and keeps it in sync with container resizes.
 */
export function useImageRect(
  containerRef: RefObject<HTMLElement | null>,
  natural: NaturalSize | null
): ImageRect {
  const [rect, setRect] = useState<ImageRect>(EMPTY_RECT);

  useEffect(() => {
    const node = containerRef.current;
    const hasSize = natural && natural.width > 0 && natural.height > 0;
    if (!(node && hasSize)) {
      setRect(EMPTY_RECT);
      return;
    }

    const measure = () => {
      const bounds = node.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) {
        return;
      }
      const scale = Math.min(
        bounds.width / natural.width,
        bounds.height / natural.height
      );
      const width = natural.width * scale;
      const height = natural.height * scale;
      setRect({
        height,
        left: (bounds.width - width) / CENTER_DIVISOR,
        top: (bounds.height - height) / CENTER_DIVISOR,
        width,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [containerRef, natural]);

  return rect;
}
