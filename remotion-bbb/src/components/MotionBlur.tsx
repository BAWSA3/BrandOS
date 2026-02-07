import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

interface MotionBlurProps {
  children: React.ReactNode;
  intensity?: number; // 0 to 1
  direction?: "horizontal" | "vertical" | "radial";
  isActive?: boolean;
}

export const MotionBlur: React.FC<MotionBlurProps> = ({
  children,
  intensity = 0.5,
  direction = "horizontal",
  isActive = true,
}) => {
  if (!isActive || intensity === 0) {
    return <>{children}</>;
  }

  const blurAmount = intensity * 15;

  const getBlurFilter = () => {
    switch (direction) {
      case "horizontal":
        return `blur(${blurAmount}px)`;
      case "vertical":
        return `blur(${blurAmount}px)`;
      case "radial":
        return `blur(${blurAmount * 0.7}px)`;
      default:
        return `blur(${blurAmount}px)`;
    }
  };

  return (
    <div
      style={{
        position: "relative",
        filter: getBlurFilter(),
      }}
    >
      {children}
    </div>
  );
};

interface TransitionBlurProps {
  children: React.ReactNode;
  startFrame: number;
  duration?: number;
  type?: "in" | "out" | "through";
}

export const TransitionBlur: React.FC<TransitionBlurProps> = ({
  children,
  startFrame,
  duration = 10,
  type = "through",
}) => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - startFrame;

  let blur: number;

  switch (type) {
    case "in":
      blur = interpolate(relativeFrame, [0, duration], [20, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      break;
    case "out":
      blur = interpolate(relativeFrame, [0, duration], [0, 20], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      break;
    case "through":
      blur = interpolate(
        relativeFrame,
        [0, duration / 2, duration],
        [0, 15, 0],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }
      );
      break;
    default:
      blur = 0;
  }

  return (
    <div style={{ filter: blur > 0 ? `blur(${blur}px)` : undefined }}>
      {children}
    </div>
  );
};

interface SpeedLinesProps {
  intensity?: number;
  direction?: "left" | "right" | "center";
  count?: number;
}

export const SpeedLines: React.FC<SpeedLinesProps> = ({
  intensity = 0.5,
  direction = "center",
  count = 20,
}) => {
  const frame = useCurrentFrame();

  const lines = Array.from({ length: count }).map((_, i) => {
    const y = (i / count) * 1080;
    const seed = i * 137.5;
    const length = 100 + Math.sin(seed) * 200;
    const speed = 10 + Math.cos(seed * 2) * 5;

    let x: number;
    switch (direction) {
      case "left":
        x = ((frame * speed) % 2200) - 200;
        break;
      case "right":
        x = 1920 - ((frame * speed) % 2200) + 200;
        break;
      default:
        x = 960 + (Math.sin(seed * 3) > 0 ? 1 : -1) * ((frame * speed) % 1100);
    }

    return { x, y, length, opacity: 0.1 + Math.sin(seed * 4) * 0.1 };
  });

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: line.x,
            top: line.y,
            width: line.length,
            height: 1,
            background: `linear-gradient(90deg, transparent, rgba(0, 212, 255, ${line.opacity * intensity}), transparent)`,
          }}
        />
      ))}
    </div>
  );
};
