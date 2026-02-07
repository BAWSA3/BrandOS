/**
 * The 8 BrandOS Creator Archetypes
 * Ordered by tier (1-5) for cinematic reveal
 */

export interface Archetype {
  name: string;
  emoji: string;
  tier: number;
  tagline: string;
  rarity: number;
}

export const archetypes: Archetype[] = [
  // Tier 1 - Entry
  {
    name: "Underdog Arc",
    emoji: "\uD83D\uDCAA",
    tier: 1,
    tagline: "Rising star. Growth story.",
    rarity: 20,
  },
  // Tier 2 - Mid
  {
    name: "The Degen",
    emoji: "\uD83D\uDD25",
    tier: 2,
    tagline: "Risk-taker. Cult builder.",
    rarity: 10,
  },
  {
    name: "The Anon",
    emoji: "\uD83D\uDC7D",
    tier: 2,
    tagline: "Ideas over identity.",
    rarity: 11,
  },
  {
    name: "Chief Vibes Officer",
    emoji: "\uD83D\uDE0E",
    tier: 2,
    tagline: "Entertainer. Community builder.",
    rarity: 18,
  },
  // Tier 3 - Advanced
  {
    name: "The Plug",
    emoji: "\uD83E\uDD1D",
    tier: 3,
    tagline: "Super connector.",
    rarity: 8,
  },
  {
    name: "Ship or Die",
    emoji: "\uD83D\uDE80",
    tier: 3,
    tagline: "Builder. Shipper. Doer.",
    rarity: 15,
  },
  // Tier 4 - Expert
  {
    name: "The Professor",
    emoji: "\uD83E\uDD13",
    tier: 4,
    tagline: "Knowledge authority.",
    rarity: 12,
  },
  // Tier 5 - Peak
  {
    name: "The Prophet",
    emoji: "\uD83D\uDC40",
    tier: 5,
    tagline: "Shapes the narrative.",
    rarity: 6,
  },
];

export const getTierLabel = (tier: number): string => {
  switch (tier) {
    case 1: return "ENTRY";
    case 2: return "RISING";
    case 3: return "ADVANCED";
    case 4: return "EXPERT";
    case 5: return "PEAK";
    default: return "";
  }
};
