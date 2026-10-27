/**
 * Remove hashtag advice from reads already stored (BrandOS never pitches
 * hashtag strategy; see src/lib/no-hashtag-advice.ts). New scans are filtered
 * at generation; this cleans the old ones so /@handle pages, the dashboard,
 * breakdown emails and the MCP stop showing it.
 *
 * Touches only strengths / improvements / next moves (list items about
 * hashtags are dropped) and the summary (sentences about hashtags are cut),
 * in "BrandScans" (legacy, JSON strings) and "BrandScan" (Phase 1, jsonb).
 *
 * Dry run by default (prints counts + a few examples). Writes only with --apply.
 *   npx tsx --env-file=<env> scripts/scrub-hashtag-advice.ts
 *   npx tsx --env-file=<env> scripts/scrub-hashtag-advice.ts --apply
 */
import { PrismaClient } from '@prisma/client';
import { dropHashtagAdvice, stripHashtagSentences } from '../src/lib/no-hashtag-advice';

const APPLY = process.argv.includes('--apply');
const prisma = new PrismaClient();

const LISTS = ['strengths', 'improvements', 'nextMoves'] as const;
type Lists = Record<(typeof LISTS)[number], unknown> & { summary: string | null };

function asList(v: unknown): unknown[] | null {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** The changed fields (as lists + summary), or null when nothing mentions hashtags. */
function scrub(row: Lists): Partial<Record<keyof Lists, unknown[] | string | null>> | null {
  const out: Partial<Record<keyof Lists, unknown[] | string | null>> = {};
  for (const k of LISTS) {
    const list = asList(row[k]);
    if (!list) continue;
    const kept = dropHashtagAdvice(list);
    if (kept.length !== list.length) out[k] = kept;
  }
  if (row.summary) {
    const s = stripHashtagSentences(row.summary);
    if (s !== row.summary) out.summary = s || null;
  }
  return Object.keys(out).length ? out : null;
}

const CANDIDATE = (cols: string[]) =>
  cols.map((c) => `${c}::text ILIKE '%hashtag%' OR ${c}::text ILIKE '%#%'`).join(' OR ');

async function main() {
  console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to write) ===');
  let examples = 0;
  const show = (where: string, before: unknown, after: unknown) => {
    if (examples++ < 5)
      console.log(
        `  ${where}\n    before: ${JSON.stringify(before)}\n    after:  ${JSON.stringify(after)}`
      );
  };

  // Legacy "BrandScans": JSON stored as text
  const legacyIds = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id::text AS id FROM "BrandScans" WHERE ${CANDIDATE(['strengths', 'improvements', 'next_moves', 'summary'])}`
  );
  let legacyChanged = 0;
  for (const { id } of legacyIds) {
    const row = await prisma.brandScans.findUnique({
      where: { id },
      select: {
        username: true,
        strengths: true,
        improvements: true,
        nextMoves: true,
        summary: true,
      },
    });
    if (!row) continue;
    const changes = scrub(row);
    if (!changes) continue;
    legacyChanged++;
    show(
      `BrandScans @${row.username}`,
      row.improvements ?? row.nextMoves,
      changes.improvements ?? changes.nextMoves ?? changes.summary
    );
    if (APPLY)
      await prisma.brandScans.update({
        where: { id },
        data: Object.fromEntries(
          Object.entries(changes).map(([k, v]) => [k, Array.isArray(v) ? JSON.stringify(v) : v])
        ),
      });
  }

  // Phase 1 "BrandScan": jsonb lists
  const scanIds = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id::text AS id FROM "BrandScan" WHERE ${CANDIDATE(['strengths', 'improvements', 'next_moves', 'summary'])}`
  );
  let scanChanged = 0;
  for (const { id } of scanIds) {
    const row = await prisma.brandScan.findUnique({
      where: { id },
      select: {
        xUsername: true,
        strengths: true,
        improvements: true,
        nextMoves: true,
        summary: true,
      },
    });
    if (!row) continue;
    const changes = scrub(row);
    if (!changes) continue;
    scanChanged++;
    show(
      `BrandScan @${row.xUsername}`,
      row.improvements ?? row.nextMoves,
      changes.improvements ?? changes.nextMoves ?? changes.summary
    );
    if (APPLY)
      await prisma.brandScan.update({ where: { id }, data: changes as Record<string, never> });
  }

  console.log(
    `\nBrandScans: ${legacyChanged} of ${legacyIds.length} candidates ${APPLY ? 'updated' : 'would change'}`
  );
  console.log(
    `BrandScan: ${scanChanged} of ${scanIds.length} candidates ${APPLY ? 'updated' : 'would change'}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
