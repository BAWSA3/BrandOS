import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { GridBackground } from "../components/GridBackground";
import { Particles } from "../components/Particles";
import { ScanLines } from "../components/ScanLines";
import { COLORS, FONTS } from "../styles";

const NUM_PARTICLES = 16;
const NUM_RINGS = 3;

export const ProcessingScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Text pulse
  const textOpacity = interpolate(
    Math.sin((frame / 15) * Math.PI * 2),
    [-1, 1],
    [0.5, 1]
  );

  // Main rotation
  const rotation = frame * 4;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 60,
      }}
    >
      {/* Grid background */}
      <GridBackground opacity={0.08} perspective={true} />

      {/* Particles */}
      <Particles count={35} seed="processing" speed={2} />

      {/* Central glow */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.accentGlowBright} 0%, transparent 50%)`,
          opacity: 0.5,
          filter: "blur(50px)",
        }}
      />

      {/* Circular loader with multiple rings */}
      <div
        style={{
          position: "relative",
          width: 200,
          height: 200,
        }}
      >
        {/* Multiple rotating rings */}
        {Array.from({ length: NUM_RINGS }).map((_, ringIndex) => {
          const ringRotation = rotation * (ringIndex % 2 === 0 ? 1 : -1) * (1 + ringIndex * 0.3);
          const ringSize = 200 - ringIndex * 30;
          const ringOpacity = 1 - ringIndex * 0.25;

          return (
            <div
              key={ringIndex}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: ringSize,
                height: ringSize,
                transform: `translate(-50%, -50%) rotate(${ringRotation}deg)`,
              }}
            >
              <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
                <defs>
                  <linearGradient id={`grad-${ringIndex}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={COLORS.primary} stopOpacity={ringOpacity} />
                    <stop offset="50%" stopColor="#00ffff" stopOpacity={ringOpacity * 0.8} />
                    <stop offset="100%" stopColor={COLORS.primary} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringSize / 2 - 2}
                  fill="none"
                  stroke={`url(#grad-${ringIndex})`}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={`${ringSize * 0.8} ${ringSize * 2}`}
                />
              </svg>
            </div>
          );
        })}

        {/* Orbiting particles */}
        {Array.from({ length: NUM_PARTICLES }).map((_, i) => {
          const angle = (i / NUM_PARTICLES) * Math.PI * 2 + (frame / 20);
          const radius = 100;
          const x = Math.cos(angle) * radius + 100;
          const y = Math.sin(angle) * radius + 100;
          const particleOpacity = interpolate(
            Math.sin(angle + frame / 15),
            [-1, 1],
            [0.3, 1]
          );
          const particleSize = interpolate(
            Math.sin(angle + frame / 10),
            [-1, 1],
            [3, 6]
          );

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: particleSize,
                height: particleSize,
                borderRadius: "50%",
                backgroundColor: i % 3 === 0 ? "#00ffff" : COLORS.primary,
                transform: "translate(-50%, -50%)",
                opacity: particleOpacity,
                boxShadow: `0 0 ${particleSize * 2}px ${i % 3 === 0 ? "#00ffff" : COLORS.primary}`,
              }}
            />
          );
        })}

        {/* Center dot */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: COLORS.primary,
            transform: "translate(-50%, -50%)",
            boxShadow: `0 0 20px ${COLORS.primary}, 0 0 40px ${COLORS.primary}`,
          }}
        />
      </div>

      {/* Processing text */}
      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: 22,
          color: COLORS.text,
          letterSpacing: "0.15em",
          opacity: textOpacity,
          textShadow: `0 0 20px ${COLORS.accentGlow}`,
          textTransform: "uppercase",
        }}
      >
        {">>> Analyzing Brand DNA..."}
      </div>

      {/* Data stream effect */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          fontFamily: FONTS.mono,
          fontSize: 12,
          color: COLORS.primary,
          opacity: 0.4,
          letterSpacing: "0.1em",
        }}
      >
        {Array.from({ length: 30 }).map((_, i) => (
          <span key={i} style={{ opacity: Math.random() > 0.5 ? 1 : 0.3 }}>
            {Math.random() > 0.5 ? "1" : "0"}
          </span>
        ))}
      </div>

      {/* Scan lines */}
      <ScanLines opacity={0.02} speed={4} />
    </AbsoluteFill>
  );
};
