import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Sequence } from "remotion";
import { Figure, GlowEffect, Particles, SpeedLines } from "../components";
import { colors } from "../utils/colors";

/**
 * Scene 7: Quick cuts montage
 * Duration: 105 frames (0:14.5 - 0:18)
 * Visual: Quick flashes - figure working, shapes stacking, light multiplying
 * Animation: Rapid cuts (3-4 shots), motion blur between
 * Audio: Intensifying rhythm
 */

const QuickCut1: React.FC = () => {
  const frame = useCurrentFrame();
  const flash = interpolate(frame, [0, 3], [1.5, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.dark,
        transform: `scale(${flash})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 30% 50%, rgba(0, 212, 255, 0.25) 0%, ${colors.dark} 40%)`,
        }}
      />
      <GlowEffect intensity={0.6} size={1.5} x="30%" y="50%" />
      <Figure
        opacity={0.9}
        scale={1.1}
        glowIntensity="strong"
        variant="working"
      />
      <SpeedLines intensity={0.3} direction="right" count={15} />
    </AbsoluteFill>
  );
};

const QuickCut2: React.FC = () => {
  const frame = useCurrentFrame();

  // Brick wall forming rapidly
  const bricks = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      const delay = (row * 6 + col) * 1;
      bricks.push({
        x: 660 + col * 100 + (row % 2) * 50,
        y: 650 - row * 60,
        delay,
      });
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: colors.dark }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center 60%, rgba(0, 212, 255, 0.2) 0%, ${colors.dark} 50%)`,
        }}
      />
      <GlowEffect intensity={0.5} size={2} y="55%" />

      {bricks.map((brick, i) => {
        const brickFrame = frame - brick.delay;
        if (brickFrame < 0) return null;
        const opacity = Math.min(brickFrame / 3, 0.7);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: brick.x,
              top: brick.y,
              width: "90px",
              height: "50px",
              border: `2px solid ${colors.cyan}`,
              opacity,
              boxShadow: `0 0 10px ${colors.cyan}40`,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}

      <Particles count={25} intensity={0.5} direction="up" startFrame={0} />
    </AbsoluteFill>
  );
};

const QuickCut3: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 25], [1, 1.3], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.dark,
        transform: `scale(${zoom})`,
        transformOrigin: "center 40%",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center 40%, rgba(0, 212, 255, 0.3) 0%, ${colors.dark} 45%)`,
        }}
      />
      <GlowEffect intensity={0.7} size={2.5} y="40%" pulse pulseSpeed={0.15} />

      {/* Light rays */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const length = interpolate(frame, [0, 25], [100, 400]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "40%",
              width: `${length}px`,
              height: "3px",
              background: `linear-gradient(90deg, ${colors.cyan}80, transparent)`,
              transform: `rotate(${angle}rad)`,
              transformOrigin: "left center",
              opacity: 0.4,
            }}
          />
        );
      })}

      <Figure
        opacity={0.85}
        scale={0.9}
        glowIntensity="intense"
        variant="ascending"
      />
      <Particles count={40} intensity={0.6} direction="radial" startFrame={0} originY={430} />
    </AbsoluteFill>
  );
};

const QuickCut4: React.FC = () => {
  const frame = useCurrentFrame();

  // Everything multiplying - pure energy
  const pulseScale = interpolate(Math.sin(frame * 0.4), [-1, 1], [0.98, 1.02]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.dark,
        transform: `scale(${pulseScale})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, rgba(0, 212, 255, 0.35) 0%, ${colors.dark} 40%)`,
        }}
      />

      <GlowEffect intensity={0.8} size={3} pulse pulseSpeed={0.2} />

      {/* Multiple light layers */}
      {[1, 2, 3].map((layer) => (
        <div
          key={layer}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) scale(${0.5 + layer * 0.3})`,
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            border: `1px solid ${colors.cyan}`,
            opacity: 0.3 / layer,
            animation: `pulse ${1 + layer * 0.5}s ease-in-out infinite`,
          }}
        />
      ))}

      <Particles count={50} intensity={0.7} direction="radial" startFrame={0} />
      <SpeedLines intensity={0.4} direction="center" count={25} />
    </AbsoluteFill>
  );
};

export const Scene7Build4: React.FC = () => {
  // 105 frames total, split into 4 quick cuts
  // ~26 frames each
  return (
    <AbsoluteFill style={{ backgroundColor: colors.dark }}>
      <Sequence from={0} durationInFrames={26}>
        <QuickCut1 />
      </Sequence>
      <Sequence from={26} durationInFrames={26}>
        <QuickCut2 />
      </Sequence>
      <Sequence from={52} durationInFrames={26}>
        <QuickCut3 />
      </Sequence>
      <Sequence from={78} durationInFrames={27}>
        <QuickCut4 />
      </Sequence>
    </AbsoluteFill>
  );
};
