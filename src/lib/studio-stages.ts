// The onboarding building game's stages (docs/specs/ONBOARDING-BUILDING-GAME.md).
// Plain module: shared by the /studio server page and the client station view.

export type StageNumber = 0 | 1 | 2 | 3;

export interface StudioStep {
  stage: 1 | 2 | 3;
  name: string; // the floor it builds
  verb: string; // the brand step that unlocks it
  line: string;
}

export const STUDIO_STEPS: StudioStep[] = [
  { stage: 1, name: 'Foundation', verb: 'Find your taste', line: 'React to brand cards and add what inspires you.' },
  { stage: 2, name: 'Workstation', verb: 'Shape your brand', line: 'Turn your taste into your first Brand Kit.' },
  { stage: 3, name: 'Billboard', verb: 'Stay on brand', line: 'Connect X and set your first posting streak.' },
];

export const STAGE_HEADLINES: Record<StageNumber, string> = {
  0: 'Your station starts here.',
  1: 'The foundation is poured.',
  2: 'Your workstation is up.',
  3: 'Blueprint complete.',
};

/**
 * How much of the finished station art is built at each stage, as the top
 * edge of the revealed part (percent of the art's height, measured on the
 * 1194x1492 station renders: storefront awning ~60%, roof deck ~25%).
 */
export const REVEAL_TOP: Record<StageNumber, number> = { 0: 100, 1: 59.5, 2: 24.5, 3: 0 };

export function clampStage(n: number): StageNumber {
  return Math.max(0, Math.min(3, Math.round(n))) as StageNumber;
}
