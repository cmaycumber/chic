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

  const w = 1920;
  const h = 1080;

  // Ellipse positioning and sizing constants
  const ellipse1CxRatio = 0.72;
  const ellipse1CyRatio = 0.22;
  const ellipse2CxRatio = 0.3;
  const ellipse2CyRatio = 0.7;

  // Curve path positioning constants
  const curve1StartXratio = 0.1;
  const curve1StartYratio = 0.58;
  const curve1Cp1Xratio = 0.3;
  const curve1Cp1Yratio = 0.45;
  const curve1Cp2Xratio = 0.55;
  const curve1Cp2Yratio = 0.85;
  const curve1EndXratio = 0.9;
  const curve1EndYratio = 0.35;

  const curve2StartXratio = 0.15;
  const curve2StartYratio = 0.3;
  const curve2CpXratio = 0.45;
  const curve2CpYratio = 0.5;
  const curve2EndXratio = 0.85;
  const curve2EndYratio = 0.65;

  // Using CSS variables that adapt to light/dark mode
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">
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
          cx="${w * ellipse1CxRatio}" 
          cy="${h * ellipse1CyRatio}" 
          rx="420" 
          ry="260" 
          fill="oklch(0.92 0.02 15)"
        />
        <ellipse 
          cx="${w * ellipse2CxRatio}" 
          cy="${h * ellipse2CyRatio}" 
          rx="520" 
          ry="300" 
          fill="oklch(0.90 0.018 45)"
        />
      </g>
      
      <!-- Accent curve -->
      <path 
        d="M ${w * curve1StartXratio} ${h * curve1StartYratio} C ${w * curve1Cp1Xratio} ${h * curve1Cp1Yratio}, ${w * curve1Cp2Xratio} ${h * curve1Cp2Yratio}, ${w * curve1EndXratio} ${h * curve1EndYratio}" 
        stroke="oklch(0.70 0.08 65)" 
        stroke-width="3" 
        fill="none" 
        opacity="0.5"
      />
      
      <!-- Additional subtle curves -->
      <path 
        d="M ${w * curve2StartXratio} ${h * curve2StartYratio} Q ${w * curve2CpXratio} ${h * curve2CpYratio}, ${w * curve2EndXratio} ${h * curve2EndYratio}" 
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
