"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  animate,
} from "motion/react";

// =============================================================================
// COLOR PALETTE - Extracted from reference image
// =============================================================================
const COLORS = {
  // Base gradient (top to bottom)
  gradientTop: "#f0f4f8",      // Very light blue-gray
  gradientMiddle: "#d4e5f7",   // Soft sky blue
  gradientBottom: "#8bb8d9",   // Medium blue
  
  // Blob colors (coral/salmon tones)
  blobPrimary: "#e8a598",      // Main coral
  blobSecondary: "#f4c4ba",    // Light peach
  blobAccent: "#d88a7a",       // Deeper salmon
  blobHighlight: "#ffddd5",    // Soft pink highlight
  
  // Ambient glow
  glowColor: "rgba(255, 245, 240, 0.6)",
};

// =============================================================================
// CONFIGURATION
// =============================================================================
const CONFIG = {
  // Grain settings
  grain: {
    opacity: 0.35,
    size: 100,        // Smaller = finer grain
    speed: 0.5,       // Animation speed
    animated: true,   // Set false for static grain (better performance)
  },
  
  // Blob morphing settings
  blobs: {
    morphSpeed: 8,      // Seconds per morph cycle
    floatSpeed: 12,     // Seconds per float cycle
    mouseInfluence: 30, // How much mouse affects blobs
  },
  
  // Parallax
  parallax: {
    strength: 150,
    smoothing: 0.1,
  },
};

// =============================================================================
// ANIMATED GRAIN TEXTURE - Canvas-based for authentic film grain
// =============================================================================
function AnimatedGrain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth / 2; // Lower res for performance
      canvas.height = window.innerHeight / 2;
    };
    resize();
    window.addEventListener("resize", resize);

    // Generate grain
    let frame = 0;
    const generateGrain = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 255;
        data[i] = noise;     // R
        data[i + 1] = noise; // G
        data[i + 2] = noise; // B
        data[i + 3] = 25;    // A (subtle)
      }

      ctx.putImageData(imageData, 0, 0);

      if (CONFIG.grain.animated) {
        frame++;
        if (frame % 2 === 0) { // Throttle to ~30fps
          animationRef.current = requestAnimationFrame(generateGrain);
        } else {
          animationRef.current = requestAnimationFrame(generateGrain);
        }
      }
    };

    generateGrain();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        opacity: CONFIG.grain.opacity,
        mixBlendMode: "overlay",
        imageRendering: "pixelated",
      }}
    />
  );
}

// =============================================================================
// SVG GRAIN FILTER - Alternative, lighter weight
// =============================================================================
function SVGGrainFilter() {
  return (
    <svg className="absolute w-0 h-0" aria-hidden="true">
      <defs>
        {/* Fine grain filter */}
        <filter id="fine-grain" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="4"
            seed="15"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix
            type="saturate"
            values="0"
            in="noise"
            result="mono"
          />
          <feComponentTransfer in="mono" result="grain">
            <feFuncA type="linear" slope="0.4" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" in2="grain" mode="overlay" />
        </filter>

        {/* Gooey filter for blob morphing */}
        <filter id="gooey">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
            result="gooey"
          />
          <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}

// =============================================================================
// STATIC GRAIN OVERLAY - Performant alternative using CSS
// =============================================================================
function StaticGrainOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        opacity: CONFIG.grain.opacity,
        mixBlendMode: "overlay",
      }}
    />
  );
}

// =============================================================================
// MORPHING BLOB - Uses SVG path morphing
// =============================================================================
interface MorphingBlobProps {
  color: string;
  size: number;
  initialX: string;
  initialY: string;
  mouseX: any;
  mouseY: any;
  scrollY: any;
  index: number;
}

