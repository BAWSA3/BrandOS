"use client";

import { useEffect, useRef, useState } from "react";
import { useBrandStore } from "@/lib/store";

interface StaticImage {
  id: number;
  src: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  parallaxStrength: number;
}

// Reference images - add more URLs here for variety
const REFERENCE_IMAGES = [
  "https://i.pinimg.com/1200x/00/d4/c0/00d4c0c7fbaf7903c57a8a36d675ff31.jpg",
  "https://i.pinimg.com/736x/79/9e/2e/799e2ee0f91b8390d916c6a6ea77c323.jpg",
  "https://i.pinimg.com/736x/c1/27/7f/c1277fbc6a74140a88c585415c30f16d.jpg",
];

// Predefined static positions for consistent layout
const IMAGE_POSITIONS = [
  { x: 5, y: 15, scale: 0.35, rotation: -8, parallaxStrength: 15 },
  { x: 75, y: 10, scale: 0.4, rotation: 5, parallaxStrength: 20 },
  { x: 60, y: 55, scale: 0.45, rotation: -3, parallaxStrength: 25 },
  { x: 10, y: 60, scale: 0.3, rotation: 6, parallaxStrength: 18 },
  { x: 80, y: 75, scale: 0.35, rotation: -5, parallaxStrength: 22 },
  { x: 35, y: 80, scale: 0.25, rotation: 4, parallaxStrength: 12 },
];

export default function PixelatedBackground() {
  const { theme } = useBrandStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [images, setImages] = useState<StaticImage[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  // Initialize static images with predefined positions
  useEffect(() => {
    const newImages: StaticImage[] = IMAGE_POSITIONS.map((pos, index) => ({
      id: index,
      src: REFERENCE_IMAGES[index % REFERENCE_IMAGES.length],
      x: pos.x,
      y: pos.y,
      scale: pos.scale,
      rotation: pos.rotation,
      opacity: 0.12 + (index % 3) * 0.05,
      parallaxStrength: pos.parallaxStrength,
    }));
    setImages(newImages);
  }, []);

  // Smooth mouse tracking for parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const isDark = theme === "dark";

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none z-0"
      style={{
        background: isDark
          ? "radial-gradient(ellipse at 30% 20%, rgba(15, 25, 45, 1) 0%, rgba(0, 0, 0, 1) 70%)"
          : "radial-gradient(ellipse at 70% 80%, rgba(245, 248, 255, 1) 0%, rgba(255, 255, 255, 1) 70%)",
      }}
    >
      {/* Static pixelated images with subtle parallax */}
      {images.map((img) => {
        // Calculate subtle parallax offset based on mouse position
        const parallaxX = (mousePos.x - 0.5) * img.parallaxStrength;
        const parallaxY = (mousePos.y - 0.5) * img.parallaxStrength;

        return (
          <div
            key={img.id}
            className="absolute transition-transform duration-700 ease-out"
            style={{
              left: `${img.x}%`,
              top: `${img.y}%`,
              transform: `
                translate(${parallaxX}px, ${parallaxY}px)
                rotate(${img.rotation}deg)
                scale(${img.scale})
              `,
              opacity: img.opacity,
              filter: isDark
                ? "grayscale(40%) contrast(1.1) brightness(0.7) saturate(0.8)"
                : "grayscale(30%) contrast(1.05) brightness(1.1) saturate(0.9)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt=""
              className="pixelated w-64 h-64 md:w-80 md:h-80 object-cover"
              style={{
                imageRendering: "pixelated",
                mixBlendMode: isDark ? "lighten" : "multiply",
              }}
              loading="lazy"
            />
            {/* Subtle scanline overlay on each image */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `repeating-linear-gradient(
                  0deg,
                  transparent 0px,
                  transparent 2px,
                  rgba(0,0,0,0.15) 2px,
                  rgba(0,0,0,0.15) 4px
                )`,
              }}
            />
          </div>
        );
      })}

      {/* Subtle blue gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? `
              radial-gradient(ellipse at 20% 30%, rgba(74, 144, 217, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, rgba(74, 144, 217, 0.05) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(168, 200, 232, 0.03) 0%, transparent 60%)
            `
            : `
              radial-gradient(ellipse at 20% 30%, rgba(74, 144, 217, 0.06) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, rgba(74, 144, 217, 0.04) 0%, transparent 50%)
            `,
        }}
      />

      {/* Scanline effect */}
      <div
        className="absolute inset-0"
        style={{
          background: "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.012) 2px, rgba(0,0,0,0.012) 4px)",
          opacity: isDark ? 0.6 : 0.4,
        }}
      />

      {/* Edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)"
            : "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.08) 100%)",
        }}
      />

      {/* Corner decorations - pixel squares */}
      <div className="absolute top-8 left-8 opacity-15">
        <div className="grid grid-cols-4 gap-1">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2"
              style={{
                background: i % 3 === 0 ? (isDark ? "#4a90d9" : "#1a1a1a") : "transparent",
              }}
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 right-8 opacity-15">
        <div className="grid grid-cols-4 gap-1">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2"
              style={{
                background: i % 2 === 0 ? (isDark ? "#4a90d9" : "#1a1a1a") : "transparent",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
