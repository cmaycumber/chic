"use client";

import { useEffect, useState } from "react";

type TravertineBackgroundProps = {
  className?: string;
};

export function TravertineBackground({
  className = "",
}: TravertineBackgroundProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const W = 1920;
  const H = 1080;

  // Using CSS variables that adapt to light/dark mode
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:oklch(0.97 0.01 85);stop-opacity:1" />
          <stop offset="100%" style="stop-color:oklch(0.95 0.015 75);stop-opacity:1" />
        </linearGradient>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0"/>
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.05"/>
          </feComponentTransfer>
        </filter>
      </defs>
      
      <!-- Base -->
      <rect width="100%" height="100%" fill="url(#bg-gradient)"/>
      
      <!-- Soft shapes -->
      <g opacity="0.85">
        <ellipse 
          cx="${W * 0.72}" 
          cy="${H * 0.22}" 
          rx="420" 
          ry="260" 
          fill="oklch(0.92 0.02 15)"
        />
        <ellipse 
          cx="${W * 0.3}" 
          cy="${H * 0.7}" 
          rx="520" 
          ry="300" 
          fill="oklch(0.90 0.018 45)"
        />
      </g>
      
      <!-- Accent curve -->
      <path 
        d="M ${W * 0.1} ${H * 0.58} C ${W * 0.3} ${H * 0.45}, ${W * 0.55} ${H * 0.85}, ${W * 0.9} ${H * 0.35}" 
        stroke="oklch(0.70 0.08 65)" 
        stroke-width="3" 
        fill="none" 
        opacity="0.5"
      />
      
      <!-- Additional subtle curves -->
      <path 
        d="M ${W * 0.15} ${H * 0.3} Q ${W * 0.45} ${H * 0.5}, ${W * 0.85} ${H * 0.65}" 
        stroke="oklch(0.88 0.015 85)" 
        stroke-width="2" 
        fill="none" 
        opacity="0.4"
      />
      
      <!-- Texture grain -->
      <rect width="100%" height="100%" filter="url(#grain)" opacity="0.08"/>
    </svg>
  `;

  const base64Svg = Buffer.from(svgString).toString("base64");

  return (
    <div
      className={`-z-10 fixed inset-0 ${className}`}
      style={{
        backgroundImage: `url(data:image/svg+xml;base64,${base64Svg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}
