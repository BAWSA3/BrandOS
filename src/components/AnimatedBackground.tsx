"use client";

import { useEffect, useState } from "react";

// International Klein Blue and brand colors
const KLEIN_BLUE = "#002FA7";
const ELECTRIC_BLUE = "#0047FF";
const DEEP_BLUE = "#001847";

interface Orb {
  id: number;
  size: "sm" | "md" | "lg" | "xl";
  x: number;
  y: number;
  delay: number;
}

interface AnimatedBackgroundProps {
  variant?: "default" | "hero" | "minimal";
  orbCount?: number;
}

export default function AnimatedBackground({
  variant = "default",
  orbCount = 3
}: AnimatedBackgroundProps) {
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Generate orb positions - spread across hero area
    const sizes: Array<"sm" | "md" | "lg" | "xl"> = ["lg", "xl", "md", "lg"];
    const generatedOrbs: Orb[] = [];

    // Position orbs strategically for visual impact
    const positions = [
      { x: 15, y: 25 },   // Top left
      { x: 50, y: 15 },   // Top center (main hero orb)
      { x: 80, y: 35 },   // Right side
      { x: 30, y: 60 },   // Bottom left area
    ];

    for (let i = 0; i < Math.min(orbCount, positions.length); i++) {
      generatedOrbs.push({
        id: i,
        size: sizes[i % sizes.length],
        x: positions[i].x + (Math.random() * 10 - 5),
        y: positions[i].y + (Math.random() * 10 - 5),
        delay: i * 1.5,
      });
    }

    setOrbs(generatedOrbs);
  }, [orbCount]);

  if (!mounted) return null;

  const orbSizes = {
    sm: { width: 250, height: 250 },
    md: { width: 400, height: 400 },
    lg: { width: 600, height: 600 },
    xl: { width: 800, height: 800 },
  };

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none z-0"
      style={{ background: 'transparent' }}
    >
      {/* Base gradient - inspired by design refs */}
      <div
        className="absolute inset-0"
        style={{
          background: variant === "hero"
            ? `radial-gradient(ellipse 120% 80% at 50% 20%, ${KLEIN_BLUE}40 0%, ${DEEP_BLUE}20 40%, transparent 70%)`
            : "transparent"
        }}
      />

      {/* Animated Klein Blue Orbs - with dark center effect */}
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="absolute"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            transform: "translate(-50%, -50%)",
            width: orbSizes[orb.size].width,
            height: orbSizes[orb.size].height,
          }}
        >
          {/* Outer glow - soft blue fade - SOFTENED */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle,
                ${ELECTRIC_BLUE}08 0%,
                ${ELECTRIC_BLUE}18 20%,
                ${KLEIN_BLUE}28 40%,
                ${KLEIN_BLUE}12 60%,
                transparent 80%)`,
              filter: `blur(${orb.size === "xl" ? 70 : orb.size === "lg" ? 60 : orb.size === "md" ? 50 : 40}px)`,
              animation: `orbPulse 6s ease-in-out infinite, orbDrift 25s ease-in-out infinite`,
              animationDelay: `${orb.delay}s, ${orb.delay}s`,
            }}
          />

          {/* Middle layer - Klein Blue intensity - SOFTENED */}
          <div
            className="absolute rounded-full"
            style={{
              left: "10%",
              top: "10%",
              width: "80%",
              height: "80%",
              background: `radial-gradient(circle,
                ${DEEP_BLUE} 0%,
                ${KLEIN_BLUE}50 25%,
                ${ELECTRIC_BLUE}30 50%,
                transparent 80%)`,
              filter: `blur(${orb.size === "xl" ? 50 : orb.size === "lg" ? 45 : 35}px)`,
              animation: `orbPulse 5s ease-in-out infinite`,
              animationDelay: `${orb.delay + 0.5}s`,
            }}
          />

          {/* Inner dark core - like the design refs - SOFTENED */}
          <div
            className="absolute rounded-full"
            style={{
              left: "25%",
              top: "25%",
              width: "50%",
              height: "50%",
              background: `radial-gradient(circle,
                ${DEEP_BLUE} 0%,
                ${KLEIN_BLUE}80 40%,
                ${ELECTRIC_BLUE}20 70%,
                transparent 100%)`,
              filter: `blur(${orb.size === "xl" ? 35 : orb.size === "lg" ? 30 : 20}px)`,
              animation: `orbPulse 4s ease-in-out infinite`,
              animationDelay: `${orb.delay + 1}s`,
            }}
          />
        </div>
      ))}

      {/* Subtle noise overlay for texture */}
      {variant !== "minimal" && (
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Vignette effect for hero */}
      {variant === "hero" && (
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(10, 10, 10, 0.4) 100%)"
          }}
        />
      )}
    </div>
  );
}

// Enhanced Orb component for custom positioning - Klein Blue style
export function BlueOrb({
  size = "md",
  className = "",
  style = {}
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  style?: React.CSSProperties;
}) {
  const sizeConfig = {
    sm: { width: 200, blur: 40, opacity: 0.4 },
    md: { width: 350, blur: 60, opacity: 0.5 },
    lg: { width: 550, blur: 80, opacity: 0.6 },
    xl: { width: 750, blur: 100, opacity: 0.7 },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{
        width: config.width,
        height: config.width,
        background: 'transparent',
        ...style
      }}
    >
      {/* Outer glow - SOFTENED */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle,
            ${ELECTRIC_BLUE}08 0%,
            ${ELECTRIC_BLUE}18 25%,
            ${KLEIN_BLUE}28 45%,
            ${KLEIN_BLUE}14 65%,
            transparent 85%)`,
          filter: `blur(${config.blur}px)`,
          animation: "orbPulse 6s ease-in-out infinite",
        }}
      />

      {/* Middle layer - SOFTENED */}
      <div
        className="absolute rounded-full"
        style={{
          left: "10%",
          top: "10%",
          width: "80%",
          height: "80%",
          background: `radial-gradient(circle,
            ${DEEP_BLUE} 0%,
            ${KLEIN_BLUE}80 30%,
            ${ELECTRIC_BLUE}25 60%,
            transparent 90%)`,
          filter: `blur(${config.blur * 0.6}px)`,
          animation: "orbPulse 5s ease-in-out infinite",
          animationDelay: "0.5s",
        }}
      />

      {/* Dark core - SOFTENED */}
      <div
        className="absolute rounded-full"
        style={{
          left: "25%",
          top: "25%",
          width: "50%",
          height: "50%",
          background: `radial-gradient(circle,
            ${DEEP_BLUE} 0%,
            ${KLEIN_BLUE}70 50%,
            ${ELECTRIC_BLUE}15 80%,
            transparent 100%)`,
          filter: `blur(${config.blur * 0.45}px)`,
          animation: "orbPulse 4s ease-in-out infinite",
          animationDelay: "1s",
        }}
      />
    </div>
  );
}

