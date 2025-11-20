import { cn } from "@/lib/utils";

type Props = {
  size?: number; // px
  className?: string;
  variant?: "sparkle" | "cursor";
};

// Animation constants
const CURSOR_WIDTH_RATIO = 0.1;
const CURSOR_OPACITY = 0.9;

// Star shape constants
const STAR_SIZE_RATIO = 0.24;
const STAR_CORNER_RADIUS_RATIO = 0.02;
const STAR_OFFSET_RATIO = 0.12;
const HALO_RADIUS_RATIO = 0.45;

// Star animation constants
const STAR_OPACITY = 0.9;
const STAR_ROTATION_DEGREES = 45;

// Star position constants
const STAR_SCALE_LEFT = 1.0;
const STAR_SCALE_CENTER = 1.15;
const STAR_SCALE_RIGHT = 0.95;
const STAR_OFFSET_LEFT = 0.16;
const STAR_OFFSET_RIGHT = 0.16;
const STAR_DELAY_LEFT = 0;
const STAR_DELAY_CENTER = 150;
const STAR_DELAY_RIGHT = 300;

export function ChicTypingIndicator({
  size = 20,
  className,
  variant = "sparkle",
}: Props) {
  if (variant === "cursor") {
    return (
      <output
        aria-label="typing"
        className={cn("inline-block align-middle", className)}
        style={{
          width: size * CURSOR_WIDTH_RATIO,
          height: size,
          background: "currentColor",
          opacity: CURSOR_OPACITY,
          animation: "chic-blink 1.1s steps(1,end) infinite",
        }}
      />
    );
  }

  // Sparkle variant (three 4-point stars that twinkle)
  const s = size;
  const star = (delay: number, scale = 1, x = 0) => (
    <rect
      className="fill-current"
      height={s * STAR_SIZE_RATIO}
      key={delay}
      rx={s * STAR_CORNER_RADIUS_RATIO}
      style={{
        transformOrigin: "center center",
        animation: `chic-twinkle 1.4s ease-in-out ${delay}ms infinite`,
        opacity: STAR_OPACITY,
      }}
      transform={`rotate(${STAR_ROTATION_DEGREES} ${s / 2} ${s / 2}) translate(${x} 0) scale(${scale})`}
      width={s * STAR_SIZE_RATIO}
      x={s / 2 - s * STAR_OFFSET_RATIO}
      y={s / 2 - s * STAR_OFFSET_RATIO}
    />
  );

  return (
    <svg
      aria-label="typing"
      className={cn("inline-block align-middle text-foreground", className)}
      height={s}
      role="img"
      viewBox={`0 0 ${s} ${s}`}
      width={s}
    >
      {/* subtle halo - using brand Bone color */}
      <circle
        className="fill-[color:var(--chic-veil)] opacity-[0.06] dark:fill-[color:var(--chic-veil-dark)]"
        cx={s / 2}
        cy={s / 2}
        r={s * HALO_RADIUS_RATIO}
      />
      {star(STAR_DELAY_LEFT, STAR_SCALE_LEFT, -s * STAR_OFFSET_LEFT)}
      {star(STAR_DELAY_CENTER, STAR_SCALE_CENTER, 0)}
      {star(STAR_DELAY_RIGHT, STAR_SCALE_RIGHT, s * STAR_OFFSET_RIGHT)}
    </svg>
  );
}
