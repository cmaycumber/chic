"use client";

import Image from "next/image";
import {
  type SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  HomeShowcaseHotspot,
  type HotspotAnchorX,
  type HotspotAnchorY,
} from "@/components/home-showcase-hotspot";
import {
  type CoverLayout,
  useCoverImageRect,
} from "@/components/use-cover-image-rect";
import { SHOWCASE_DEMO_ORDER, SHOWCASE_HOTSPOTS } from "@/lib/showcase";

const IMAGE_SRC = "/images/showcase-living-room.jpg";
const NATURAL_SIZE = { height: 1266, width: 2400 };
const FOCAL_POINT = { x: 0.55, y: 0.6 };

const AUTO_ADVANCE_MS = 3500;
const RESUME_DELAY_MS = 6000;
const CARD_WIDTH_PX = 224;
const CARD_HEIGHT_ESTIMATE_PX = 150;
const EDGE_MARGIN_PX = 16;
const GAP_PX = 12;
/** Fraction of container height that's safe for a card's bottom edge; the
 * rest is reserved for the composer bar. */
const COMPOSER_SAFE_FRACTION = 0.8;

interface HotspotPlacement {
  anchorX: HotspotAnchorX;
  anchorY: HotspotAnchorY;
  isVisible: boolean;
  x: number;
  y: number;
}

/** Maps a hotspot's normalized coordinate onto the rendered (cover-fit)
 * photo, then decides which side the card should open toward. */
function placeHotspot(
  normalizedX: number,
  normalizedY: number,
  layout: CoverLayout
): HotspotPlacement {
  const x = layout.left + normalizedX * layout.width;
  const y = layout.top + normalizedY * layout.height;
  const composerSafeBottom = layout.containerHeight * COMPOSER_SAFE_FRACTION;
  // A dot sitting inside the composer's own footprint would fight it for
  // taps, so hotspots are hidden there rather than just flipping their card.
  const isVisible =
    x >= 0 && x <= layout.containerWidth && y >= 0 && y <= composerSafeBottom;

  const spaceRight = layout.containerWidth - x;
  const anchorX: HotspotAnchorX =
    spaceRight >= CARD_WIDTH_PX + EDGE_MARGIN_PX ? "left" : "right";

  const spaceBelow = composerSafeBottom - y;
  const anchorY: HotspotAnchorY =
    spaceBelow >= CARD_HEIGHT_ESTIMATE_PX + GAP_PX ? "below" : "above";

  return { anchorX, anchorY, isVisible, x, y };
}

function nextHotspotId(current: string | null): string {
  const order: readonly string[] = SHOWCASE_DEMO_ORDER;
  const currentIndex = current === null ? -1 : order.indexOf(current);
  return order[(currentIndex + 1) % order.length];
}

/**
 * Full-bleed hero photo for the home page: a real living room with tappable
 * glass hotspots over the furniture, plus a guided demo that cycles through
 * them on its own until someone starts exploring.
 */
export function HomeShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const layout = useCoverImageRect(containerRef, NATURAL_SIZE, FOCAL_POINT);

  const [openId, setOpenId] = useState<string | null>(null);
  const [guidePaused, setGuidePaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(query.matches);
    const handleChange = (event: MediaQueryListEvent) => {
      setReduceMotion(event.matches);
    };
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  const clearResumeTimeout = useCallback(() => {
    if (resumeTimeoutRef.current !== null) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }, []);

  const scheduleResume = useCallback(() => {
    clearResumeTimeout();
    resumeTimeoutRef.current = setTimeout(() => {
      setGuidePaused(false);
    }, RESUME_DELAY_MS);
  }, [clearResumeTimeout]);

  useEffect(() => clearResumeTimeout, [clearResumeTimeout]);

  // Guided demo: advance to the next hotspot on a steady cadence, but only
  // while nobody is actively hovering or focusing one.
  useEffect(() => {
    if (guidePaused) {
      return;
    }
    const interval = setInterval(() => {
      setOpenId((current) => nextHotspotId(current));
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(interval);
  }, [guidePaused]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && openId) {
        setOpenId(null);
        setGuidePaused(true);
        scheduleResume();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openId, scheduleResume]);

  const handleHotspotEnter = useCallback(
    (event: SyntheticEvent<HTMLButtonElement>) => {
      const id = event.currentTarget.dataset.hotspotId;
      if (!id) {
        return;
      }
      clearResumeTimeout();
      setGuidePaused(true);
      setOpenId(id);
    },
    [clearResumeTimeout]
  );

  const handleHotspotLeave = useCallback(() => {
    scheduleResume();
  }, [scheduleResume]);

  const handleHotspotToggle = useCallback(
    (event: SyntheticEvent<HTMLButtonElement>) => {
      const id = event.currentTarget.dataset.hotspotId;
      if (!id) {
        return;
      }
      clearResumeTimeout();
      setGuidePaused(true);
      setOpenId((current) => (current === id ? null : id));
      scheduleResume();
    },
    [clearResumeTimeout, scheduleResume]
  );

  return (
    <div className="absolute inset-0" ref={containerRef}>
      <Image
        alt="A warm living room with a grey modular sofa, reclaimed-wood coffee table, brass arc lamp, and rattan and leather accent chairs"
        className={`object-cover object-[55%_60%] ${reduceMotion ? "" : "showcase-ken-burns"}`}
        fill
        priority
        sizes="100vw"
        src={IMAGE_SRC}
      />

      <div className="pointer-events-none absolute inset-0">
        {layout.containerWidth === 0
          ? null
          : SHOWCASE_HOTSPOTS.flatMap((hotspot) => {
              const placement = placeHotspot(hotspot.x, hotspot.y, layout);
              if (!placement.isVisible) {
                return [];
              }
              return [
                <HomeShowcaseHotspot
                  anchorX={placement.anchorX}
                  anchorY={placement.anchorY}
                  hotspot={hotspot}
                  isOpen={openId === hotspot.id}
                  key={hotspot.id}
                  onEnter={handleHotspotEnter}
                  onLeave={handleHotspotLeave}
                  onToggle={handleHotspotToggle}
                  reduceMotion={reduceMotion}
                  x={placement.x}
                  y={placement.y}
                />,
              ];
            })}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-ink/45 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] bg-linear-to-t from-ink via-ink/70 to-transparent" />
    </div>
  );
}
