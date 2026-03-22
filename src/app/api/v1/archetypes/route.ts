import { NextRequest } from 'next/server';
import {
  authenticateApiKey,
  apiError,
  apiSuccess,
  apiOptionsHandler,
} from '@/lib/api-auth';

// =============================================================================
// GET /api/v1/archetypes
// Returns all 8 BrandOS archetypes with descriptions and evolution paths
// =============================================================================

const ARCHETYPES = [
  {
    id: 'ARC',
    name: 'ARC',
    emoji: '🐕',
    tier: 1,
    tagline: 'Rising Star',
    description:
      'An emerging presence with upward trajectory. Main character energy, growing fast, and building momentum.',
    strengths: ['Growth trajectory', 'Authentic engagement', 'High energy'],
    evolvesTo: ['ENTROPY', 'NULL', 'FREQ', 'RELAY', 'BUILD.EXE', 'SIGNAL_SAGE', 'FORESIGHT'],
  },
  {
    id: 'ENTROPY',
    name: 'ENTROPY',
    emoji: '🎰',
    tier: 2,
    tagline: 'Risk Taker',
    description:
      'High-risk, high-reward energy. Crypto trader mentality, ape-in culture, degen vibes with a strategy underneath.',
    strengths: ['Market timing', 'Risk appetite', 'Community building'],
    evolvesTo: ['BUILD.EXE', 'FORESIGHT'],
  },
  {
    id: 'NULL',
    name: 'NULL',
    emoji: '👻',
    tier: 2,
    tagline: 'Pseudonymous Influencer',
    description:
      'Influence without identity. The anon account with real pull — lets the content speak louder than the persona.',
    strengths: ['Content-first approach', 'Mystery and intrigue', 'Idea-driven influence'],
    evolvesTo: ['FORESIGHT', 'SIGNAL_SAGE'],
  },
  {
    id: 'FREQ',
    name: 'FREQ',
    emoji: '🎪',
    tier: 2,
    tagline: 'Timeline Entertainer',
    description:
      'The entertainer, shitposter, meme lord. High engagement through humor, relatability, and cultural commentary.',
    strengths: ['Engagement rate', 'Cultural relevance', 'Viral potential'],
    evolvesTo: ['RELAY', 'FORESIGHT'],
  },
  {
    id: 'RELAY',
    name: 'RELAY',
    emoji: '🔌',
    tier: 3,
    tagline: 'Super Connector',
    description:
      'The network node. Connects people, amplifies others, and builds ecosystems. DMs-open energy with real follow-through.',
    strengths: ['Network effects', 'Community curation', 'Cross-pollination'],
    evolvesTo: ['FORESIGHT', 'SIGNAL_SAGE'],
  },
  {
    id: 'BUILD.EXE',
    name: 'BUILD.EXE',
    emoji: '🚢',
    tier: 3,
    tagline: 'Builder / Maker',
    description:
      'Ships products, shares progress, builds in public. The "show your work" archetype — credibility through creation.',
    strengths: ['Proof of work', 'Technical credibility', 'Building in public'],
    evolvesTo: ['SIGNAL_SAGE', 'FORESIGHT'],
  },
  {
    id: 'SIGNAL_SAGE',
    name: 'SIGNAL_SAGE',
    emoji: '🎓',
    tier: 4,
    tagline: 'Knowledge Authority',
    description:
      'The niche expert and educator. Threads, breakdowns, frameworks — builds authority through depth and generosity.',
    strengths: ['Deep expertise', 'Educational content', 'Thought leadership'],
    evolvesTo: [],
  },
  {
    id: 'FORESIGHT',
    name: 'FORESIGHT',
    emoji: '🔮',
    tier: 5,
    tagline: 'Visionary',
    description:
      'Peak archetype. The thought leader who called it early — visionary takes, contrarian wisdom, lasting influence.',
    strengths: ['Predictive insight', 'Contrarian conviction', 'Legacy-building'],
    evolvesTo: [],
  },
];

export async function GET(request: NextRequest) {
  // Auth
  const auth = await authenticateApiKey(request);
  if (!auth.authenticated) {
    return apiError(auth.error || 'Unauthorized', auth.statusCode || 401);
  }

  return apiSuccess(ARCHETYPES, {
    total: ARCHETYPES.length,
    tiers: {
      1: 'Emerging',
      2: 'Established',
      3: 'Advanced',
      4: 'Authority',
      5: 'Peak',
    },
  });
}

export async function OPTIONS() {
  return apiOptionsHandler();
}
