/**
 * Timing configuration for 15-second Content Engine trailer
 * 450 frames @ 30fps
 */

export const CE_FPS = 30;
export const CE_DURATION = 15;
export const CE_TOTAL_FRAMES = CE_FPS * CE_DURATION; // 450

export const ceTiming = {
  // Scene 1: Hook text — "what if your content wrote itself"
  hook: {
    start: 0,
    duration: 75, // 2.5s
  },

  // Scene 2: "content engine_" title slam
  reveal: {
    start: 60,
    duration: 50, // ~1.7s
  },

  // Scene 3: Handle roulette + voice scan
  scan: {
    start: 105,
    duration: 90, // 3s — handles spin then voice scan
  },

  // Scene 4: Topic select + generation typing
  generate: {
    start: 195,
    duration: 90, // 3s
  },

  // Scene 5: Output card
  output: {
    start: 275,
    duration: 75, // 2.5s
  },

  // Scene 6: CTA + logo
  cta: {
    start: 345,
    duration: 105, // 3.5s to end
  },
} as const;

// Handles that flash during the roulette
export const HANDLE_ROULETTE = [
  'waleswoosh',
  'banditxbt',
  'andrewaskshow',
  'davidonchainx',
  'vohvohh',
  'bandosei',
  'cryptoleon',
  'waleswoosh',
  'andrewaskshow',
  'vohvohh',
  'davidonchainx',
  'cryptoleon',
  'bandosei',
  'banditxbt', // lands here
];

// Example post for banditxbt
export const EXAMPLE_POST = `the market doesn't care about your thesis.

it cares about your positioning.

i've watched accounts with 10x my following
blow up their port because they confused
conviction with stubbornness.

the play is simple:
— size small
— scale into winners
— cut losers fast
— never marry a bag

your PnL is your reputation.
protect it.`;

// Voice traits that appear during scan
export const VOICE_TRAITS = [
  'direct & confrontational',
  'trading-native vocabulary',
  'short punchy sentences',
  'contrarian framing',
];