// New: Elongated orb like in design ref 2b9c0f362786dbeb6088202ddba74b21.jpg
export function ElongatedOrb({
  className = "",
  style = {}
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{
        width: 400,
        height: 700,
        background: 'transparent',
        ...style
      }}
    >
      {/* Outer glow - elongated - SOFTENED */}
      <div
        className="absolute inset-0"
        style={{
          borderRadius: '200px',
          background: `radial-gradient(ellipse 100% 100% at 50% 50%,
            ${ELECTRIC_BLUE}00 0%,
            ${ELECTRIC_BLUE}12 30%,
            ${KLEIN_BLUE}25 50%,
            ${KLEIN_BLUE}10 70%,
            transparent 90%)`,
          filter: 'blur(70px)',
          animation: "orbPulse 7s ease-in-out infinite",
        }}
      />

      {/* Dark center - SOFTENED */}
      <div
        className="absolute"
        style={{
          left: "20%",
          top: "15%",
          width: "60%",
          height: "70%",
          borderRadius: '150px',
          background: `radial-gradient(ellipse 100% 100% at 50% 50%,
            ${DEEP_BLUE} 0%,
            ${KLEIN_BLUE}50 40%,
            ${ELECTRIC_BLUE}20 70%,
            transparent 100%)`,
          filter: 'blur(50px)',
          animation: "orbPulse 5s ease-in-out infinite",
          animationDelay: "1s",
        }}
      />
    </div>
  );
}
