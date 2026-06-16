/**
 * Backfill BrandScans from user_profiles
 *
 * Recovers scan records lost between Mar 17–25, 2026 when
 * RLS policies on BrandScans blocked anonymous inserts.
 *
 * Source: user_profiles table (scores array + archetype JSON)
 * Target: BrandScans table
 *
 * Usage: npx tsx scripts/backfill-scans.ts [--dry-run]
 */

const { Client } = require('pg');

const DRY_RUN = process.argv.includes('--dry-run');
const GAP_START = new Date('2026-03-17T12:00:00Z').getTime();

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('Missing DATABASE_URL env var');
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== BACKFILL START ===');

  // Fetch all profiles scanned during the gap period
  const { rows: profiles } = await client.query(
    'SELECT username, archetype, scores, last_scanned_at FROM user_profiles WHERE last_scanned_at > $1',
    [GAP_START]
  );

  console.log(`Found ${profiles.length} profiles to backfill from\n`);

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const profile of profiles) {
    // Parse archetype
    let archetype = 'unknown';
    try {
      const arch = typeof profile.archetype === 'string'
        ? JSON.parse(profile.archetype)
        : profile.archetype;
      archetype = arch?.primary || 'unknown';
    } catch {
      // keep 'unknown'
    }

    // Parse scores array — each entry is an individual scan
    let scores: { value: number; scannedAt: number }[] = [];
    try {
      const raw = typeof profile.scores === 'string'
        ? JSON.parse(profile.scores)
        : profile.scores;
      if (Array.isArray(raw)) scores = raw;
    } catch {
      // If scores can't be parsed, use current_score + last_scanned_at
      scores = [{
        value: 50,
        scannedAt: Number(profile.last_scanned_at),
      }];
    }

    // Only backfill scans that happened during the gap
    const gapScans = scores.filter(s => s.scannedAt >= GAP_START);

    for (const scan of gapScans) {
      const created_at = new Date(scan.scannedAt).toISOString();

      if (DRY_RUN) {
        console.log(`  [DRY] ${profile.username} | score: ${scan.value} | ${archetype} | ${created_at}`);
        inserted++;
        continue;
      }

      try {
        await client.query(
          `INSERT INTO "BrandScans" (username, score, archetype, enhanced, created_at)
           VALUES ($1, $2, $3, false, $4)`,
          [profile.username, scan.value, archetype, created_at]
        );
        inserted++;
      } catch (err: any) {
        errors.push(`${profile.username}: ${err.message}`);
        skipped++;
      }
    }
  }

  console.log(`\n=== RESULTS ===`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped/errors: ${skipped}`);
  if (errors.length > 0) {
    console.log(`\nErrors:`);
    errors.forEach(e => console.log(`  ${e}`));
  }

  // Verify
  if (!DRY_RUN) {
    const { rows } = await client.query('SELECT count(*) AS total, count(DISTINCT username) AS unique_users FROM "BrandScans"');
    console.log(`\nPost-backfill totals: ${rows[0].total} scans, ${rows[0].unique_users} unique users`);
  }

  await client.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
