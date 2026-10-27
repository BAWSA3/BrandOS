import type { GrowthView, MemberRecord } from '@/lib/growth-data';
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
  brand: {
    id: 'b1',
    handle: 'jbawsa',
    kind: 'creator',
    lastSyncedAt: null,
    name: 'Bawsa',
    avatarUrl: null,
  },
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
  outlier: {
    tweetId: '4',
    text: 'i asked 40 brands why they skipped creators. here is what they said 🧵',
    views: 127_000,
    multiple: 41,
    medianViews: 3100,
  },
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

const H = 3_600_000;
const D = 24 * H;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

export const SAMPLE_IDEAS: Idea[] = [
  {
    id: 1,
    createdAt: ago(2 * H),
    col: 'ideas',
    text: 'Thread: "how I priced my first brand deal" (5 posts)',
    why: 'Threads earn 2.4× your average and you posted 1 this month.',
  },
  {
    id: 2,
    createdAt: ago(5 * H),
    col: 'ideas',
    text: 'Screenshot your BrandOS score jump and explain the one change',
    why: 'Posts with media earn 2.1× text-only.',
  },
  {
    id: 3,
    createdAt: ago(26 * H),
    col: 'ideas',
    text: 'Reply-guy audit: 3 replies that grew my account',
    why: '@0xhvdes gets 38 replies a post; you get 21.',
  },
  { id: 4, col: 'drafting', text: 'Why I stopped posting "gm"', createdAt: ago(3 * D) },
  {
    id: 5,
    col: 'posted',
    text: 'The 3 income streams nobody tells you about',
    createdAt: ago(9 * D),
  },
];

const at = (daysAgo: number) =>
  new Date(Date.UTC(2026, 9, 26) - daysAgo * 86_400_000).toISOString();

/** The member's own record (score history, last posts, lookups) for the preview. */
export const SAMPLE_RECORD: MemberRecord = {
  history: [
    { id: 'h1', at: at(40), score: 64, phases: { define: 70, check: 66, generate: 58, scale: 61 } },
    { id: 'h2', at: at(26), score: 68, phases: { define: 74, check: 68, generate: 62, scale: 63 } },
    { id: 'h3', at: at(12), score: 70, phases: { define: 76, check: 70, generate: 64, scale: 66 } },
    { id: 'h4', at: at(3), score: 72, phases: { define: 78, check: 71, generate: 68, scale: 69 } },
  ],
  posts: [
    {
      id: 'p1',
      excerpt: 'i asked 40 brands why they skipped creators. here is what they said 🧵',
      when: '2d ago',
      fit: 91,
      likes: 1840,
      multiple: '41.0x',
    },
    {
      id: 'p2',
      excerpt: 'the 3 income streams nobody tells you about when you start posting…',
      when: '3d ago',
      fit: 84,
      likes: 212,
      multiple: '1.8x',
    },
    {
      id: 'p3',
      excerpt: 'stop asking for followers. ask for one reply from the right person.',
      when: '4d ago',
      fit: 78,
      likes: 160,
      multiple: '1.5x',
    },
    {
      id: 'p4',
      excerpt: 'gm. building today 🔨',
      when: '5d ago',
      fit: 41,
      likes: 12,
      multiple: '0.2x',
    },
    {
      id: 'p5',
      excerpt: 'what i learned shipping a product in public for 30 days',
      when: '6d ago',
      fit: 72,
      likes: 98,
      multiple: '0.9x',
    },
  ],
  lookups: { week: { total: 37, page: 21, mcp: 11, compare: 5 }, today: 4 },
};
