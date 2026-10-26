/**
 * Every line of the homepage landing scroll (Direction 03, the field) lives
 * here so the copy can be edited without touching layout code.
 *
 * Voice (docs/BRAND-WORLD.md): the institution speaks formally (sentence case,
 * no exclamation marks, never "I"); Bawsa speaks lowercase, signed, as the
 * editor. Numbers shown on the page are live (see src/lib/landing-data.ts);
 * never write a figure into this file.
 */

export const EDITOR = 'bawsa, editor';

export const LANDING = {
  problem: {
    id: 'problem',
    label: '01 / The problem',
    headline: "Brands aren't ignoring you. They can't see you.",
    body: "A follower count says how many. It doesn't say who you are, what you stand for or whether you show up. So brands guess, and good creators lose deals they never hear about.",
    cantTellLabel: 'What a follower count cannot tell a brand',
    cantTell: ['What you stand for.', 'Whether you show up.', 'Who actually listens.'],
    quote:
      "i've watched great creators get passed over for bigger, emptier accounts. that's what i built this for.",
    demo: {
      label: 'Same follower count',
      sampleNote: 'Sample accounts',
      followersLabel: 'Followers',
      followers: '48.2K',
      show: 'Show the reading',
      hide: 'Hide the reading',
      scoreLabel: 'Brand score',
      verdict: 'Same size. Not the same brand.',
      accounts: [
        {
          name: 'Account A',
          score: 81,
          archetype: 'SOURCE',
          note: 'Posts most days. The replies come from people who build.',
        },
        {
          name: 'Account B',
          score: 38,
          archetype: 'NULL',
          note: 'Posts in bursts. Most replies are one word long.',
        },
      ],
    },
  },

  /** Chapter 02, before the stepper: what a reading actually does (src/lib/brand-score.ts). */
  scan: {
    label: '02 / The scan',
    headline: 'What happens when you read your brand.',
    body: 'A reading takes about a minute. This is what BrandOS does in that minute.',
    logLabel: 'Scan log',
    log: {
      start: 'reading',
      profile: 'profile: bio, followers vs following, lists, verified',
      posts: '50 recent original posts: no reposts, no replies, no pinned post',
      measured: 'engagement per view / posts per day / best hour',
      formats: 'formats: threads, media, questions, length',
      voice: 'voice: tone breakdown',
      phases: 'four phases scored',
      classified: 'classified',
      back: 'strengths / gaps / next moves',
    },
    phasesLabel: 'The four phases',
    phasesHint: 'Weighted into one score out of 100.',
    phases: [
      {
        name: 'Define',
        weight: 30,
        question: 'What are you known for?',
        details: [
          'Your content pillars: the topics you return to.',
          'A one-line identity signature, read from your posts alone.',
          'How focused your topics are.',
          'Who your posts naturally speak to.',
        ],
      },
      {
        name: 'Check',
        weight: 25,
        question: 'Does your voice hold?',
        details: [
          'Whether your voice drifts from post to post.',
          'On topic, or scattered across unrelated subjects.',
          'Contradictory messages or a split identity.',
          'Whether people would recognize your post without the handle.',
        ],
      },
      {
        name: 'Generate',
        weight: 25,
        question: 'Does your content perform?',
        details: [
          'Engagement for your size.',
          'Which formats work: threads, media, questions.',
          'How strong your hooks are.',
          'Original posts versus reposting and reacting.',
          'How often, and how steadily, you post.',
        ],
      },
      {
        name: 'Scale',
        weight: 20,
        question: 'What signals your reputation?',
        details: [
          'Followers versus following: do people follow for the content.',
          'Lists: whether others curate you.',
          'Growth trajectory.',
          'Verification.',
          'Reach potential, from your formats and engagement.',
        ],
      },
    ],
    backLabel: 'What you get back',
    back: [
      'A score out of 100, and the four phase scores behind it.',
      'Your classification: one of eight classes.',
      'Your voice: a tone breakdown.',
      'Strengths and gaps, from your own posts.',
      'Next moves: what to do first.',
    ],
    fairLabel: 'The same method for everyone',
    fair: [
      'One method, applied to every account.',
      'Read from your posts. Not your bio. Not your follower count.',
      'Re-reads are smoothed: within 3 points in a week, 5 in a month, so the number does not jump around.',
      'Your classification stays consistent from read to read.',
      'A reading is kept for 6 hours before it can be re-read.',
    ],
  },

  how: {
    id: 'how',
    label: '02 / How it works',
    headline: 'BrandOS reads your brand and puts it on the record.',
    steps: [
      {
        n: '01',
        title: 'The reading',
        body: 'BrandOS reads your real posts and scores your brand out of 100 across four phases: Define, Check, Generate and Scale. Not your bio. Not your follower count.',
      },
      {
        n: '02',
        title: 'The classification',
        body: 'Your brand is classified into one of eight classes, from Class 01 SOURCE to Class 08 NULL. The same method is applied to everyone.',
      },
      {
        n: '03',
        title: 'The entry',
        body: 'You enter the Creator Index with a permanent number. Brands browse it free.',
      },
      {
        n: '04',
        title: 'Certification',
        body: 'Members who pass the checks are Verified: the account is theirs, the audience is real, the reading is current.',
        when: 'From 9 Nov',
      },
    ],
    exampleLabel: 'An example reading',
    proofLabel: 'Brands read so far',
    specimen: ['The reading', 'The classification', 'The entry', 'Certification'],
    stepOf: 'Step',
    classOf: '1 of 8 classes',
    checks: ['The account is theirs', 'The audience is real', 'The reading is current'],
    classesLabel: 'The eight classes',
    classesHint: 'Select a class to read its definition.',
  },

  record: {
    id: 'record',
    label: '03 / What you get',
    headline: 'Your record, kept up to date.',
    body: 'Members keep a private record of their brand. It is re-read as you post, and it tells you what to do next.',
    items: [
      'Your score and its four phases, re-read as you post.',
      'Growth, tracked every day.',
      "What's working: formats, your best hour, your best and worst posts.",
      'Next moves and ideas drawn from your own data.',
      'Your audience: who engages, and who comes back.',
      'Competitors, side by side.',
    ],
    sampleLabel: 'Sample record',
    prev: 'Previous',
    next: 'Next',
    tiles: {
      score: 'Brand score',
      growth: 'Followers, 30 days',
      working: "What's working",
      moves: 'Next moves',
      audience: 'Audience, 30 days',
      competitors: 'Competitors',
    },
  },

  index: {
    id: 'index',
    label: '04 / The Index',
    headlineBefore: 'The BrandOS Creator Index opens 2 Nov.',
    headlineOpen: 'The Index is open.',
    body: 'A public book of creators, each with a reading behind them. Free to be listed. Pro to be picked.',
    brands: 'Brands browse the Index free.',
    membersLabel: 'Members',
    sampleEntry: 'Sample entry',
    tickerLabel: 'Sample entries',
    readsLabel: 'Recent reads',
    recentRead: 'Recent read',
    readOn: 'Read',
    readsNote:
      'Public accounts BrandOS read lately. The Index lists only members who chose to join.',
    sealed: { label: 'Founding 100', range: '№ 001–100' },
    seeIndex: 'See the Index',
    opensNote: 'opens 2 Nov',
    founding: {
      label: 'Founding 100',
      title: '$29/mo for life.',
      body: 'Everything is free until 3 Dec. The first 100 members to add a card keep Pro at $29/mo for life: featured in the Index, a full profile, and which brands viewed them. Nothing is charged until 3 Dec. After the first 100, Pro is $39/mo.',
      seatsLabel: 'Seats left',
      cta: 'Become a Founding Member',
    },
    faqLabel: 'Questions',
    faq: [
      {
        q: 'Is it free?',
        a: 'Reading your brand and joining the Index are free. Everything is free until 3 Dec. After that, listing stays free and Pro is paid.',
      },
      { q: 'Which accounts can be read?', a: 'Any public X account.' },
      {
        q: 'Do I have to be listed?',
        a: 'No. The Index is opt-in, and you can leave at any time.',
      },
      {
        q: 'What does BrandOS read?',
        a: 'Your recent public posts and how people respond to them. Nothing private.',
      },
    ],
  },

  close: {
    id: 'read',
    label: '05 / Your turn',
    headline: 'Read your\u00a0brand.', // no-break: never "brand." alone on a line
    body: 'It takes about a minute. Any public X account.',
    quote: "read yours. if it's wrong, tell me.",
  },

  cta: 'Read my brand →',
  ctaBusy: 'Reading…',
  /** Example handles typed into the empty scan box. */
  typedHandles: ['@yourhandle', '@jbawsa', '@anyone_on_x'],
  /** The live record strip under the hero; numbers are filled in from landing-data. */
  strip: {
    brandsRead: 'Brands read',
    seats: 'Founding seats left',
    example: 'Example',
    opens: 'The Index opens 2 Nov',
    members: 'Index members',
    house: [
      'The record of creator reputation',
      'Read from real posts',
      'Class 01–08',
      'mybrandos.app',
    ],
  },
} as const;
