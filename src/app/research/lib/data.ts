import { Question, ProfileType } from '../types'

export const T1_QUESTIONS = [
  {
    id: 't1q1',
    text: 'How would you describe what your brand is actually about in one sentence? And how long did it take you to land on that?',
    signals: [
      { value: 'a', label: 'Clear, no hesitation' },
      { value: 'b', label: 'Clear now, evolved over time' },
      { value: 'c', label: 'Still figuring it out' },
    ],
  },
  {
    id: 't1q2',
    text: 'Do you consider yourself a "consistent" creator? Do you have a strategy in place or figure it out as you go?',
    signals: [
      { value: 'a', label: 'Yes, clear strategy' },
      { value: 'b', label: 'Yes, figuring it out' },
      { value: 'c', label: 'Not really consistent' },
    ],
  },
  {
    id: 't1q3',
    text: 'Do you think of your personal brand and content strategy as the same thing or two separate things?',
    signals: [
      { value: 'a', label: 'Separate — brand is bigger' },
      { value: 'b', label: "Sort of same, haven't thought about it" },
      { value: 'c', label: 'Same thing to me' },
    ],
  },
]

export const ADAPTIVE_QUESTIONS: Question[] = [
  { id: 't2q1', text: 'Walk me through what actually happens from the moment you have an idea to the moment a post is live.', profiles: ['intuitive', 'grinder', 'builder'], track: 't2' },
  { id: 't2q2', text: 'Do you batch content, post in real-time, or some mix of both? What made you land on that approach?', profiles: ['grinder', 'builder'], track: 't2' },
  { id: 't2q3', text: 'How do you decide what to post on any given day? Is it instinct, a schedule, something else?', profiles: ['intuitive', 'grinder'], track: 't2' },
  { id: 't2q4', text: 'Do you have a content calendar, even an informal one? What does that look like?', profiles: ['intuitive', 'grinder', 'builder'], track: 't2' },
  { id: 't2q5', text: "How do you keep track of what's worked and what hasn't? Is that process intentional or reactive?", profiles: ['builder'], track: 't2' },
  { id: 't3q1', text: "Where do you most often get stuck or feel like you're winging it?", profiles: ['intuitive', 'grinder', 'builder'], track: 't3' },
  { id: 't3q2', text: 'Have you ever posted something and immediately regretted it because it felt off-brand? What happened?', profiles: ['grinder', 'builder'], track: 't3' },
  { id: 't3q3', text: 'Is consistency with your brand voice something you think about a lot, or does it just come naturally?', profiles: ['intuitive', 'grinder'], track: 't3' },
  { id: 't4q1', text: 'What tools are you currently using to manage or create content? Even the informal ones like Notes or voice memos.', profiles: ['intuitive', 'grinder', 'builder'], track: 't4' },
  { id: 't4q2', text: 'Have you tried using AI tools for content? What worked, what felt completely wrong?', profiles: ['intuitive', 'grinder', 'builder'], track: 't4' },
  { id: 't4q3', text: "Is there a tool you've tried and dropped? What made you stop using it?", profiles: ['grinder', 'builder'], track: 't4' },
  { id: 't4q4', text: 'How much of your current workflow is automated? What parts do you still insist on doing manually?', profiles: ['builder'], track: 't4' },
  { id: 't4q5', text: "Have you ever paid for a tool that was supposed to help your brand and been disappointed? What was missing?", profiles: ['builder'], track: 't4' },
  { id: 't5q1', text: 'If you could have one system that handled all the brand and content ops work for you, what would it actually need to do?', profiles: ['grinder', 'builder'], track: 't5' },
  { id: 't5q2', text: 'Have you ever tried to write down your brand voice, content pillars, or posting strategy in one place? How did that go?', profiles: ['intuitive', 'grinder', 'builder'], track: 't5' },
  { id: 't5q3', text: 'What would have to be true about a brand tool for you to actually use it consistently?', profiles: ['intuitive', 'grinder', 'builder'], track: 't5' },
  { id: 't5q4', text: 'Would you rather have a tool that helps you think through your brand, or one that just executes once you already know what you want?', profiles: ['intuitive', 'grinder', 'builder'], track: 't5' },
]

export const getQuestionsForProfile = (profile: ProfileType): Question[] =>
  ADAPTIVE_QUESTIONS.filter(q => q.profiles.includes(profile))

export const PROFILES = {
  intuitive: {
    name: 'The Intuitive',
    badge: 'FOUNDATION STAGE',
    description: 'Building by feel. Brand and content blur together. No documented system yet.',
    color: 'amber',
  },
  grinder: {
    name: 'The Grinder',
    badge: 'INSTINCT > SYSTEM',
    description: 'Clear brand, no documented system. Consistent through discipline, not design.',
    color: 'green',
  },
  builder: {
    name: 'BUILD.EXE',
    badge: 'SYSTEM-AWARE',
    description: 'Has structure and self-awareness. Looking for gaps their system cannot handle.',
    color: 'blue',
  },
} satisfies Record<ProfileType, { name: string; badge: string; description: string; color: string }>

export const TRACK_META = {
  t2: { label: 'Systems & workflow', color: 'green' },
  t3: { label: 'Pain points',        color: 'red'   },
  t4: { label: 'Tools & stack',      color: 'amber' },
  t5: { label: 'Product fit',        color: 'blue'  },
} satisfies Record<import('../types').TrackKey, { label: string; color: string }>

export const FOLLOWER_TIERS = [
  '5k–25k followers',
  '25k–100k followers',
  '100k+ followers',
]
