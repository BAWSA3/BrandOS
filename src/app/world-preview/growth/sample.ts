import type { GrowthView } from '@/lib/growth-data';
import type { Idea } from '@/components/growth/IdeaBoard';

// Sample view for the layout preview (/world-preview/growth). Competitor reads
// are the real Oct 22 reads; everything else is illustrative.
const day = (d: number) => new Date(Date.UTC(2026, 8, 23 + d)).toISOString().slice(0, 10);

export const SAMPLE_VIEW: GrowthView = {
  brands: [
    { id: 'b1', handle: 'jbawsa', kind: 'creator' },
    { id: 'b2', handle: 'mybrandos', kind: 'brand' },
    { id: 'b3', handle: 'acmelabs', kind: 'brand' },
  ],
  brand: { id: 'b1', handle: 'jbawsa', kind: 'creator', lastSyncedAt: null },
  limits: { brands: 5, competitors: 5 },
  score: {
    value: 72,
    archetype: 'ARC',
    phases: { define: 78, check: 71, generate: 68, scale: 69 },
    weakest: 'generate',
    scannedAt: new Date(Date.UTC(2026, 9, 22)).toISOString(),
    nextMoves: [
      'Post one 5-part thread on brand deals this week.',
      'Cut the “gm” posts; they are 22% of your feed and pull your average down.',
      'Reply to the accounts that amplify you most.',
    ],
  },
  growth: {
    followers: 31_827,
    followers7: 421,
    engagement: 2.6,
    engagement7: 0.3,
    postsPerDay: 3.1,
    samplePosts: 41,
    avgViews: 8400,
    avgViews7: 12,
    series: Array.from({ length: 30 }, (_, i) => ({
      day: day(i),
      followers: Math.round(
        30_950 + i * 21 + Math.sin(i / 2.3) * 40 + (i > 22 ? (i - 22) * 38 : 0)
      ),
    })),
    trackedDays: 30,
  },
  formats: [
    { format: 'media', label: 'With media', rate: 2.9, share: 43, posts: 18 },
    { format: 'thread', label: 'Threads', rate: 3.4, share: 2, posts: 1 },
    { format: 'quote', label: 'Quote posts', rate: 2.2, share: 24, posts: 10 },
    { format: 'text', label: 'Text only', rate: 1.4, share: 31, posts: 12 },
  ],
  peakHour: 15,
  best: [
    {
      tweetId: '1',
      text: 'the 3 income streams nobody tells you about when you start posting…',
      rate: 4.8,
      why: '1.8× your average · with media',
    },
    {
      tweetId: '2',
      text: 'stop asking for followers. ask for one reply from the right person.',
      rate: 3.9,
      why: '1.5× your average · posted at your peak hour',
    },
  ],
  worst: {
    tweetId: '3',
    text: 'gm. building today 🔨',
    rate: 0.4,
    why: '85% below your average · very short, no idea to engage with',
  },
  ideas: [],
  audience: {
    people: 214,
    returning: 81,
    returningShare: 0.38,
    posts: 6,
    topEngagers: [
      {
        handle: 'galileowilson',
        name: 'Galileo',
        followers: 33_000,
        replies: 9,
        reposts: 2,
        posts: 4,
      },
      { handle: 'kreatorsdao', name: null, followers: 12_400, replies: 7, reposts: 4, posts: 5 },
      { handle: 'notthreadguy', name: null, followers: 8_100, replies: 5, reposts: 0, posts: 3 },
      { handle: 'mintlabs', name: null, followers: 2_300, replies: 3, reposts: 5, posts: 4 },
    ],
    topAmplifiers: [
      { handle: 'mintlabs', name: null, followers: 2_300, replies: 3, reposts: 5, posts: 4 },
      { handle: 'kreatorsdao', name: null, followers: 12_400, replies: 7, reposts: 4, posts: 5 },
    ],
    notable: [
      {
        handle: 'galileowilson',
        name: 'Galileo',
        followers: 33_000,
        replies: 9,
        reposts: 2,
        posts: 4,
      },
      { handle: 'kreatorsdao', name: null, followers: 12_400, replies: 7, reposts: 4, posts: 5 },
    ],
  },
  competitors: [
    {
      id: 'b1',
      handle: 'jbawsa',
      you: true,
      score: 72,
      engagement: 2.6,
      postsPerDay: 3.1,
      followers: 31_827,
      mediaShare: 0.43,
    },
    {
      id: 'c1',
      handle: '0xhvdes',
      you: false,
      score: 78,
      engagement: 2.05,
      postsPerDay: 1.9,
      followers: 52_300,
      mediaShare: 0.43,
    },
    {
      id: 'c2',
      handle: 'galileowilson',
      you: false,
      score: 72,
      engagement: 5.5,
      postsPerDay: 6.6,
      followers: 33_000,
      mediaShare: 0.48,
    },
    {
      id: 'c3',
      handle: 'carlitoswa_y',
      you: false,
      score: 68,
      engagement: 4.1,
      postsPerDay: 10.7,
      followers: 32_000,
      mediaShare: 0.51,
    },
  ],
};

export const SAMPLE_IDEAS: Idea[] = [
  {
    id: 1,
    col: 'ideas',
    text: 'Thread: "how I priced my first brand deal" (5 posts)',
    why: 'Threads earn 2.4× your average and you posted 1 this month.',
  },
  {
    id: 2,
    col: 'ideas',
    text: 'Screenshot your BrandOS score jump and explain the one change',
    why: 'Posts with media earn 2.1× text-only.',
  },
  {
    id: 3,
    col: 'ideas',
    text: 'Reply-guy audit: 3 replies that grew my account',
    why: '@0xhvdes gets 38 replies a post; you get 21.',
  },
  { id: 4, col: 'drafting', text: 'Why I stopped posting "gm"' },
  { id: 5, col: 'posted', text: 'The 3 income streams nobody tells you about' },
];
