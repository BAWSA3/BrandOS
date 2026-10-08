// The Taste Profile deck (docs/specs/ONBOARDING-BUILDING-GAME.md, Foundation):
// mini brand samples rendered in code. Users keep or skip; the kept cards'
// attributes become their palette, type pairing and mood. Plain module.

export type FontKey =
  | 'grotesk' // Inter Tight
  | 'space' // Space Grotesk
  | 'serif' // Fraunces
  | 'didone' // DM Serif Display
  | 'instrument' // Instrument Serif
  | 'mono' // JetBrains Mono
  | 'heavy' // Archivo Black
  | 'syne'; // Syne

export type Layout = 'poster' | 'editorial' | 'grid' | 'minimal' | 'terminal';

export interface BrandCard {
  id: string;
  /** bg, ink, accent, plus up to two support colours */
  palette: [string, string, string, ...string[]];
  display: FontKey;
  body: FontKey;
  headline: string;
  sub: string;
  layout: Layout;
  tone: string; // one-word voice, shown small on the card
  tags: string[]; // scoring attributes: light/dark, serif/sans/mono, bold/quiet, warm/cool, playful/serious, ...
  /** archetypes this card fits best (deck weighting) */
  fits: string[];
}

export const BRAND_CARDS: BrandCard[] = [
  {
    id: 'ship-log',
    palette: ['#0B0F14', '#E6F1FF', '#00FF88', '#1B2633'],
    display: 'mono', body: 'mono', layout: 'terminal',
    headline: 'Shipped v0.3 today.', sub: 'Build log · day 41', tone: 'Matter-of-fact',
    tags: ['dark', 'mono', 'technical', 'cool', 'serious'], fits: ['BUILD.EXE', 'NULL'],
  },
  {
    id: 'workbench',
    palette: ['#F2EFE8', '#1A1A1A', '#FF5A1F', '#D9D3C7'],
    display: 'heavy', body: 'grotesk', layout: 'poster',
    headline: 'MAKE THE THING.', sub: 'Then make it better.', tone: 'Direct',
    tags: ['light', 'sans', 'bold', 'warm', 'energetic'], fits: ['BUILD.EXE', 'ENTROPY'],
  },
  {
    id: 'field-notes',
    palette: ['#FAF7F0', '#2B2621', '#7A5C3E', '#E8E0D2'],
    display: 'serif', body: 'serif', layout: 'editorial',
    headline: 'What I learned reading 200 papers', sub: 'Essay · 12 min read', tone: 'Thoughtful',
    tags: ['light', 'serif', 'quiet', 'warm', 'serious'], fits: ['SOURCE', 'FORESIGHT'],
  },
  {
    id: 'reference',
    palette: ['#FFFFFF', '#111111', '#0047FF', '#EDEDED'],
    display: 'grotesk', body: 'grotesk', layout: 'grid',
    headline: 'The complete guide', sub: '01 Basics  02 Systems  03 Scale', tone: 'Clear',
    tags: ['light', 'sans', 'quiet', 'cool', 'serious'], fits: ['SOURCE', 'NULL'],
  },
  {
    id: 'signal',
    palette: ['#0A0A12', '#F5F3FF', '#8B5CF6', '#1E1B2E'],
    display: 'instrument', body: 'grotesk', layout: 'editorial',
    headline: 'Where this is all going.', sub: 'A thesis, in three parts', tone: 'Visionary',
    tags: ['dark', 'serif', 'quiet', 'cool', 'serious'], fits: ['FORESIGHT', 'SOURCE'],
  },
  {
    id: 'forecast',
    palette: ['#E9EEF2', '#0F1B26', '#00A3A3', '#C9D6DF'],
    display: 'space', body: 'space', layout: 'minimal',
    headline: '2027 will reward the patient.', sub: 'Notes on what’s next', tone: 'Calm',
    tags: ['light', 'sans', 'quiet', 'cool', 'serious'], fits: ['FORESIGHT', 'ARC'],
  },
  {
    id: 'party-line',
    palette: ['#FFE94D', '#121212', '#FF3DA5', '#FFFFFF'],
    display: 'heavy', body: 'space', layout: 'poster',
    headline: 'WHO’S IN?', sub: 'Spaces tonight · 9pm', tone: 'Playful',
    tags: ['light', 'sans', 'bold', 'warm', 'playful'], fits: ['FREQ', 'RELAY'],
  },
  {
    id: 'mixtape',
    palette: ['#1A0F2E', '#FFF4E6', '#FF7A59', '#3A2560'],
    display: 'syne', body: 'grotesk', layout: 'poster',
    headline: 'Vibes only this week', sub: 'Thread: 10 things I loved', tone: 'Warm',
    tags: ['dark', 'sans', 'bold', 'warm', 'playful'], fits: ['FREQ', 'ENTROPY'],
  },
  {
    id: 'intro',
    palette: ['#F7F4EF', '#1D1D1F', '#0A84FF', '#E3DED6'],
    display: 'grotesk', body: 'grotesk', layout: 'minimal',
    headline: 'You two should meet.', sub: 'Intros, every Friday', tone: 'Friendly',
    tags: ['light', 'sans', 'quiet', 'warm', 'playful'], fits: ['RELAY', 'FREQ'],
  },
  {
    id: 'roundup',
    palette: ['#FFFFFF', '#0E0E0E', '#16A34A', '#F0F0F0'],
    display: 'space', body: 'grotesk', layout: 'grid',
    headline: 'This week in builders', sub: '12 people worth following', tone: 'Generous',
    tags: ['light', 'sans', 'quiet', 'cool', 'playful'], fits: ['RELAY', 'SOURCE'],
  },
  {
    id: 'glow-up',
    palette: ['#FFF1EA', '#2A1A12', '#FF6B35', '#FFD6C2'],
    display: 'didone', body: 'grotesk', layout: 'editorial',
    headline: 'From 0 to 10K, honestly.', sub: 'Month 6 recap', tone: 'Candid',
    tags: ['light', 'serif', 'bold', 'warm', 'serious'], fits: ['ARC', 'FREQ'],
  },
  {
    id: 'climb',
    palette: ['#0F172A', '#F8FAFC', '#F59E0B', '#1E293B'],
    display: 'heavy', body: 'grotesk', layout: 'poster',
    headline: 'DAY 100.', sub: 'Still showing up.', tone: 'Determined',
    tags: ['dark', 'sans', 'bold', 'warm', 'serious'], fits: ['ARC', 'BUILD.EXE'],
  },
  {
    id: 'cult',
    palette: ['#000000', '#FFFFFF', '#FF0033', '#1A1A1A'],
    display: 'syne', body: 'mono', layout: 'poster',
    headline: 'not for everyone.', sub: 'drop 03 · members only', tone: 'Provocative',
    tags: ['dark', 'sans', 'bold', 'cool', 'playful'], fits: ['ENTROPY', 'NULL'],
  },
  {
    id: 'zine',
    palette: ['#E8FF3A', '#111111', '#3A3AFF', '#FFFFFF'],
    display: 'instrument', body: 'mono', layout: 'editorial',
    headline: 'Hot take: brands are dead', sub: 'Issue 7 · read at your own risk', tone: 'Contrarian',
    tags: ['light', 'serif', 'bold', 'cool', 'playful'], fits: ['ENTROPY', 'FORESIGHT'],
  },
  {
    id: 'anon',
    palette: ['#E7E7E4', '#0E0E0E', '#0E0E0E', '#CFCFCB'],
    display: 'mono', body: 'mono', layout: 'minimal',
    headline: 'ideas > identity', sub: '// posting from the void', tone: 'Dry',
    tags: ['light', 'mono', 'quiet', 'cool', 'serious'], fits: ['NULL', 'SOURCE'],
  },
  {
    id: 'blueprint',
    palette: ['#0047FF', '#FFFFFF', '#9DB8FF', '#0033B8'],
    display: 'grotesk', body: 'mono', layout: 'grid',
    headline: 'System, not vibes.', sub: 'Framework 02 / 05', tone: 'Precise',
    tags: ['dark', 'sans', 'bold', 'cool', 'serious'], fits: ['NULL', 'BUILD.EXE', 'FORESIGHT'],
  },
];

/** ~15 cards for an archetype: its best fits first, then a spread of the rest as wildcards. */
export function deckFor(archetype: string | null, size = 15): BrandCard[] {
  const a = archetype?.toUpperCase() ?? '';
  const fit = BRAND_CARDS.filter((c) => c.fits.includes(a));
  const rest = BRAND_CARDS.filter((c) => !c.fits.includes(a));
  return [...fit, ...rest].slice(0, size);
}
