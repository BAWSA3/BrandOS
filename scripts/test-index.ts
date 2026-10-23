/**
 * The BrandOS Creator Index (src/lib/index-rules.ts, src/lib/creator-index.ts).
 *   npm run test:index
 * Pure checks always run. With DIRECT_URL set and migration 044 applied, it
 * also checks view dedupe against the database inside a transaction that is
 * always rolled back (explicit numbers, so the Index number sequence isn't used).
 */
import {
  BLURB_MAX,
  cleanBlurb,
  formatNumber,
  indexEnabled,
  indexOpenFor,
  MAX_NICHES,
  NICHES,
  parseFilters,
  parseJoin,
  standsOut,
  viewDay,
} from '../src/lib/index-rules';

let pass = 0;
let fail = 0;
function test(name: string, ok: boolean) {
  if (ok) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}`);
  }
}

async function main() {
  console.log('A. Flag gating (INDEX_ENABLED)');
  const saved = process.env.INDEX_ENABLED;
  delete process.env.INDEX_ENABLED;
  test('closed when unset', !indexEnabled());
  test('closed for a signed-out visitor', !indexOpenFor(null));
  test('closed for a normal user', !indexOpenFor({ role: 'user' }));
  test('admins can preview while closed', indexOpenFor({ role: 'admin' }));
  for (const v of ['1', 'TRUE', 'yes', 'true ']) {
    process.env.INDEX_ENABLED = v;
    test(`"${v}" does not open it`, !indexEnabled());
  }
  process.env.INDEX_ENABLED = 'true';
  test('"true" opens it for everyone', indexEnabled() && indexOpenFor(null));
  if (saved === undefined) delete process.env.INDEX_ENABLED;
  else process.env.INDEX_ENABLED = saved;

  console.log('B. Join validation');
  const ok = parseJoin({ niches: ['DeFi', 'AI'], blurb: '  I break down DeFi launches.  ' });
  test('valid input passes', ok.ok && ok.value.blurb === 'I break down DeFi launches.');
  test('needs a niche', !parseJoin({ niches: [], blurb: 'x' }).ok);
  test(`at most ${MAX_NICHES} niches`, !parseJoin({ niches: NICHES.slice(0, 4), blurb: 'x' }).ok);
  test('niches must come from the list', !parseJoin({ niches: ['DeFi', 'Casino'], blurb: 'x' }).ok);
  test('non-string niches are rejected', !parseJoin({ niches: ['DeFi', 7], blurb: 'x' }).ok);
  const dup = parseJoin({ niches: ['AI', 'AI'], blurb: 'x' });
  test('duplicate niches are rejected (not silently merged past the limit)', !dup.ok);
  test('blurb must be text', !parseJoin({ niches: ['AI'], blurb: 42 }).ok);
  test('empty blurb is rejected', !parseJoin({ niches: ['AI'], blurb: '   ' }).ok);
  test(
    `blurb over ${BLURB_MAX} is rejected`,
    !parseJoin({ niches: ['AI'], blurb: 'a'.repeat(BLURB_MAX + 1) }).ok
  );
  test(
    `blurb of exactly ${BLURB_MAX} passes`,
    parseJoin({ niches: ['AI'], blurb: 'a'.repeat(BLURB_MAX) }).ok
  );
  test(
    'line breaks and control chars become spaces',
    cleanBlurb('one\nline\u0000here\u2028x') === 'one line here x'
  );
  test('missing body fails cleanly', !parseJoin(null).ok && !parseJoin('nope').ok);

  console.log('C. Numbers');
  test('No. 0001', formatNumber(1) === 'No. 0001');
  test('No. 0042', formatNumber(42) === 'No. 0042');
  test('past 9999 still prints', formatNumber(12345) === 'No. 12345');

  console.log('D. Who stands out (a paid card, not open access)');
  test(
    'admin',
    standsOut({ role: 'admin', subscriptionTier: 'FREE', subscriptionStatus: 'ACTIVE' })
  );
  test('Pro active', standsOut({ subscriptionTier: 'PRO', subscriptionStatus: 'ACTIVE' }));
  test(
    'founding card (trialing)',
    standsOut({ subscriptionTier: 'PRO', subscriptionStatus: 'TRIALING' })
  );
  test('free does not', !standsOut({ subscriptionTier: 'FREE', subscriptionStatus: 'ACTIVE' }));
  test(
    'past due does not',
    !standsOut({ subscriptionTier: 'PRO', subscriptionStatus: 'PAST_DUE' })
  );
  test(
    'canceled does not',
    !standsOut({ subscriptionTier: 'PRO', subscriptionStatus: 'CANCELED' })
  );

  console.log('E. Filters from the URL');
  const f = parseFilters({ niche: 'AI', archetype: 'BUILD.EXE', min: '90', max: '60', page: '3' });
  test('known niche kept', f.niche === 'AI');
  test('archetype kept', f.archetype === 'BUILD.EXE');
  test('min/max swapped into order', f.min === 60 && f.max === 90);
  test('page kept', f.page === 3);
  const bad = parseFilters({
    niche: 'Casino',
    archetype: '<script>',
    min: '-5',
    max: '500',
    page: 'x',
  });
  test('unknown niche dropped', bad.niche === null);
  test('odd archetype dropped', bad.archetype === null);
  test('scores clamped to 0–100', bad.min === 0 && bad.max === 100);
  test('bad page → 1', bad.page === 1);

  console.log('F. View dedupe (one per viewer per member per UTC day)');
  test(
    'same UTC day',
    viewDay(new Date('2026-11-02T00:00:01Z')) === viewDay(new Date('2026-11-02T23:59:59Z'))
  );
  test(
    'next UTC day differs',
    viewDay(new Date('2026-11-02T23:59:59Z')) !== viewDay(new Date('2026-11-03T00:00:00Z'))
  );

  if (process.env.DIRECT_URL) {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } } });
    const ROLLBACK = new Error('rollback');
    try {
      await prisma.$transaction(async (tx) => {
        const has = await tx.$queryRaw<
          { ok: boolean }[]
        >`select to_regclass('public."IndexView"') is not null as ok`;
        if (!has[0]?.ok) {
          console.log('  · skipped: migration 044 not applied here');
          throw ROLLBACK;
        }
        const stamp = `idxtest${Date.now()}`;
        const [a, b] = await Promise.all(
          ['a', 'b'].map((s) =>
            tx.user.create({ data: { supabaseId: `${stamp}-${s}` }, select: { id: true } })
          )
        );
        const entry = await tx.indexEntry.create({
          data: {
            userId: a.id,
            number: 999_000 + (Date.now() % 900),
            handle: stamp.slice(0, 15),
            displayHandle: stamp.slice(0, 15),
          },
        });
        const day = new Date(`${viewDay(new Date())}T00:00:00.000Z`);
        const row = { entryId: entry.id, viewerUserId: b.id, day };
        const first = await tx.indexView.createMany({ data: [row], skipDuplicates: true });
        const again = await tx.indexView.createMany({ data: [row], skipDuplicates: true });
        const nextDay = await tx.indexView.createMany({
          data: [{ ...row, day: new Date(day.getTime() + 86_400_000) }],
          skipDuplicates: true,
        });
        test('first view counts', first.count === 1);
        test('second view the same day is ignored', again.count === 0);
        test('a view the next day counts', nextDay.count === 1);
        throw ROLLBACK;
      });
    } catch (e) {
      if (e !== ROLLBACK) {
        fail++;
        console.log(`  ✗ database check failed: ${e instanceof Error ? e.message : e}`);
      }
    } finally {
      await prisma.$disconnect();
    }
  } else {
    console.log('  · database check skipped (no DIRECT_URL)');
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) process.exit(1);
}

main();
