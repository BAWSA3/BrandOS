/**
 * Dashboard v2: the tester gate (src/lib/dashboard-v2-rules.ts) and today's
 * move (src/lib/next-move.ts). Pure, no network/DB:
 *   npm run test:dash-v2
 */
import { dashboardV2Rule } from '../src/lib/dashboard-v2-rules';
import { nextMoves, pickIndex, type MoveInput } from '../src/lib/next-move';
import { bodyOfWork, workLine } from '../src/lib/playbook';
import {
  articleClipboard,
  articleWords,
  moveSection,
  outlineAsIdea,
  parseOutline,
  parseSections,
  parseTitleHook,
  readArticle,
  roomFormat,
} from '../src/lib/article';
import { COPY_MAX_TOKENS, isCopyFormat } from '../src/lib/copywriter';

let pass = 0;
let fail = 0;
function test(name: string, ok: boolean, detail?: unknown) {
  if (ok) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}`, detail ?? '');
  }
}

console.log('gate');
test(
  'flag off → off, even for admin',
  !dashboardV2Rule({ envFlag: undefined, role: 'admin', redeemed: true })
);
test('flag "0" → off', !dashboardV2Rule({ envFlag: '0', role: 'admin', redeemed: true }));
test('early account (no code) → on', dashboardV2Rule({ envFlag: '1', role: 'user', redeemed: false, early: true }));
test('early account, flag off → off', !dashboardV2Rule({ envFlag: '0', role: 'user', redeemed: false, early: true }));
test('not early, no code → off', !dashboardV2Rule({ envFlag: '1', role: 'user', redeemed: false, early: false }));
test(
  'flag on, public member → off',
  !dashboardV2Rule({ envFlag: '1', role: 'user', redeemed: false })
);
test(
  'flag on, redeemed code → on',
  dashboardV2Rule({ envFlag: '1', role: 'user', redeemed: true })
);
test(
  'flag on, admin without code → on',
  dashboardV2Rule({ envFlag: 'true', role: 'admin', redeemed: false })
);
test(
  'flag " ON " (spaces, caps) → on',
  dashboardV2Rule({ envFlag: ' ON ', role: null, redeemed: true })
);
test('flag "yes" is not on', !dashboardV2Rule({ envFlag: 'yes', role: 'admin', redeemed: true }));

console.log('next move');
const base: MoveInput = {
  handle: 'jbawsa',
  outlier: null,
  formats: [],
  score: null,
  ideas: [],
};
test('nothing in the record → no moves (Today shows its fallback)', nextMoves(base).length === 0);

const full: MoveInput = {
  ...base,
  outlier: {
    tweetId: '9',
    text: 'i asked 40 brands why they skipped creators',
    views: 127_000,
    multiple: 41,
  },
  formats: [
    { format: 'text', label: 'Text only', rate: 1.4, share: 31, posts: 12 },
    { format: 'thread', label: 'Threads', rate: 3.4, share: 2, posts: 1 },
    { format: 'media', label: 'With media', rate: 2.9, share: 22, posts: 9 },
    { format: 'quote', label: 'Quote posts', rate: 2.2, share: 24, posts: 10 },
  ],
  score: {
    value: 72,
    weakest: 'generate',
    phases: { define: 78, check: 71, generate: 68, scale: 69 },
    nextMoves: ['Post one breakdown of a brand deal this week.'],
  },
  ideas: [
    { id: 'a', text: 'How I priced my first brand deal', status: 'saved' },
    { id: 'b', text: 'Why I stopped posting gm', status: 'drafting' },
    { id: 'c', text: 'Shipped', status: 'posted' },
  ],
};
const m = nextMoves(full);
test(
  'creator: builds on the outlier first',
  m[0]?.kind === 'build',
  m.map((x) => x.kind)
);
test('outlier stat is the real multiple', m[0]?.stat?.value === 41 && m[0]?.stat?.suffix === '×');
test(
  'finish picks the drafting idea over a saved one',
  m.find((x) => x.kind === 'finish')?.id === 'finish-b'
);
test(
  'finish counts open ideas only (saved + drafting)',
  m.find((x) => x.kind === 'finish')?.stat?.value === 2
);
const fix = m.find((x) => x.kind === 'fix');
test('format move never pushes threads', !!fix && fix.id === 'fix-media', fix?.id);
test(
  'phase move uses the read’s own next move',
  m.find((x) => x.kind === 'phase')?.title === full.score!.nextMoves[0]
);
test(
  'every move has a link',
  m.every((x) => x.action.href.startsWith('/dashboard'))
);
test(
  'no hashtag advice in any move',
  m.every(
    (x) => !/#[a-z]{2,}/i.test(`${x.title} ${x.why}`) && !/hashtag/i.test(`${x.title} ${x.why}`)
  )
);
test(
  'write links carry the prompt, encoded',
  m[0].action.href.startsWith('/dashboard/write?prompt=A%20follow-up')
);

const f = nextMoves(full, 'founder', 'company');
test(
  'founder: finishing something comes first',
  f[0]?.kind === 'finish',
  f.map((x) => x.kind)
);
test(
  'founder for company: prompt says so',
  decodeURIComponent(f[0].action.href).includes('for my company')
);
test(
  'builder: prompt asks to show the work',
  decodeURIComponent(nextMoves(full, 'builder')[0].action.href).includes('what I built')
);

test(
  'format move needs a real lift (30%+)',
  !nextMoves({
    ...base,
    formats: [
      { format: 'text', label: 'Text only', rate: 2.0, share: 60, posts: 20 },
      { format: 'media', label: 'With media', rate: 2.2, share: 20, posts: 7 },
    ],
  }).some((x) => x.kind === 'fix')
);
test(
  'a small outlier (<5×) is not a move',
  !nextMoves({ ...base, outlier: { ...full.outlier!, multiple: 3 } }).length
);

console.log('day pick');
test('stable within a day', pickIndex(4, '2026-10-27') === pickIndex(4, '2026-10-27'));
test(
  'only the first two are today candidates',
  [...Array(30)].every((_, i) => pickIndex(4, `2026-10-${i + 1}`) < 2)
);
test('one move → index 0', pickIndex(1, '2026-10-27') === 0);

console.log('playbook: body of work');
{
  const now = new Date(Date.UTC(2026, 9, 27, 15));
  const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86_400_000);
  const w = bodyOfWork(
    {
      ideas: [
        { createdAt: d(1), status: 'saved' },
        { createdAt: d(2), status: 'drafting' },
        { createdAt: d(3), status: 'posted' },
        { createdAt: d(20), status: 'saved' },
        { createdAt: d(80), status: 'posted' }, // older than 8 weeks: ignored
      ],
      posts: [{ postedAt: d(0) }, { postedAt: d(10) }, { postedAt: d(400) }],
      reads: [
        { at: d(30), score: 68 },
        { at: d(4), score: 72 },
      ],
    },
    now
  );
  test('8 weeks, oldest first', w.length === 8 && w[0].start < w[7].start);
  test('this week counts today', w[7].ideas === 3 && w[7].posts === 1, w[7]);
  test('drafts = ideas taken to drafting or posted', w[7].drafts === 2);
  test(
    'ideas/posts outside the window are ignored',
    w.reduce((a, x) => a + x.ideas, 0) === 4 && w.reduce((a, x) => a + x.posts, 0) === 2
  );
  test('score carries forward from the last read', w[7].score === 72 && w[5].score === 68);
  test('no score before the first read', w[0].score === null);
  test('work line', workLine(w) === '4 ideas → 2 drafts → 2 posts · score 68 → 72', workLine(w));
  test(
    'work line is null with nothing yet',
    workLine(bodyOfWork({ ideas: [], posts: [], reads: [] }, now)) === null
  );
}

console.log('article mode: format switching');
test('?mode=article opens Article mode', roomFormat('article') === 'article');
test('?mode=thread opens Thread', roomFormat('thread') === 'thread');
test(
  'no or unknown mode is a Post',
  roomFormat(undefined) === 'x-post' &&
    roomFormat('essay') === 'x-post' &&
    roomFormat(['article']) === 'x-post'
);
test(
  'the copywriter accepts outline + article',
  isCopyFormat('outline') && isCopyFormat('article') && !isCopyFormat('essay')
);
test(
  'outline and section outputs are capped shorter than posts',
  COPY_MAX_TOKENS.outline < COPY_MAX_TOKENS['x-post'] &&
    COPY_MAX_TOKENS.article < COPY_MAX_TOKENS['x-post']
);

console.log('article mode: outline parsing');
{
  const o = parseOutline(`Title: What 40 brands told me
