// Dashboard v2 mockup: sample data only (no network, no DB). Numbers echo the
// growth preview (/world-preview/growth) so the two can be compared side by side.

export type Persona = 'creator' | 'founder' | 'builder';
export type Screen = 'today' | 'playbook' | 'canvas' | 'write' | 'framework' | 'standing' | 'press';

export const PERSONAS: { id: Persona; name: string; line: string }[] = [
  { id: 'creator', name: 'Creator', line: 'You make things people follow.' },
  { id: 'founder', name: 'Founder', line: 'You run a company and you are its voice.' },
  { id: 'builder', name: 'Builder', line: 'You ship in public and explain how.' },
];

export type Move = {
  kind: 'build' | 'post' | 'fix';
  title: string;
  why: string;
  stat: { value: number; suffix: string; label: string };
  source: string;
  action: { label: string; to: Screen };
};

/** The daily next move, drawn from the member's own Record. One at a time. */
export const MOVES: Record<Persona, Move[]> = {
  creator: [
    {
      kind: 'build',
      title: 'Write part two of your brand-deals post.',
      why: 'Part one reached far past your usual, and 212 people replied asking what the brands said next. Nobody has seen the follow-up.',
      stat: { value: 41, suffix: '×', label: 'your usual reach' },
      source: 'From your Record · post of 21 Oct',
      action: { label: 'Start writing', to: 'write' },
    },
    {
      kind: 'fix',
      title: 'Put one image on your next post.',
      why: 'Posts with media earn 2.9% engagement against 1.4% for text only, and 31% of your posts are text only.',
      stat: { value: 2.1, suffix: '×', label: 'engagement with media' },
      source: 'From your Record · last 41 posts',
      action: { label: 'Make a diagram', to: 'framework' },
    },
  ],
  founder: [
    {
      kind: 'post',
      title: 'Say what you shipped this week, in one post.',
      why: 'Your product posts earn more replies than anything else you write. You shipped the new dashboard on Thursday and have not said so.',
      stat: { value: 2.1, suffix: '×', label: 'replies on product posts' },
      source: 'From your Record · last 30 days',
      action: { label: 'Start writing', to: 'write' },
    },
    {
      kind: 'fix',
      title: 'Write your positioning down in one sentence.',
      why: 'Your read is clear on what you build and vague on who it is for. One sentence in your Playbook fixes that for every post after it.',
      stat: { value: 64, suffix: '%', label: 'of your Playbook is yours' },
      source: 'From your read · 22 Oct',
      action: { label: 'Open the Playbook', to: 'playbook' },
    },
  ],
  builder: [
    {
      kind: 'build',
      title: 'Explain how your scoring works, as one diagram.',
      why: 'Your last three explanations were text only. Posts where you showed the system did far better than the ones where you described it.',
      stat: { value: 1.8, suffix: '×', label: 'your average with a diagram' },
      source: 'From your Record · last 41 posts',
      action: { label: 'Make the diagram', to: 'framework' },
    },
    {
      kind: 'post',
      title: 'Turn yesterday’s commit into a build-in-public post.',
      why: 'Build logs are your most consistent format: steady reach, strong replies, low effort. You have not posted one in 6 days.',
      stat: { value: 6, suffix: ' days', label: 'since your last build log' },
      source: 'From your Record · last 30 days',
      action: { label: 'Start writing', to: 'write' },
    },
  ],
};

export const BRANDS = [
  { id: 'b1', handle: 'jbawsa', kind: 'Creator' },
  { id: 'b2', handle: 'mybrandos', kind: 'Brand' },
  { id: 'b3', handle: 'acmelabs', kind: 'Brand' },
];

export const RECORD = {
  handle: 'jbawsa',
  name: 'Bawsa',
  entry: '0042',
  classification: 'CLASS 04 · ARC',
  score: 72,
  move: { delta: 2, since: '14 Oct' },
  phases: [
    { k: 'Define', v: 78 },
    { k: 'Check', v: 71 },
    { k: 'Generate', v: 68 },
    { k: 'Scale', v: 69 },
  ],
  history: [
    { d: '30 Sep', v: 68 },
    { d: '14 Oct', v: 70 },
    { d: '23 Oct', v: 72 },
  ],
  moved: [
    { phase: 'Generate', delta: 4, why: 'your brand-deals post reached 41× your usual' },
    { phase: 'Check', delta: -1, why: 'one off-voice "gm" post' },
  ],
  since: { followers: 412, reach: 38, scored80: 9 },
  // Standing (XP): private points, the rank is the part on the record
  standing: {
    total: 2340,
    level: 7,
    into: 1590,
    need: 1750,
    run: 9,
    rank: 'II',
    rankName: 'Noted',
  },
};

export type Section = {
  id: string;
  label: string;
  title: string;
  body: string;
  /** 'read' = pre-filled from the scan; 'yours' = the member has edited it */
  owner: 'read' | 'yours';
  edited?: string;
};

