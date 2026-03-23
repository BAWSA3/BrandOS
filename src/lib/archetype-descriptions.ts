/**
 * Central source of truth for all 8 BrandOS Creator Archetypes.
 * Import this anywhere you need archetype metadata — client-safe (no fs/Node deps).
 */

export interface ArchetypeInfo {
  name: string;
  tier: number;
  tierLabel: string;
  tagline: string;
  description: string;
  traits: string[];
  color: string;
  emoji: string;
  rarity: number; // percentage of creators
  evolutionPaths: string[];
  strengths: string[];
}

export const ARCHETYPE_DATA: Record<string, ArchetypeInfo> = {
  ARC: {
    name: 'ARC',
    tier: 1,
    tierLabel: 'ENTRY',
    tagline: 'Rising star. Growth story.',
    description:
      'You\'re the underdog the timeline is rooting for. Your brand is your journey — every milestone, every pivot, every honest moment of growth. People follow you because they want to watch you win.',
    traits: ['Resilient', 'Authentic', 'Journey-driven', 'Relatable'],
    color: '#10B981',
    emoji: '🐕',
    rarity: 22,
    evolutionPaths: ['ENTROPY', 'NULL', 'FREQ', 'RELAY', 'BUILD.EXE', 'SOURCE', 'FORESIGHT'],
    strengths: ['Personal storytelling', 'Milestone content', 'Vulnerability that connects'],
  },
  ENTROPY: {
    name: 'ENTROPY',
    tier: 2,
    tierLabel: 'RISING',
    tagline: 'Risk-taker. Cult builder.',
    description:
      'You thrive in chaos. While others play it safe, you make bold calls, rally communities, and turn volatility into content. Your audience doesn\'t just follow — they\'re loyal to the chaos.',
    traits: ['Bold', 'Provocative', 'High-conviction', 'Community-first'],
    color: '#F59E0B',
    emoji: '🎰',
    rarity: 14,
    evolutionPaths: ['BUILD.EXE', 'FORESIGHT'],
    strengths: ['FOMO creation', 'Bold calls & takes', 'Community rallying'],
  },
  NULL: {
    name: 'NULL',
    tier: 2,
    tierLabel: 'RISING',
    tagline: 'Ideas over identity.',
    description:
      'You let your ideas speak louder than your face. Pseudonymous, mysterious, or just deliberately faceless — your influence comes from what you say, not who you are. The content IS the identity.',
    traits: ['Mysterious', 'Intellectual', 'Contrarian', 'Ideas-first'],
    color: '#8B5CF6',
    emoji: '👻',
    rarity: 11,
    evolutionPaths: ['FORESIGHT', 'SOURCE'],
    strengths: ['Pure idea content', 'Controversial takes', 'Anonymity mystique'],
  },
  FREQ: {
    name: 'FREQ',
    tier: 2,
    tierLabel: 'RISING',
    tagline: 'Entertainer. Community builder.',
    description:
      'You\'re the heartbeat of the timeline. Memes, hot takes, shitposts, engagement bait — you know exactly what makes people stop scrolling. Your community doesn\'t just engage, they participate.',
    traits: ['Witty', 'Engaging', 'Culture-aware', 'High-energy'],
    color: '#EC4899',
    emoji: '🎪',
    rarity: 16,
    evolutionPaths: ['RELAY', 'FORESIGHT'],
    strengths: ['Engagement farming', 'Meme creation', 'Hot takes that hit'],
  },
  RELAY: {
    name: 'RELAY',
    tier: 3,
    tierLabel: 'ADVANCED',
    tagline: 'Super connector.',
    description:
      'You\'re everyone\'s favorite mutual. You don\'t just build your own network — you connect others, amplify signal, and curate the best of the timeline. Your DMs are a power grid.',
    traits: ['Connected', 'Generous', 'Curator', 'Bridge-builder'],
    color: '#06B6D4',
    emoji: '🔌',
    rarity: 13,
    evolutionPaths: ['FORESIGHT', 'SOURCE'],
    strengths: ['Networking content', 'Signal boosting', 'Resource curation'],
  },
  'BUILD.EXE': {
    name: 'BUILD.EXE',
    tier: 3,
    tierLabel: 'ADVANCED',
    tagline: 'Builder. Shipper. Doer.',
    description:
      'You ship. While others talk about ideas, you\'re posting progress updates, demos, and launch threads. Your brand is proof of work — every commit, every deploy, every "it\'s live" moment.',
    traits: ['Action-oriented', 'Transparent', 'Technical', 'Relentless'],
    color: '#EF4444',
    emoji: '🚢',
    rarity: 12,
    evolutionPaths: ['SOURCE', 'FORESIGHT'],
    strengths: ['Build in public', 'Progress updates', 'Technical storytelling'],
  },
  SOURCE: {
    name: 'SOURCE',
    tier: 4,
    tierLabel: 'EXPERT',
    tagline: 'Knowledge authority.',
    description:
      'You\'re the person people screenshot and save. Educational threads, deep dives, how-to guides — your content has shelf life. When you speak on your topic, the timeline listens.',
    traits: ['Authoritative', 'Educational', 'Trusted', 'Deep-expertise'],
    color: '#3B82F6',
    emoji: '🎓',
    rarity: 8,
    evolutionPaths: [],
    strengths: ['Educational threads', 'Industry analysis', 'How-to content'],
  },
  FORESIGHT: {
    name: 'FORESIGHT',
    tier: 5,
    tierLabel: 'PEAK',
    tagline: 'Shapes the narrative.',
    description:
      'You don\'t follow trends — you set them. Visionary takes, contrarian predictions, big-picture thinking. When you post, it becomes the conversation. You\'re the signal everyone else amplifies.',
    traits: ['Visionary', 'Contrarian', 'Narrative-shaping', 'Influential'],
    color: '#9D4EDD',
    emoji: '🔮',
    rarity: 4,
    evolutionPaths: [],
    strengths: ['Predictions that land', 'Contrarian takes', 'Big-picture thinking'],
  },
};

/** Get archetype info by name (case-insensitive, handles legacy names) */
export function getArchetypeInfo(name: string): ArchetypeInfo | null {
  // Direct lookup
  const upper = name.toUpperCase();
  if (ARCHETYPE_DATA[upper]) return ARCHETYPE_DATA[upper];
  // Try exact match
  if (ARCHETYPE_DATA[name]) return ARCHETYPE_DATA[name];
  return null;
}

/** Get all archetypes sorted by tier (ascending) */
export function getAllArchetypes(): ArchetypeInfo[] {
  return Object.values(ARCHETYPE_DATA).sort((a, b) => a.tier - b.tier);
}

/** Get tier label for display */
export function getTierDisplay(tier: number): string {
  const labels: Record<number, string> = {
    1: 'ENTRY',
    2: 'RISING',
    3: 'ADVANCED',
    4: 'EXPERT',
    5: 'PEAK',
  };
  return labels[tier] || 'UNKNOWN';
}
