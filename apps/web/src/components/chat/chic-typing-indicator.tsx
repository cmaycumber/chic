import { cn } from "@/lib/utils";

type Props = {
  size?: number; // px
  className?: string;
  variant?: "sparkle" | "cursor";
};

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
          width: size * 0.1,
          height: size,
          background: "currentColor",
          opacity: 0.9,
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
      height={s * 0.24}
      key={delay}
      rx={s * 0.02}
      style={{
        transformOrigin: "center center",
        animation: `chic-twinkle 1.4s ease-in-out ${delay}ms infinite`,
        opacity: 0.9,
      }}
      transform={`rotate(45 ${s / 2} ${s / 2}) translate(${x} 0) scale(${scale})`}
      width={s * 0.24}
      x={s / 2 - s * 0.12}
      y={s / 2 - s * 0.12}
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
        r={s * 0.45}
      />
      {star(0, 1.0, -s * 0.16)}
      {star(150, 1.15, 0)}
      {star(300, 0.95, s * 0.16)}
    </svg>
  );
}