Hook: I asked 40 brands why they passed.
1. The 10-second scroll | brands decide before reading
2. **“We couldn’t tell”** — the common reason
3) Three pillars: beat thirty topics | what got picked
- Use #creatorEconomy for reach | growth
4. A 30-day test | run it`);
  test(
    'title and hook',
    o?.title === 'What 40 brands told me' && o?.hook === 'I asked 40 brands why they passed.'
  );
  test(
    'sections parsed (markdown, —, 3) all handled)',
    o?.sections.length === 4,
    o?.sections.map((s) => s.heading)
  );
  test(
    'heading | point split',
    o?.sections[0].heading === 'The 10-second scroll' &&
      o?.sections[0].point === 'brands decide before reading'
  );
  test(
    'em-dash split and bold/quotes stripped',
    o?.sections[1].heading === 'We couldn’t tell' && o?.sections[1].point === 'the common reason'
  );
  test(
    'hashtag lines are dropped',
    !o?.sections.some((s) => /#|hashtag/i.test(`${s.heading} ${s.point}`))
  );
  test('unique section ids', new Set(o?.sections.map((s) => s.id)).size === o?.sections.length);
  const many = parseOutline(
    `Title: T\n${[1, 2, 3, 4, 5, 6, 7].map((n) => `${n}. S${n}`).join('\n')}`
  );
  test('more than 5 sections are cut to 5', many?.sections.length === 5);
  test('no title → null', parseOutline('1. A\n2. B') === null);
  test('no sections → null', parseOutline('Title: T\nHook: H') === null);
  test('garbage → null', parseOutline('Sure! Here is an outline for you.') === null);
  test(
    'regenerated section line',
    parseSections('3. A sharper heading | the point')[0]?.heading === 'A sharper heading'
  );
  test(
    'regenerated title + hook',
    parseTitleHook('Title: New one\nHook: A new hook').title === 'New one'
  );
  const a = parseOutline('Title: T\n1. A\n2. B\n3. C')!;
  const moved = moveSection(a.sections, a.sections[0].id, 1);
  test('move down', moved.map((s) => s.heading).join('') === 'BAC');
  test('move past the end is a no-op', moveSection(a.sections, a.sections[2].id, 1) === a.sections);
  test(
    'outline as a board idea (capped)',
    outlineAsIdea(a).startsWith('Article: T\n1. A') &&
      outlineAsIdea({ ...a, title: 'x'.repeat(2000) }).length <= 1000
  );
  test(
    'a malformed saved draft reads as null',
    readArticle('{"sections":"nope"}') === null && readArticle('not json') === null
  );
  test('a saved draft round-trips', readArticle(JSON.stringify(a))?.sections.length === 3);
}

console.log('article mode: clipboard');
{
  const c = articleClipboard({
    title: 'Brands & <creators>',
    hook: 'The hook.',
    sections: [
      { id: '1', heading: 'One', point: '', body: 'First para.\n\nSecond "para".' },
      { id: '2', heading: 'Two', point: '', body: '' },
    ],
  });
  test(
    'rich text: title as h1, sections as h2',
    c.html.startsWith('<h1>Brands &amp; &lt;creators&gt;</h1>') &&
      c.html.includes('<h2>One</h2>') &&
      c.html.includes('<h2>Two</h2>')
  );
  test(
    'paragraphs become <p>, escaped',
    c.html.includes('<p>First para.</p>') && c.html.includes('<p>Second &quot;para&quot;.</p>')
  );
  test('no raw tags from the text survive', !c.html.includes('<creators>'));
  test(
    'plain-text fallback keeps the shape',
    c.text === 'Brands & <creators>\n\nThe hook.\n\nOne\n\nFirst para.\n\nSecond "para".\n\nTwo'
  );
  test(
    'word count covers hook + sections',
    articleWords({
      title: 'x',
      hook: 'two words',
      sections: [{ id: 'a', heading: 'h', point: '', body: 'three more words' }],
    }) === 5
  );
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
