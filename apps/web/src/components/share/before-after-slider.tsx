"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import {
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type SyntheticEvent,
  useCallback,
  useRef,
  useState,
} from "react";

const MIN_POSITION = 0;
const MAX_POSITION = 100;
const INITIAL_POSITION = 50;
const KEY_STEP = 4;
const PAGE_STEP = 20;
/** Until the photo has loaded we do not know its shape; 4:3 is the common one. */
const DEFAULT_ASPECT = 4 / 3;

interface BeforeAfterSliderProps {
  afterUrl: string;
  beforeUrl: string;
  title: string;
}

function clampPosition(value: number): number {
  return Math.min(MAX_POSITION, Math.max(MIN_POSITION, value));
}

function stepForKey(key: string): number | null {
  if (key === "ArrowLeft" || key === "ArrowDown") {
    return -KEY_STEP;
  }
  if (key === "ArrowRight" || key === "ArrowUp") {
    return KEY_STEP;
  }
  if (key === "PageDown") {
    return -PAGE_STEP;
  }
  if (key === "PageUp") {
    return PAGE_STEP;
  }
  return null;
}

function Label({
  children,
  side,
}: {
  children: string;
  side: "left" | "right";
}) {
  return (
    <span
      className={
        side === "left"
          ? "liquid-glass liquid-glass-dark pointer-events-none absolute top-3 left-3 rounded-full px-2.5 py-1 font-sans text-[11px] text-white uppercase tracking-wider"
          : "liquid-glass liquid-glass-dark pointer-events-none absolute top-3 right-3 rounded-full px-2.5 py-1 font-sans text-[11px] text-white uppercase tracking-wider"
      }
    >
      {children}
    </span>
  );
}

/**
 * The room before and after, one on top of the other, revealed by dragging.
 * Horizontal drags move the divider while vertical ones still scroll the
 * page, so the slider never traps a thumb on a phone.
 */
export function BeforeAfterSlider({
  afterUrl,
  beforeUrl,
  title,
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const [position, setPosition] = useState(INITIAL_POSITION);
  const [aspect, setAspect] = useState(DEFAULT_ASPECT);

  const moveTo = useCallback((clientX: number) => {
    const node = containerRef.current;
    if (!node) {
      return;
    }
    const bounds = node.getBoundingClientRect();
    if (bounds.width === 0) {
      return;
    }
    setPosition(
      clampPosition(((clientX - bounds.left) / bounds.width) * MAX_POSITION)
    );
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    moveTo(event.clientX);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      moveTo(event.clientX);
    }
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step = stepForKey(event.key);
    if (step === null) {
      return;
    }
    event.preventDefault();
    setPosition((current) => clampPosition(current + step));
  };

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const { naturalHeight, naturalWidth } = event.currentTarget;
    if (naturalWidth > 0 && naturalHeight > 0) {
      setAspect(naturalWidth / naturalHeight);
    }
  };

  return (
    <div
      className="relative w-full touch-pan-y select-none overflow-hidden bg-ink sm:rounded-3xl"
      onPointerCancel={endDrag}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      ref={containerRef}
      style={{ aspectRatio: aspect }}
    >
      <Image
        alt={`${title}, after`}
        className="object-cover"
        draggable={false}
        fill
        onLoad={handleLoad}
        priority
        sizes="(max-width: 768px) 100vw, 768px"
        src={afterUrl}
      />

      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${MAX_POSITION - position}% 0 0)` }}
      >
        <Image
          alt={`${title}, before`}
          className="object-cover"
          draggable={false}
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          src={beforeUrl}
        />
      </div>

      <Label side="left">Before</Label>
      <Label side="right">After</Label>

      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-white/80"
        style={{ left: `${position}%` }}
      >
        <button
          aria-label="Reveal more of the before or after photo"
          aria-valuemax={MAX_POSITION}
          aria-valuemin={MIN_POSITION}
          aria-valuenow={Math.round(position)}
          className="liquid-glass liquid-glass-frost pointer-events-auto absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-lg"
          onKeyDown={handleKeyDown}
          role="slider"
          tabIndex={0}
          type="button"
        >
          <ChevronLeft className="size-4" />
          <ChevronRight className="-ml-1 size-4" />
        </button>
      </div>
    </div>
  );
}