function MorphingBlob({
  color,
  size,
  initialX,
  initialY,
  mouseX,
  mouseY,
  scrollY,
  index,
}: MorphingBlobProps) {
  const pathRef = useRef<SVGPathElement>(null);
  
  // Blob shape variations for morphing
  const blobPaths = [
    "M44.5,-76.2C57.1,-69.5,66.5,-55.9,73.2,-41.3C79.9,-26.7,83.8,-11.1,82.9,4.1C82,19.3,76.2,34.2,66.7,46.1C57.2,58,43.9,66.9,29.4,72.9C14.9,78.9,-0.8,82,-16.7,80.1C-32.6,78.2,-48.6,71.3,-60.4,60C-72.2,48.7,-79.7,33,-82.3,16.5C-84.9,0,-82.6,-17.3,-75.6,-32.1C-68.6,-46.9,-56.9,-59.2,-43.3,-65.5C-29.7,-71.8,-14.8,-72.1,0.8,-73.4C16.5,-74.7,31.9,-82.9,44.5,-76.2Z",
    "M38.9,-67.1C50.4,-60.3,59.8,-49.5,66.8,-37C73.8,-24.5,78.4,-10.3,78.1,3.9C77.8,18.1,72.6,32.2,63.9,43.8C55.2,55.4,43,64.5,29.4,70.3C15.8,76.1,0.8,78.6,-14.4,77.1C-29.6,75.6,-45,70.1,-57.3,60.4C-69.6,50.7,-78.8,36.8,-82.6,21.5C-86.4,6.2,-84.8,-10.5,-78.5,-25.1C-72.2,-39.7,-61.2,-52.2,-48,-60.1C-34.8,-68,-17.4,-71.3,-1.3,-69.2C14.8,-67.1,27.4,-73.9,38.9,-67.1Z",
    "M41.3,-71C53.5,-64.4,63.4,-53.3,70.9,-40.6C78.4,-27.9,83.5,-13.9,83.4,-0.1C83.3,13.8,78,27.5,70.1,39.5C62.2,51.5,51.6,61.7,39.2,68.6C26.8,75.5,12.6,79.1,-1.5,81.6C-15.6,84.1,-29.6,85.5,-42.3,80.1C-55,74.7,-66.4,62.5,-74.1,48.4C-81.8,34.3,-85.8,18.4,-84.9,2.9C-84,-12.6,-78.2,-27.8,-69.3,-40.6C-60.4,-53.4,-48.4,-63.8,-35.2,-69.8C-22,-75.8,-7.6,-77.4,4,-82.2C15.6,-87,29.1,-77.6,41.3,-71Z",
    "M47.7,-79.9C61.4,-73.1,71.9,-59.5,78.5,-44.5C85.1,-29.5,87.8,-13.1,85.8,2.4C83.8,17.9,77.1,32.5,67.5,44.9C57.9,57.3,45.4,67.5,31.3,73.8C17.2,80.1,1.5,82.5,-14.2,80.6C-29.9,78.7,-45.6,72.5,-58.1,62.3C-70.6,52.1,-79.9,37.9,-83.5,22.4C-87.1,6.9,-85,-9.9,-78.6,-24.6C-72.2,-39.3,-61.5,-51.9,-48.5,-59.1C-35.5,-66.3,-20.2,-68.1,-4.4,-62.2C11.4,-56.3,34,-86.7,47.7,-79.9Z",
  ];

  // Animate path morphing
  useEffect(() => {
    if (!pathRef.current) return;
    
    let currentIndex = 0;
    
    const morphToNext = () => {
      currentIndex = (currentIndex + 1) % blobPaths.length;
      
      animate(pathRef.current, 
        { d: blobPaths[currentIndex] },
        { 
          duration: CONFIG.blobs.morphSpeed,
          ease: "easeInOut",
        }
      );
    };

    const interval = setInterval(morphToNext, CONFIG.blobs.morphSpeed * 1000);
    return () => clearInterval(interval);
  }, []);

  // Mouse influence
  const mouseInfluenceX = useTransform(
    mouseX,
    [0, typeof window !== "undefined" ? window.innerWidth : 1000],
    [-CONFIG.blobs.mouseInfluence, CONFIG.blobs.mouseInfluence]
  );
  const mouseInfluenceY = useTransform(
    mouseY,
    [0, typeof window !== "undefined" ? window.innerHeight : 1000],
    [-CONFIG.blobs.mouseInfluence, CONFIG.blobs.mouseInfluence]
  );

  // Smooth spring physics
  const springX = useSpring(mouseInfluenceX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseInfluenceY, { stiffness: 50, damping: 20 });

  // Scroll parallax
  const scrollOffset = useTransform(
    scrollY,
    [0, 2000],
    [0, CONFIG.parallax.strength * (index + 1) * 0.4]
  );

  return (
    <motion.div
      className="absolute"
      style={{
        left: initialX,
        top: initialY,
        width: size,
        height: size,
        x: springX,
        y: scrollOffset,
        filter: "blur(40px)",
      }}
      animate={{
        y: [0, -20, 0, 20, 0],
        x: [0, 15, 0, -15, 0],
        rotate: [0, 5, 0, -5, 0],
      }}
      transition={{
        duration: CONFIG.blobs.floatSpeed + index * 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <svg
        viewBox="-100 -100 200 200"
        className="w-full h-full"
        style={{ overflow: "visible" }}
      >
        <motion.path
          ref={pathRef}
          d={blobPaths[index % blobPaths.length]}
          fill={color}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: index * 0.2 }}
        />
      </svg>
    </motion.div>
  );
}

// =============================================================================
// RADIAL GLOW BLOB - Simpler, performance-friendly blob
// =============================================================================
interface GlowBlobProps {
  color: string;
  size: number;
  x: string;
  y: string;
  mouseX: any;
  mouseY: any;
  scrollY: any;
  index: number;
  blur?: number;
}