export const PLAYBOOK: Section[] = [
  {
    id: 'positioning',
    label: 'Positioning',
    title: 'What you stand for',
    body: 'I help creators get found by the brands that fit them, by showing the work in public.',
    owner: 'yours',
    edited: '24 Oct',
  },
  {
    id: 'audience',
    label: 'Audience',
    title: 'Who it is for',
    body: 'Creators between 5K and 100K followers who post weekly and have never had a brand deal they were proud of.',
    owner: 'read',
  },
  {
    id: 'voice',
    label: 'Voice',
    title: 'How you sound',
    body: 'Lowercase, direct, a number in the first line, one ask at the end. No hype words.',
    owner: 'read',
  },
];

export const PILLARS = [
  { name: 'Brand deals, explained', share: 38, posts: 16, owner: 'yours' as const },
  { name: 'Building BrandOS in public', share: 34, posts: 14, owner: 'read' as const },
  { name: 'Creator economy data', share: 28, posts: 11, owner: 'read' as const },
];

export const WORKING = [
  { label: 'Threads', rate: 3.4, top: true },
  { label: 'With media', rate: 2.9, top: false },
  { label: 'Quote posts', rate: 2.2, top: false },
  { label: 'Text only', rate: 1.4, top: false },
];

/** Body of work, per week (oldest → newest): ideas, drafts, posts, score at week end. */
export const WEEKS = [
  { w: '7 Sep', ideas: 2, drafts: 1, posts: 2, score: 64 },
  { w: '14 Sep', ideas: 3, drafts: 2, posts: 2, score: 64 },
  { w: '21 Sep', ideas: 4, drafts: 2, posts: 3, score: 66 },
  { w: '28 Sep', ideas: 5, drafts: 3, posts: 3, score: 68 },
  { w: '5 Oct', ideas: 6, drafts: 3, posts: 4, score: 68 },
  { w: '12 Oct', ideas: 6, drafts: 4, posts: 5, score: 70 },
  { w: '19 Oct', ideas: 8, drafts: 5, posts: 6, score: 71 },
  { w: '26 Oct', ideas: 7, drafts: 4, posts: 5, score: 72 },
];

export const DRAFT = {
  idea: 'Part two: what 40 brands said about why they skip creators',
  text: `i asked 40 brands why they skipped creators. part two.

the top reason wasn't followers. it was "we couldn't tell what they stand for."

31 of 40 said they scroll a profile for 10 seconds. if the last 9 posts are about 9 different things, they move on.

so here's the fix: pick 3 things. post only those for 30 days. watch who shows up.`,
  score: {
    fit: 81,
    voice: 88,
    hook: 'Strong',
    format: 'Thread',
    lift: 1.3,
    reach: '0.9–1.6×',
    fix: 'Lead with the number: "31 of 40 brands scroll a profile for 10 seconds." It is your strongest line and it is buried in post three.',
  },
};

export type CanvasCard = {
  id: string;
  x: number;
  y: number;
  text: string;
  tag?: string;
  frame?: string;
  suggested?: boolean;
};

export const FRAMES = [
  { id: 'f1', name: 'Brand deals', x: 40, y: 60, w: 560, h: 380 },
  { id: 'f2', name: 'Build in public', x: 660, y: 60, w: 420, h: 300 },
];

export const CARDS: CanvasCard[] = [
  {
    id: 'c1',
    x: 70,
    y: 110,
    text: 'i asked 40 brands why they skipped creators',
    tag: 'Posted · 127K views',
    frame: 'f1',
  },
  {
    id: 'c2',
    x: 330,
    y: 120,
    text: 'Part two: what the brands said',
    tag: 'Drafting',
    frame: 'f1',
  },
  {
    id: 'c3',
    x: 90,
    y: 290,
    text: 'The 10-second profile test, as a diagram',
    tag: 'Idea',
    frame: 'f1',
  },
  { id: 'c4', x: 350, y: 300, text: 'How I priced my first brand deal', tag: 'Idea', frame: 'f1' },
  {
    id: 'c5',
    x: 690,
    y: 110,
    text: 'Shipped: every post scored overnight',
    tag: 'Idea',
    frame: 'f2',
  },
  { id: 'c6', x: 860, y: 230, text: 'Why I stopped posting "gm"', tag: 'Half-built', frame: 'f2' },
  {
    id: 'c7',
    x: 700,
    y: 430,
    text: 'Three follow-ups your 127K post earned. Add them to the board?',
    tag: 'Suggested from your Record',
    suggested: true,
  },
];

export const LINKS: [string, string][] = [
  ['c1', 'c2'],
  ['c2', 'c3'],
  ['c5', 'c6'],
];

/** The Record grid: 12 weeks × 7 days, 0–4 = how much was made that day. Last cell = today. */
export const DAYS: number[] = (() => {
  const out: number[] = [];
  let seed = 7;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 84; i++) {
    const ramp = i / 84; // the work compounds: later weeks are denser
    const r = rnd();
    const v = r < 0.28 - ramp * 0.2 ? 0 : Math.min(4, Math.floor(r * 2.2 + ramp * 2.6));
    out.push(v);
  }
  out[83] = 0; // today: pressed in on the screen
  return out;
})();
