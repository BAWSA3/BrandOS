"use client";

import { useEffect, useRef, useCallback } from "react";
import { useBrandStore } from "@/lib/store";

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  opacity: number;
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>(0);
  const { theme } = useBrandStore();

  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = [];
    const spacing = 50;
    const cols = Math.ceil(width / spacing) + 1;
    const rows = Math.ceil(height / spacing) + 1;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        particles.push({
          x: i * spacing,
          y: j * spacing,
          baseX: i * spacing,
          baseY: j * spacing,
          size: 1.5,
          opacity: 0.08 + Math.random() * 0.06,
        });
      }
    }
    return particles;
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const mouseRadius = 180;
    const mouseStrength = 40;
    const isDark = theme === "dark";
    const particleColor = isDark ? "255, 255, 255" : "0, 0, 0";

    particlesRef.current.forEach((particle) => {
      const dx = mouseRef.current.x - particle.baseX;
      const dy = mouseRef.current.y - particle.baseY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < mouseRadius) {
        const force = (mouseRadius - distance) / mouseRadius;
        const angle = Math.atan2(dy, dx);
        const pushX = Math.cos(angle) * force * mouseStrength;
        const pushY = Math.sin(angle) * force * mouseStrength;

        particle.x += (particle.baseX - pushX - particle.x) * 0.12;
        particle.y += (particle.baseY - pushY - particle.y) * 0.12;
        particle.opacity = 0.2 + force * 0.6;
        particle.size = 1.5 + force * 4;
      } else {
        particle.x += (particle.baseX - particle.x) * 0.06;
        particle.y += (particle.baseY - particle.y) * 0.06;
        particle.opacity += (0.08 + Math.random() * 0.04 - particle.opacity) * 0.02;
        particle.size += (1.5 - particle.size) * 0.06;
      }

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${particleColor}, ${particle.opacity})`;
      ctx.fill();
    });

    // Draw connections between close particles near mouse
    const connectionRadius = mouseRadius * 1.5;
    particlesRef.current.forEach((p1, i) => {
      const d1 = Math.sqrt(
        Math.pow(mouseRef.current.x - p1.x, 2) +
        Math.pow(mouseRef.current.y - p1.y, 2)
      );

      if (d1 < connectionRadius) {
        particlesRef.current.slice(i + 1).forEach((p2) => {
          const d2 = Math.sqrt(
            Math.pow(mouseRef.current.x - p2.x, 2) +
            Math.pow(mouseRef.current.y - p2.y, 2)
          );

          if (d2 < connectionRadius) {
            const dist = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
            if (dist < 70) {
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(${particleColor}, ${0.1 * (1 - dist / 70)})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        });
      }
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particlesRef.current = initParticles(canvas.width, canvas.height);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationRef.current);
    };
  }, [animate, initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: "transparent" }}
    />
  );
}