function GlowBlob({ 
  color, 
  size, 
  x, 
  y, 
  mouseX, 
  mouseY, 
  scrollY, 
  index,
  blur = 60 
}: GlowBlobProps) {
  // Mouse influence with spring physics
  const mouseInfluenceX = useTransform(
    mouseX,
    [0, typeof window !== "undefined" ? window.innerWidth : 1000],
    [-20 * (index + 1), 20 * (index + 1)]
  );
  const mouseInfluenceY = useTransform(
    mouseY,
    [0, typeof window !== "undefined" ? window.innerHeight : 1000],
    [-20 * (index + 1), 20 * (index + 1)]
  );

  const springX = useSpring(mouseInfluenceX, { stiffness: 30, damping: 30 });
  const springY = useSpring(mouseInfluenceY, { stiffness: 30, damping: 30 });

  // Scroll parallax
  const scrollOffset = useTransform(
    scrollY,
    [0, 2000],
    [0, CONFIG.parallax.strength * (index + 0.5)]
  );

  // Scale on scroll
  const scrollScale = useTransform(
    scrollY,
    [0, 1500],
    [1, 1.2 + index * 0.1]
  );

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        x: springX,
        y: scrollOffset,
        scale: scrollScale,
        transform: "translate(-50%, -50%)",
      }}
      animate={{
        scale: [1, 1.1, 1, 0.95, 1],
        x: [0, 10, 0, -10, 0],
        y: [0, -15, 0, 15, 0],
      }}
      transition={{
        duration: 10 + index * 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function AdvancedMeshBackground({
  children,
  useCanvasGrain = true, // Set false for better performance
}: {
  children?: React.ReactNode;
  useCanvasGrain?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  
  // Mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div ref={containerRef} className="relative min-h-[300vh]">
      {/* SVG Filters */}
      <SVGGrainFilter />

      {/* Fixed background */}
      <div className="fixed inset-0 overflow-hidden">
        
        {/* Layer 1: Base gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              180deg,
              ${COLORS.gradientTop} 0%,
              ${COLORS.gradientMiddle} 40%,
              ${COLORS.gradientBottom} 100%
            )`,
          }}
        />

        {/* Layer 2: Ambient glow behind blobs */}
        <motion.div
          className="absolute"
          style={{
            left: "50%",
            top: "20%",
            width: 600,
            height: 400,
            background: `radial-gradient(ellipse, ${COLORS.glowColor} 0%, transparent 70%)`,
            transform: "translate(-50%, -50%)",
            filter: "blur(40px)",
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.6, 0.8, 0.6],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Layer 3: Morphing SVG Blobs */}
        <div className="absolute inset-0" style={{ filter: "url(#gooey)" }}>
          <MorphingBlob
            color={COLORS.blobPrimary}
            size={350}
            initialX="45%"
            initialY="22%"
            mouseX={mouseX}
            mouseY={mouseY}
            scrollY={scrollY}
            index={0}
          />
          <MorphingBlob
            color={COLORS.blobSecondary}
            size={280}
            initialX="55%"
            initialY="28%"
            mouseX={mouseX}
            mouseY={mouseY}
            scrollY={scrollY}
            index={1}
          />
          <MorphingBlob
            color={COLORS.blobAccent}
            size={200}
            initialX="48%"
            initialY="25%"
            mouseX={mouseX}
            mouseY={mouseY}
            scrollY={scrollY}
            index={2}
          />
        </div>

        {/* Layer 4: Radial glow blobs (softer, layered) */}
        <GlowBlob
          color={COLORS.blobHighlight}
          size={500}
          x="50%"
          y="25%"
          mouseX={mouseX}
          mouseY={mouseY}
          scrollY={scrollY}
          index={0}
          blur={80}
        />
        <GlowBlob
          color={COLORS.blobPrimary}
          size={300}
          x="42%"
          y="30%"
          mouseX={mouseX}
          mouseY={mouseY}
          scrollY={scrollY}
          index={1}
          blur={50}
        />

        {/* Layer 5: Top highlight */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(
              ellipse 80% 50% at 50% 0%,
              rgba(255, 255, 255, 0.4) 0%,
              transparent 50%
            )`,
          }}
        />

        {/* Layer 6: Grain texture */}
        {useCanvasGrain ? <AnimatedGrain /> : <StaticGrainOverlay />}

        {/* Layer 7: Vignette (subtle) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(
              ellipse at center,
              transparent 50%,
              rgba(0, 0, 0, 0.05) 100%
            )`,
          }}
        />
      </div>

      {/* Scrollable content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// =============================================================================
// EXPORTS - Different configurations
// =============================================================================

// Performance-focused version (static grain, fewer blobs)
export function LiteMeshBackground({ children }: { children?: React.ReactNode }) {
  const { scrollY } = useScroll();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="relative min-h-[300vh]">
      <SVGGrainFilter />
      
      <div className="fixed inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${COLORS.gradientTop} 0%, ${COLORS.gradientMiddle} 40%, ${COLORS.gradientBottom} 100%)`,
          }}
        />
        
        <GlowBlob
          color={COLORS.blobPrimary}
          size={400}
          x="48%"
          y="25%"
          mouseX={mouseX}
          mouseY={mouseY}
          scrollY={scrollY}
          index={0}
          blur={70}
        />
        <GlowBlob
          color={COLORS.blobSecondary}
          size={300}
          x="55%"
          y="30%"
          mouseX={mouseX}
          mouseY={mouseY}
          scrollY={scrollY}
          index={1}
          blur={60}
        />
        
        <StaticGrainOverlay />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
