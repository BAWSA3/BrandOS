import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import {
  Scene1Weight1,
  Scene2Weight2,
  Scene3Weight3,
  Scene4Build1,
  Scene5Build2,
  Scene6Build3,
  Scene7Build4,
  Scene8Rise,
  Scene11Arrival,
  Scene12Brand,
} from "../scenes";
import { scenes } from "../utils/timing";
import { colors } from "../utils/colors";

/**
 * Brick by Brick - Main Video Composition
 *
 * Total Duration: 840 frames (28 seconds @ 30fps)
 *
 * ACT 1: THE WEIGHT (0:00 - 0:08) - Slow, contemplative
 * ACT 2: THE BUILD (0:08 - 0:18) - Accelerating, momentum
 * ACT 3: THE RISE (0:18 - 0:28) - Fast, triumph, brand reveal
 */
export const BrickByBrick: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.dark }}>
      {/* ========== ACT 1: THE WEIGHT ========== */}

      {/* Scene 1: "Nobody taught you this." */}
      <Sequence from={scenes.scene1.start} durationInFrames={scenes.scene1.duration}>
        <Scene1Weight1 />
      </Sequence>

      {/* Scene 2: "How to keep going." */}
      <Sequence from={scenes.scene2.start} durationInFrames={scenes.scene2.duration}>
        <Scene2Weight2 />
      </Sequence>

      {/* Scene 3: "When it's just you." */}
      <Sequence from={scenes.scene3.start} durationInFrames={scenes.scene3.duration}>
        <Scene3Weight3 />
      </Sequence>

      {/* ========== ACT 2: THE BUILD ========== */}

      {/* Scene 4: "So you learn." */}
      <Sequence from={scenes.scene4.start} durationInFrames={scenes.scene4.duration}>
        <Scene4Build1 />
      </Sequence>

      {/* Scene 5: "One day." */}
      <Sequence from={scenes.scene5.start} durationInFrames={scenes.scene5.duration}>
        <Scene5Build2 />
      </Sequence>

      {/* Scene 6: "One brick." */}
      <Sequence from={scenes.scene6.start} durationInFrames={scenes.scene6.duration}>
        <Scene6Build3 />
      </Sequence>

      {/* Scene 7: Quick cuts montage */}
      <Sequence from={scenes.scene7.start} durationInFrames={scenes.scene7.duration}>
        <Scene7Build4 />
      </Sequence>

      {/* ========== ACT 3: THE RISE ========== */}

      {/* Scenes 8-10: Rapid montage */}
      <Sequence from={scenes.scene8.start} durationInFrames={scenes.scene8.duration}>
        <Scene8Rise />
      </Sequence>

      {/* Scene 11: "Until it's built." */}
      <Sequence from={scenes.scene11.start} durationInFrames={scenes.scene11.duration}>
        <Scene11Arrival />
      </Sequence>

      {/* Scene 12: Brand Reveal */}
      <Sequence from={scenes.scene12.start} durationInFrames={scenes.scene12.duration}>
        <Scene12Brand />
      </Sequence>
    </AbsoluteFill>
  );
};
