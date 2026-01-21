import React from "react";
import { interpolate, useCurrentFrame, random } from "remotion";
import { COLORS } from "../styles";

interface ParticlesProps {
  count?: number;
  speed?: number;
  seed?: string;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedMultiplier: number;
  opacity: number;
  delay: number;
}

export const Particles: React.FC<ParticlesProps> = ({
  count = 30,
  speed = 1,
  seed = "particles",
}) => {
  const frame = useCurrentFrame();

  // Generate particles once based on seed
  const particles: Particle[] = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      x: random(`${seed}-x-${i}`) * 100,
      y: random(`${seed}-y-${i}`) * 100,
      size: random(`${seed}-size-${i}`) * 3 + 1,
      speedMultiplier: random(`${seed}-speed-${i}`) * 0.5 + 0.5,
      opacity: random(`${seed}-opacity-${i}`) * 0.5 + 0.2,
      delay: random(`${seed}-delay-${i}`) * 100,
    }));
  }, [count, seed]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {particles.map((particle, i) => {
        const adjustedFrame = frame + particle.delay;
        const floatY = Math.sin((adjustedFrame * speed * particle.speedMultiplier) / 50) * 20;
        const floatX = Math.cos((adjustedFrame * speed * particle.speedMultiplier) / 70) * 10;

        const pulse = interpolate(
          Math.sin((adjustedFrame / 40) * Math.PI * 2),
          [-1, 1],
          [0.5, 1]
        );

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              borderRadius: "50%",
              backgroundColor: COLORS.primary,
              opacity: particle.opacity * pulse,
              transform: `translate(${floatX}px, ${floatY}px)`,
              boxShadow: `0 0 ${particle.size * 3}px ${COLORS.primary}`,
            }}
          />
        );
      })}
    </div>
  );
};
