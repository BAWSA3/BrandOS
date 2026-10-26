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
  indexAllowlist,
  indexEnabled,
  indexOpenFor,
  MAX_NICHES,
  NICHES,
  parseFilters,
  parseJoin,
  standsOut,
  viewDay,
} from '../src/lib/index-rules';
import { decodeUtm, encodeUtm, utmFromSearch } from '../src/lib/utm';
import { readFileSync } from 'fs';
import { CLASSES, classify, classLabel, recordDate } from '../src/lib/classifications';
import {
  cleanSignupHandle,
  planReservations,
  reservedNumberFor,
  scannedLabel,
  type SignupRow,
} from '../src/lib/index-reservations';

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

  console.log('A2. Private beta (INDEX_ALLOWLIST)');
  const savedAllow = process.env.INDEX_ALLOWLIST;
  const savedFlag = process.env.INDEX_ENABLED;
  delete process.env.INDEX_ENABLED;
  process.env.INDEX_ALLOWLIST = ' @JBawsa, sample_founder ,not a handle,  ';
  const xs = (h: string) => ({
    role: 'user',
    platformConnections: [{ platform: 'x', platformUsername: h }],
  });
  test(
    'list is parsed lowercase, @ and junk dropped',
    [...indexAllowlist()].join(',') === 'jbawsa,sample_founder'
  );
  test('allowlisted X handle gets in (any case)', indexOpenFor(xs('JBAWSA')));
  test('allowlisted via xUsername', indexOpenFor({ role: 'user', xUsername: 'sample_founder' }));
  test('a handle not on the list stays out', !indexOpenFor(xs('someone_else')));
  test(
    'a non-X connection with the same name stays out',
    !indexOpenFor({
      role: 'user',
      platformConnections: [{ platform: 'linkedin', platformUsername: 'jbawsa' }],
    })
  );
  test('signed-out visitors still get 404 in beta', !indexOpenFor(null));
  process.env.INDEX_ALLOWLIST = '';
  test('empty list → closed', !indexOpenFor(xs('jbawsa')));
  if (savedAllow === undefined) delete process.env.INDEX_ALLOWLIST;
  else process.env.INDEX_ALLOWLIST = savedAllow;
  if (savedFlag === undefined) delete process.env.INDEX_ENABLED;
  else process.env.INDEX_ENABLED = savedFlag;

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

  console.log('E2. First-touch UTMs');
  const utm = utmFromSearch(
    new URLSearchParams('utm_source=X&utm_campaign=index-launch&utm_medium=<b>')
  );
  test(
    'utm_source + campaign kept, bad medium dropped',
    !!utm && utm.utm_source === 'x' && utm.utm_campaign === 'index-launch' && !utm.utm_medium
  );
  test(
    'no utm_source → nothing stored',
    utmFromSearch(new URLSearchParams('utm_campaign=x')) === null
  );
  test(
    'cookie round-trips',
    utm !== null && decodeUtm(encodeUtm(utm)).utm_campaign === 'index-launch'
  );
  test(
    'a tampered cookie is re-validated',
    JSON.stringify(
      decodeUtm(encodeURIComponent('{"utm_source":"<script>","utm_campaign":"ok"}'))
    ) === '{"utm_campaign":"ok"}'
  );
  test('garbage cookie → {}', JSON.stringify(decodeUtm('%%%')) === '{}');

  console.log('F. View dedupe (one per viewer per member per UTC day)');
  test(
    'same UTC day',
    viewDay(new Date('2026-11-02T00:00:01Z')) === viewDay(new Date('2026-11-02T23:59:59Z'))
  );
  test(
    'next UTC day differs',
    viewDay(new Date('2026-11-02T23:59:59Z')) !== viewDay(new Date('2026-11-03T00:00:00Z'))
  );

  console.log("\nK. Classifications (the institution's codes)");
  test(
    'eight classes, numbered 1-8',
    CLASSES.length === 8 && CLASSES.every((c, i) => c.number === i + 1)
  );
  test('BUILD.EXE is Class 03', classLabel('BUILD.EXE') === 'CLASS 03 · BUILD.EXE');
  test('VCR text uses "/" (no "·" glyph)', classLabel('ARC', '/') === 'CLASS 04 / ARC');
  test('any casing works', classify('build.exe')?.number === 3);
  test('legacy SIGNAL_SAGE reads as Class 01 SOURCE', classify('SIGNAL_SAGE')?.code === 'SOURCE');
  test('legacy "The Builder" reads as BUILD.EXE', classify('The Builder')?.code === 'BUILD.EXE');
  test('emoji prefixes are ignored', classify('🐕 ARC')?.code === 'ARC');
  test('unknown names are Unclassified', classLabel('The Prophet') === 'UNCLASSIFIED');
  test(
    'null/empty are Unclassified',
    classLabel(null) === 'UNCLASSIFIED' && classLabel('') === 'UNCLASSIFIED'
  );
  test(
    'record dates read "23 OCT 2026" (UTC)',
    recordDate('2026-10-23T23:30:00Z') === '23 OCT 2026'
  );
  test('a bad date is empty, not "NaN"', recordDate('nope') === '');

  console.log('\nR. Reserved numbers (migration 045)');
  {
    const d = (n: number) => new Date(Date.UTC(2026, 2, 1) + n * 3_600_000);
    const su = (
      id: string,
      h: string | null,
      n: number,
      extra: Partial<SignupRow> = {}
    ): SignupRow => ({
      id,
      xUsername: h,
      createdAt: d(n),
      source: 'landing',
      unsubscribed: false,
      reservationNumber: null,
      ...extra,
    });
    const stations = Array.from({ length: 28 }, (_, i) =>
      su(`st${i + 1}`, `station${i + 1}`, 100 + i, { reservationNumber: i + 1 })
    );
    const signups = [
      su('e1', '@Early_One', 1),
      su('e2', 'https://x.com/second_guy?s=21', 2),
      su('dup', 'early_one', 3), // same handle later: dropped
      su('t1', 'tester', 4, { source: 'test' }),
      su('t2', 'clitester', 5, { source: 'cli-test' }),
      su('u1', 'gone', 6, { unsubscribed: true }),
      su('n1', 'not a handle!', 7),
      su('jb', 'jbawsa', 8),
      ...stations,
      su('st5b', 'station5', 300), // a later duplicate of a station holder
    ];
    const plan = planReservations({
      signups,
      accounts: [
        { handle: 'acct_only', createdAt: d(500) },
        { handle: 'early_one', createdAt: d(0) },
      ],
      existing: [],
      entries: [],
    });
    const num = (h: string) => plan.reservations.find((r) => r.handle === h)?.number;
    test('founder @jbawsa is No. 0000', num('jbawsa') === 0);
    test(
      'the 28 station numbers are kept exactly',
      stations.every((s, i) => num(`station${i + 1}`) === i + 1)
    );
    test('the first email signup gets No. 0029', num('early_one') === 29);
    test('signup order continues (URL handle cleaned)', num('second_guy') === 30);
    test('accounts not on the list come after the list', num('acct_only') === 31);
    test(
      'an account already on the list is not reserved twice',
      plan.reservations.filter((r) => r.handle === 'early_one').length === 1
    );
    test(
      'test sources, unsubscribed and unusable handles are skipped',
      !num('tester') &&
        !num('clitester') &&
        !num('gone') &&
        plan.skipped.excludedSource === 2 &&
        plan.skipped.unsubscribed === 1 &&
        plan.skipped.noHandle === 1
    );
    test('duplicates keep one reservation', plan.skipped.duplicate === 2);
    test('no conflicts on a clean list', plan.conflicts.length === 0);

    const again = planReservations({
      signups: [...signups, su('late', 'late_comer', 900)],
      accounts: [],
      existing: plan.reservations.map((r) => ({ handle: r.handle, number: r.number })),
      entries: [],
    });
    test(
      're-running never renumbers (only the new signup is added)',
      again.reservations.length === 1
    );
    test('a later signup gets the next free number', again.reservations[0]?.number === 32);

    const withMembers = planReservations({
      signups,
      accounts: [],
      existing: [],
      entries: [
        { handle: 'jbawsa', number: 1, userId: 'u-jb' }, // joined before the import
        { handle: 'stranger', number: 5, userId: 'u-st' }, // sits on station No. 5
      ],
    });
    test(
      'a member who joined first moves to their reserved number',
      withMembers.claimMoves.some((m) => m.handle === 'jbawsa' && m.from === 1 && m.to === 0)
    );
    const bump = withMembers.bumps.find((b) => b.handle === 'stranger');
    test(
      "a member on someone else's reserved number is moved above every reservation",
      !!bump &&
        bump.from === 5 &&
        bump.to > Math.max(...withMembers.reservations.map((r) => r.number))
    );
    test('the sequence floor covers every number', withMembers.maxNumber >= (bump?.to ?? 0));

    test(
      'claim keeps the reserved number',
      reservedNumberFor({ number: 137, claimedByUserId: null }, 'me') === 137
    );
    test(
      're-claim by the same account keeps it',
      reservedNumberFor({ number: 137, claimedByUserId: 'me' }, 'me') === 137
    );
    test(
      'a number claimed by another account is not handed out again',
      reservedNumberFor({ number: 137, claimedByUserId: 'other' }, 'me') === null
    );
    test('no reservation → next free number', reservedNumberFor(null, 'me') === null);
    test('No. 0000 formats', formatNumber(0) === 'No. 0000');
    test('scanned label rounds down', scannedLabel(4732) === '4,700+' && scannedLabel(40) === null);
    test(
      'handles from free text',
      cleanSignupHandle('@Foo') === 'foo' &&
        cleanSignupHandle('twitter.com/Bar_1') === 'bar_1' &&
        cleanSignupHandle('two words') === null
    );

    // no enumeration: the only reservation lookups the app makes are for the
    // signed-in account's own X handle (ownReservation), never a request value
    const src = (f: string) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
    const routes = [
      'src/app/api/index/status/route.ts',
      'src/app/creators/page.tsx',
      'src/app/creators/join/page.tsx',
    ];
    test(
      'reservations are only looked up for the signed-in account',
      routes.every((f) => !/findReservation\(/.test(src(f))) &&
        routes.every((f) => !/ownReservation\((?!user\))/.test(src(f)))
    );
  }

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

        const has045 = await tx.$queryRaw<
          { ok: boolean }[]
        >`select to_regclass('public."IndexReservation"') is not null as ok`;
        if (!has045[0]?.ok)
          console.log('  · reservation checks skipped: migration 045 not applied here');
        else {
          const n = 998_000 + (Date.now() % 900);
          await tx.indexReservation.create({
            data: { handle: `${stamp}r`.slice(0, 15), number: n, source: 'email' },
          });
          const dupe = await tx.$queryRaw<{ ok: boolean }[]>`
            select exists(select 1 from "IndexReservation" where "number" = ${n}) as ok`;
          test('a reserved number is stored', !!dupe[0]?.ok);
          let blocked = false;
          await tx.$executeRaw`savepoint dup`;
          try {
            await tx.indexReservation.create({
              data: { handle: `${stamp}s`.slice(0, 15), number: n, source: 'email' },
            });
          } catch {
            blocked = true;
          }
          await tx.$executeRaw`rollback to savepoint dup`;
          test('two reservations can never share a number', blocked);
          // Once the founder holds No. 0000 (after the import), 0 is taken, so the
          // existing row is the proof; otherwise move the test entry onto it.
          const zeroTaken = await tx.$queryRaw<{ ok: boolean }[]>`
            select exists(select 1 from "IndexEntry" where "number" = 0) as ok`;
          let zeroOk = !!zeroTaken[0]?.ok;
          if (!zeroOk) {
            await tx.$executeRaw`savepoint zero`;
            try {
              await tx.indexEntry.update({ where: { id: entry.id }, data: { number: 0 } });
              zeroOk = true;
            } catch {
              zeroOk = false;
            }
            await tx.$executeRaw`rollback to savepoint zero`;
          }
          test('No. 0000 is a valid Index number', zeroOk);
        }
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
