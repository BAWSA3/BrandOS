"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

// =============================================================================
// CUSTOMIZATION - Change these to make it YOUR original design
// =============================================================================
const CONFIG = {
  // Base gradient colors (top to bottom)
  gradientTop: "#e8f4fc",      // Light sky blue
  gradientBottom: "#7eb4d8",   // Deeper blue
  
  // Blob colors - make these YOUR brand colors
  blobColors: [
    { color: "#f4a89a", x: "45%", y: "25%", size: 400 },  // Coral/salmon main
    { color: "#ffd4cc", x: "55%", y: "30%", size: 300 },  // Lighter peach accent
    { color: "#ff8a7a", x: "40%", y: "28%", size: 200 },  // Deeper coral center
  ],
  
  // Grain intensity (0 to 1)
  grainOpacity: 0.4,
  
  // Scroll parallax intensity
  parallaxStrength: 200,
};

// =============================================================================
// SVG Noise Filter - Creates the grain texture
// =============================================================================
function NoiseFilter() {
  return (
    <svg className="absolute w-0 h-0">
      <defs>
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
    </svg>
  );
}

// =============================================================================
// Organic Blob Component
// =============================================================================
interface BlobProps {
  color: string;
  x: string;
  y: string;
  size: number;
  scrollY: any;
  index: number;
}

function Blob({ color, x, y, size, scrollY, index }: BlobProps) {
  // Each blob moves at a different rate for depth
  const yOffset = useTransform(
    scrollY,
    [0, 1000],
    [0, CONFIG.parallaxStrength * (index + 1) * 0.3]
  );
  
  const scale = useTransform(
    scrollY,
    [0, 1000],
    [1, 1 + (index * 0.1)]
  );

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: "blur(60px)",
        y: yOffset,
        scale,
        transform: "translate(-50%, -50%)",
      }}
    />
  );
}

// =============================================================================
// Main Background Component
// =============================================================================
export default function MeshGradientBackground({
  children,
}: {
  children?: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  return (
    <div ref={containerRef} className="relative min-h-[300vh]">
      {/* Noise filter definition */}
      <NoiseFilter />
      
      {/* Fixed background container */}
      <div className="fixed inset-0 overflow-hidden">
        
        {/* Layer 1: Base gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${CONFIG.gradientTop} 0%, ${CONFIG.gradientBottom} 100%)`,
          }}
        />
        
        {/* Layer 2: Organic blobs with parallax */}
        <div className="absolute inset-0">
          {CONFIG.blobColors.map((blob, index) => (
            <Blob
              key={index}
              color={blob.color}
              x={blob.x}
              y={blob.y}
              size={blob.size}
              scrollY={scrollY}
              index={index}
            />
          ))}
        </div>
        
        {/* Layer 3: Soft glow overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 60% 40% at 50% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
          }}
        />
        
        {/* Layer 4: Grain texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            filter: "url(#grain)",
            opacity: CONFIG.grainOpacity,
            mixBlendMode: "overlay",
          }}
        />
        
      </div>
      
      {/* Scrollable content goes here */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// =============================================================================
// Alternative: Pure CSS Version (no Motion.dev dependency)
// Copy this if you want a simpler, non-animated version
// =============================================================================
export function StaticMeshBackground({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <NoiseFilter />
      
      <div className="fixed inset-0 overflow-hidden">
        {/* Base gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, #e8f4fc 0%, #7eb4d8 100%)`,
          }}
        />
        
        {/* Blob */}
        <div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            left: "50%",
            top: "25%",
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, #f4a89a 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
        />
        
        {/* Grain */}
        <div
          className="absolute inset-0"
          style={{
            filter: "url(#grain)",
            opacity: 0.4,
            mixBlendMode: "overlay",
          }}
        />
      </div>
      
      <div className="relative z-10">{children}</div>
    </div>
  );
}
