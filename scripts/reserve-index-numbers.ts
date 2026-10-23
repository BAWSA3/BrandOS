/**
 * One-time (re-runnable) import: reserve Creator Index numbers for the email
 * list (migration 045). Rules in src/lib/index-reservations.ts:
 *   @jbawsa = No. 0000 · station reservations keep 1-28 · everyone else with an
 *   X handle from 29 in signup order · then account holders not on the list.
 *
 * DRY RUN BY DEFAULT (read-only transaction): prints counts, the kept station
 * numbers, the first/last assignments and any conflicts. --apply writes, in one
 * transaction, then moves "IndexEntry_number_seq" above every number. Re-running
 * adds only new signups and never renumbers an existing reservation.
 *
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/reserve-index-numbers.ts
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/reserve-index-numbers.ts --apply
 *
 * Needs 044 + 045 applied. Doesn't call X or send anything.
 */
import prisma from '@/lib/db';
import { formatNumber } from '@/lib/index-rules';
import {
  planReservations,
  RESERVATION_RELEASE_AT,
  type PlannedReservation,
} from '@/lib/index-reservations';

const APPLY = process.argv.includes('--apply');

async function main() {
  const host = (process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '')
    .replace(/^.*@/, '')
    .replace(/[:/].*$/, '');
  console.log(`DB host: ${host}  |  mode: ${APPLY ? 'APPLY' : 'dry run (read-only)'}`);

  const [signups, users, existing, entries] = await Promise.all([
    prisma.emailSignup.findMany({
      select: {
        id: true,
        xUsername: true,
        createdAt: true,
        source: true,
        unsubscribed: true,
        reservationNumber: true,
      },
    }),
    prisma.user.findMany({
      select: {
        createdAt: true,
        xUsername: true,
        platformConnections: { where: { platform: 'x' }, select: { platformUsername: true } },
      },
    }),
    prisma.indexReservation.findMany({ select: { handle: true, number: true } }).catch((e) => {
      // before 045 the table is missing: a dry run still shows the plan
      if (APPLY) throw e;
      console.warn('(IndexReservation table not found: migration 045 not applied yet)');
      return [] as { handle: string; number: number }[];
    }),
    prisma.indexEntry.findMany({ select: { handle: true, number: true, userId: true } }),
  ]);

  const plan = planReservations({
    signups,
    accounts: users.map((u) => ({
      handle: u.platformConnections[0]?.platformUsername ?? u.xUsername ?? null,
      createdAt: u.createdAt,
    })),
    existing,
    entries,
  });

  const by = (src: string) => plan.reservations.filter((r) => r.source === src);
  const show = (r: PlannedReservation) =>
    `  ${formatNumber(r.number)}  @${r.handle}  (${r.source})`;
  console.log(
    `\nsignups: ${signups.length} | accounts: ${users.length} | already reserved: ${existing.length} | Index members: ${entries.length}`
  );
  console.log('skipped:', plan.skipped);
  console.log(
    `new reservations: ${plan.reservations.length} (founder ${by('founder').length}, station ${by('station').length}, email ${by('email').length}, account ${by('account').length})`
  );
  const station = by('station').sort((a, b) => a.number - b.number);
  if (station.length) {
    console.log(`\nstation numbers kept (${station.length}):`);
    station.forEach((r) => console.log(show(r)));
  }
  const ordered = [...plan.reservations].sort((a, b) => a.number - b.number);
  console.log('\nfirst 10:');
  ordered.slice(0, 10).forEach((r) => console.log(show(r)));
  if (ordered.length > 10) {
    console.log('last 10:');
    ordered.slice(-10).forEach((r) => console.log(show(r)));
  }
  if (plan.claimMoves.length) {
    console.log('\nmembers moving to their reserved number:');
    plan.claimMoves.forEach((m) =>
      console.log(`  @${m.handle}: ${formatNumber(m.from)} → ${formatNumber(m.to)}`)
    );
  }
  if (plan.bumps.length) {
    console.log("\nmembers on someone else's reserved number (moved first):");
    plan.bumps.forEach((m) =>
      console.log(`  @${m.handle}: ${formatNumber(m.from)} → ${formatNumber(m.to)}`)
    );
  }
  console.log(
    plan.conflicts.length ? `\nconflicts:\n  ${plan.conflicts.join('\n  ')}` : '\nconflicts: none'
  );
  console.log(`highest number after import: ${plan.maxNumber}`);

  if (!APPLY) {
    console.log('\ndry run: nothing written. Add --apply to write.');
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      // 1. members sitting on someone else's reserved number move to a fresh one
      for (const b of plan.bumps)
        await tx.indexEntry.update({ where: { userId: b.userId }, data: { number: b.to } });
      // 2. the reservations (skip any handle or number that appeared meanwhile)
      await tx.indexReservation.createMany({
        data: plan.reservations.map((r) => ({
          handle: r.handle,
          number: r.number,
          source: r.source,
          emailSignupId: r.emailSignupId,
          releaseAt: RESERVATION_RELEASE_AT,
        })),
        skipDuplicates: true,
      });
      // 3. members who already joined take their reserved number, claimed now
      for (const m of plan.claimMoves) {
        await tx.indexEntry.update({ where: { userId: m.userId }, data: { number: m.to } });
        await tx.indexReservation.update({
          where: { handle: m.handle },
          data: { claimedAt: new Date(), claimedByUserId: m.userId },
        });
      }
      // members who joined with their reserved number already: mark claimed
      for (const e of entries)
        await tx.indexReservation.updateMany({
          where: { handle: e.handle, claimedAt: null },
          data: { claimedAt: new Date(), claimedByUserId: e.userId },
        });
      // 4. future joins start above every number in use
      await tx.$executeRaw`select setval('"IndexEntry_number_seq"', greatest(
        (select coalesce(max("number"), 0) from "IndexReservation"),
        (select coalesce(max("number"), 0) from "IndexEntry"),
        1))`;
    },
    { timeout: 60_000 }
  );
  const [reserved, claimed] = await Promise.all([
    prisma.indexReservation.count(),
    prisma.indexReservation.count({ where: { NOT: { claimedAt: null } } }),
  ]);
  console.log(`\napplied: ${reserved} reservations (${claimed} claimed). Sequence moved.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
