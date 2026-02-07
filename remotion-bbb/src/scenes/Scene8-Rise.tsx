import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Sequence } from "remotion";
import { Figure, GlowEffect, Particles, SpeedLines } from "../components";
import { colors } from "../utils/colors";

/**
 * Scene 8-10: Rapid montage (The Rise)
 * Duration: 150 frames (0:18 - 0:23)
 * Visual: Fast montage - figure ascending, light trails everywhere, building complete
 * Animation: 1-1.5 sec per cut, dynamic camera moves, particle explosions
 * Audio: Crescendo building
 */

const RiseCut1: React.FC = () => {
  const frame = useCurrentFrame();

  // Figure ascending - camera follows
  const cameraY = interpolate(frame, [0, 50], [0, -100], {
    extrapolateRight: "clamp",
  });

  const figureY = interpolate(frame, [0, 50], [100, -50], {
    extrapolateRight: "clamp",
  });

  const glowIntensity = interpolate(frame, [0, 50], [0.5, 0.8], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.dark,
        transform: `translateY(${cameraY}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center 30%, rgba(0, 212, 255, 0.3) 0%, ${colors.dark} 50%)`,
        }}
      />

      <GlowEffect intensity={glowIntensity} size={2.5} y="35%" pulse pulseSpeed={0.12} />

      {/* Light trails going up */}
      {Array.from({ length: 12 }).map((_, i) => {
        const x = 300 + i * 120;
        const trailLength = interpolate(frame, [0, 50], [50, 300 + Math.random() * 200]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              bottom: 0,
              width: "2px",
              height: `${trailLength}px`,
              background: `linear-gradient(to top, transparent, ${colors.cyan}60, ${colors.cyanLight})`,
              opacity: 0.5,
            }}
          />
        );
      })}

      <div style={{ transform: `translateY(${figureY}px)` }}>
        <Figure
          opacity={0.9}
          scale={0.95}
          glowIntensity="strong"
          variant="ascending"
        />
      </div>

      <Particles count={35} intensity={0.6} direction="up" startFrame={0} />
      <SpeedLines intensity={0.3} count={20} />
    </AbsoluteFill>
  );
};

const RiseCut2: React.FC = () => {
  const frame = useCurrentFrame();

  // Light trails everywhere - energy explosion
  const rotation = frame * 3;
  const scale = interpolate(frame, [0, 50], [1, 1.2], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.dark,
        transform: `scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, rgba(0, 212, 255, 0.4) 0%, ${colors.dark} 45%)`,
        }}
      />

      {/* Spinning light rays */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        }}
      >
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i / 16) * 360;
          const length = 200 + Math.sin(i * 0.5) * 100;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: `${length}px`,
                height: "4px",
                background: `linear-gradient(90deg, ${colors.cyan}, transparent)`,
                transform: `rotate(${angle}deg)`,
                transformOrigin: "left center",
                opacity: 0.5,
              }}
            />
          );
        })}
      </div>

      <GlowEffect intensity={0.8} size={3} pulse pulseSpeed={0.15} />
      <Particles count={50} intensity={0.7} direction="radial" startFrame={0} />
    </AbsoluteFill>
  );
};

const RiseCut3: React.FC = () => {
  const frame = useCurrentFrame();

  // Building complete - structure revealed
  const structureOpacity = interpolate(frame, [0, 30], [0.5, 1], {
    extrapolateRight: "clamp",
  });

  // Completed structure - pyramid of bricks
  const brickRows = [
    [0, 1, 2, 3, 4, 5, 6],
    [0.5, 1.5, 2.5, 3.5, 4.5, 5.5],
    [1, 2, 3, 4, 5],
    [1.5, 2.5, 3.5, 4.5],
    [2, 3, 4],
    [2.5, 3.5],
    [3],
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: colors.dark }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center 55%, rgba(0, 212, 255, 0.35) 0%, ${colors.dark} 50%)`,
        }}
      />

      <GlowEffect intensity={0.7} size={2.5} y="50%" />

      {/* Completed brick structure */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          opacity: structureOpacity,
        }}
      >
        {brickRows.map((row, rowIndex) =>
          row.map((colIndex, i) => (
            <div
              key={`${rowIndex}-${i}`}
              style={{
                position: "absolute",
                left: colIndex * 70 - 210,
                top: 200 - rowIndex * 45,
                width: "60px",
                height: "35px",
                border: `2px solid ${colors.cyan}`,
                boxShadow: `0 0 15px ${colors.cyan}50, inset 0 0 8px ${colors.cyan}20`,
              }}
            />
          ))
        )}
      </div>

      <Figure
        opacity={0.85}
        scale={0.7}
        glowIntensity="strong"
        variant="ascending"
        translateY={150}
      />

      <Particles count={40} intensity={0.6} direction="up" startFrame={0} />
    </AbsoluteFill>
  );
};

export const Scene8Rise: React.FC = () => {
  // 150 frames total, split into 3 cuts of 50 frames each
  return (
    <AbsoluteFill style={{ backgroundColor: colors.dark }}>
      <Sequence from={0} durationInFrames={50}>
        <RiseCut1 />
      </Sequence>
      <Sequence from={50} durationInFrames={50}>
        <RiseCut2 />
      </Sequence>
      <Sequence from={100} durationInFrames={50}>
        <RiseCut3 />
      </Sequence>
    </AbsoluteFill>
  );
};
