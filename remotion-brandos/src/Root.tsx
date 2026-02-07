import React from "react";
import { Composition } from "remotion";
import { Archetypes } from "./compositions/Archetypes";
import { TOTAL_FRAMES, FPS } from "./utils/timing";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Archetypes"
        component={Archetypes}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
