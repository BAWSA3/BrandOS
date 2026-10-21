// Launch preflight: is this database ready for the code on `staging`?
// Read-only (the session is set read-only). Checks the tables, columns and enum
// names the new dashboard / title screen / XP / breakdown flow need, plus the
// email-list security lock. Exit code 1 if anything blocks a launch.
//
//   node --env-file=.env.prod.local scripts/launch-preflight.mjs   (prod)
//   node --env-file=.env.local      scripts/launch-preflight.mjs   (staging)
//
// Optional: PUBLISHABLE_KEY=sb_publishable_... also checks the anon lock via REST.

import pg from 'pg';

const url = process.env.POSTGRES_URL_NON_POOLING || process.env.DIRECT_URL;
if (!url) {
  console.error('No POSTGRES_URL_NON_POOLING / DIRECT_URL in env');
  process.exit(2);
}
const u = new URL(url);
for (const k of [...u.searchParams.keys()]) u.searchParams.delete(k);
const db = new pg.Client({ connectionString: u.toString(), ssl: { rejectUnauthorized: false } });
await db.connect();
await db.query('SET default_transaction_read_only = on');

/** [table, required columns, migration that creates it, blocks launch?] */
const TABLES = [
  ['User', ['id', 'xUsername', 'role'], 'baseline', true],
  ['Workspace', ['id', 'type'], '004', true],
  ['PlatformConnection', ['id', 'platform', 'platformUsername'], '004', true],
  [
    'BrandScan',
    [
      'id',
      'user_id',
      'workspace_id',
      'platform_connection_id',
      'score',
      'phase_scores',
      'insights',
      'scanned_at',
      'status',
    ],
    '004',
    true,
  ],
  [
    'BrandScans',
    ['id', 'username', 'score', 'phase_scores', 'summary', 'created_at'],
    'legacy',
    true,
  ],
  ['EmailSignup', ['email', 'reservedAt', 'reservationNumber', 'unsubscribed'], '018/019', true],
  ['EmailSend', ['emailSignupId', 'campaign'], '020', true],
  ['user_profiles', ['username', 'current_score'], '016', true],
  ['Station', ['handle', 'ownerUserId', 'reservationNumber'], '026', true],
  ['StationNote', ['stationId', 'authorUserId', 'body'], '027', true],
  ['NoteReport', ['noteId', 'reporterUserId'], '027', true],
  ['XPEvent', ['userId', 'kind', 'xp', 'dedupeKey'], '029', true],
  ['UserProgress', ['userId', 'xpTotal', 'currentStreakDays', 'lastVisitAt'], '029', true],
  ['ApiUsageLog', ['apiKeyId', 'endpoint'], '032 (optional)', false],
  ['PostScore', ['userId', 'tweetId', 'postedAt'], '033', true],
  ['McpUsage', ['userId', 'tool', 'createdAt'], '034', true],
  ['Idea', ['userId', 'suggestion', 'title'], '035', true],
  ['UserPreference', ['userId', 'dashboardColorway'], '036 (falls back to Bone)', false],
];
const ENUMS = [
  'plan_tier',
  'workspace_type',
  'workspace_role',
  'connected_account_status',
  'scan_visibility',
  'scan_status',
  'audit_event_category',
  'user_role',
  'migration_status',
];

let blockers = 0;
let warnings = 0;
const line = (ok, msg, blocking = true) => {
  if (!ok) blocking ? blockers++ : warnings++;
  console.log(`${ok ? '  ✓' : blocking ? '  ✗' : '  !'} ${msg}`);
};

console.log(`Launch preflight → ${u.hostname}\n\nTables`);
const cols = (
  await db.query(
    `select table_name t, column_name c from information_schema.columns where table_schema='public'`
  )
).rows;
const have = new Map();
for (const { t, c } of cols) (have.get(t) ?? have.set(t, new Set()).get(t)).add(c);
for (const [t, need, mig, blocking] of TABLES) {
  const set = have.get(t);
  if (!set) {
    line(false, `${t} missing → apply migration ${mig}`, blocking);
    continue;
  }
  const missing = need.filter((c) => !set.has(c));
  line(
    !missing.length,
    missing.length ? `${t} missing columns ${missing.join(', ')} → migration ${mig}` : t,
    blocking
  );
}

console.log('\nEnum type names (Prisma @@map)');
const enums = new Set(
  (
    await db.query(
      `select t.typname from pg_type t join pg_namespace n on n.oid=t.typnamespace where t.typtype='e' and n.nspname='public'`
    )
  ).rows.map((r) => r.typname)
);
const missingEnums = ENUMS.filter((e) => !enums.has(e));
line(
  !missingEnums.length,
  missingEnums.length ? `missing ${missingEnums.join(', ')} → migration 030` : 'all 9 present'
);

console.log('\nSecurity lock (migration 031)');
const pol = (
  await db.query(
    `select tablename, policyname from pg_policies where schemaname='public' and tablename in ('EmailSignup','BrandScans')`
  )
).rows.map((r) => `${r.tablename}.${r.policyname}`);
line(
  !pol.includes('EmailSignup.Allow service role to read'),
  'EmailSignup has no open read policy'
);
line(
  !pol.includes('EmailSignup.email_signup_insert_limited'),
  'EmailSignup has no anon insert policy'
);
line(!pol.includes('BrandScans.Allow anonymous inserts'), 'BrandScans has no anon insert policy');
const grants = (
  await db.query(
    `select has_table_privilege('anon','public."EmailSignup"','select') s, has_table_privilege('anon','public."BrandScans"','insert') i`
  )
).rows[0];
line(!grants.s, 'anon has no SELECT grant on EmailSignup');
line(!grants.i, 'anon has no INSERT grant on BrandScans');

const key = process.env.PUBLISHABLE_KEY;
const restUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (key && restUrl) {
  const r = await fetch(`${restUrl}/rest/v1/EmailSignup?select=id&limit=1`, {
    headers: { apikey: key },
  });
  line(r.status === 401 || r.status === 403, `REST: anon read of EmailSignup → ${r.status}`);
}

await db.end();
console.log(
  `\n${blockers ? `✗ ${blockers} blocker(s)` : '✓ ready'}${warnings ? `, ${warnings} warning(s)` : ''}`
);
process.exit(blockers ? 1 : 0);
