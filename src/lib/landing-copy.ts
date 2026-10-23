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
    headline: 'Read your brand.',
    body: 'It takes about a minute. Any public X account.',
    quote: "read yours. if it's wrong, tell me.",
  },

  cta: 'Read my brand →',
} as const;
