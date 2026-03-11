import React from "react";
import { Composition } from "remotion";
import { Archetypes } from "./compositions/Archetypes";
import { ContentEngine } from "./compositions/ContentEngine";
import { TOTAL_FRAMES, FPS } from "./utils/timing";
import { CE_TOTAL_FRAMES, CE_FPS } from "./utils/content-engine-timing";

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
      <Composition
        id="ContentEngine"
        component={ContentEngine}
        durationInFrames={CE_TOTAL_FRAMES}
        fps={CE_FPS}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
