import React, { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { colors } from "../utils/colors";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  delay: number;
  angle: number;
}

interface ParticlesProps {
  count?: number;
  intensity?: number; // 0 to 1
  direction?: "up" | "radial" | "converge";
  startFrame?: number;
  originX?: number;
  originY?: number;
}

export const Particles: React.FC<ParticlesProps> = ({
  count = 30,
  intensity = 0.5,
  direction = "up",
  startFrame = 0,
  originX = 960,
  originY = 540,
}) => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - startFrame;

  // Generate particles deterministically
  const particles = useMemo((): Particle[] => {
    const result: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const seed = i * 137.5; // Golden angle for distribution
      result.push({
        id: i,
        x: (Math.sin(seed) * 0.5 + 0.5) * 1920,
        y: (Math.cos(seed * 2) * 0.5 + 0.5) * 1080,
        size: 2 + (Math.sin(seed * 3) * 0.5 + 0.5) * 4,
        speed: 0.5 + (Math.cos(seed * 4) * 0.5 + 0.5) * 2,
        opacity: 0.3 + (Math.sin(seed * 5) * 0.5 + 0.5) * 0.7,
        delay: (Math.cos(seed * 6) * 0.5 + 0.5) * 30,
        angle: Math.sin(seed * 7) * Math.PI * 2,
      });
    }
    return result;
  }, [count]);

  if (relativeFrame < 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {particles.map((particle) => {
        const particleFrame = relativeFrame - particle.delay;
        if (particleFrame < 0) return null;

        let x = particle.x;
        let y = particle.y;

        switch (direction) {
          case "up":
            y = particle.y - particleFrame * particle.speed * 3;
            x = particle.x + Math.sin(particleFrame * 0.1 + particle.angle) * 20;
            break;
          case "radial":
            const radialDistance = particleFrame * particle.speed * 2;
            x = originX + Math.cos(particle.angle) * radialDistance;
            y = originY + Math.sin(particle.angle) * radialDistance;
            break;
          case "converge":
            const convergeProgress = Math.min(particleFrame / 60, 1);
            x = interpolate(convergeProgress, [0, 1], [particle.x, originX]);
            y = interpolate(convergeProgress, [0, 1], [particle.y, originY]);
            break;
        }

        // Fade out as particle ages
        const age = particleFrame / 60;
        const fadeOpacity = interpolate(age, [0, 0.2, 0.8, 1], [0, 1, 1, 0], {
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={particle.id}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: particle.size,
              height: particle.size,
              borderRadius: "50%",
              backgroundColor: colors.cyan,
              opacity: particle.opacity * fadeOpacity * intensity,
              boxShadow: `0 0 ${particle.size * 2}px ${colors.cyan}`,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}
    </div>
  );
};

interface ParticleBurstProps {
  x: number;
  y: number;
  startFrame: number;
  count?: number;
  duration?: number;
}

export const ParticleBurst: React.FC<ParticleBurstProps> = ({
  x,
  y,
  startFrame,
  count = 20,
  duration = 30,
}) => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - startFrame;

  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      angle: (i / count) * Math.PI * 2,
      speed: 3 + Math.random() * 5,
      size: 2 + Math.random() * 3,
    }));
  }, [count]);

  if (relativeFrame < 0 || relativeFrame > duration) return null;

  const progress = relativeFrame / duration;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {particles.map((particle, i) => {
        const distance = particle.speed * relativeFrame;
        const px = x + Math.cos(particle.angle) * distance;
        const py = y + Math.sin(particle.angle) * distance;
        const opacity = interpolate(progress, [0, 0.3, 1], [1, 1, 0]);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px,
              top: py,
              width: particle.size,
              height: particle.size,
              borderRadius: "50%",
              backgroundColor: colors.cyanLight,
              opacity,
              boxShadow: `0 0 ${particle.size * 3}px ${colors.cyan}`,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}
    </div>
  );
};
