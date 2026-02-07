import { Composition } from "remotion";
import { BrickByBrick, KineticTypography, BentoDashboard, BrandOSShowcase } from "./compositions";
import { TOTAL_FRAMES, FPS } from "./utils/timing";
import "./styles/global.css";

// Kinetic typography timing
const KINETIC_FPS = 30;
const KINETIC_DURATION = 390; // ~13 seconds

// Bento Dashboard timing
const BENTO_FPS = 30;
const BENTO_DURATION = 660; // 22 seconds (with zoom sequences)

// BrandOS Showcase timing
const SHOWCASE_FPS = 30;
const SHOWCASE_DURATION = 1020; // 34 seconds (150 intro + 780 content + 90 outro)

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BrickByBrick"
        component={BrickByBrick}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="KineticTypography"
        component={KineticTypography}
        durationInFrames={KINETIC_DURATION}
        fps={KINETIC_FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="BentoDashboard"
        component={BentoDashboard}
        durationInFrames={BENTO_DURATION}
        fps={BENTO_FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="BrandOSShowcase"
        component={BrandOSShowcase}
        durationInFrames={SHOWCASE_DURATION}
        fps={SHOWCASE_FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
