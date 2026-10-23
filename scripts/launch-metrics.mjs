// Launch funnel numbers (docs/LAUNCH-PLAYBOOK.md, docs/GTM-OPERATING-PLAN.md):
// scans by day (last 14 days), signups, Creator Index members, members who
// left, founding cards added, founding seats left. Read-only (the session is
// set read-only). Works before migration 044 (Index rows show "not applied").
//
//   node --env-file=.env.prod.local scripts/launch-metrics.mjs   (prod)
//   node --env-file=<staging env>   scripts/launch-metrics.mjs   (staging)

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

const FOUNDING_SPOTS = 100; // src/lib/plans.ts
const PAID = `('PRO','AGENCY','ENTERPRISE')`;

const exists = async (table) =>
  (await db.query(`select to_regclass($1) is not null as ok`, [`public."${table}"`])).rows[0].ok;
const one = async (sql) => Number((await db.query(sql)).rows[0]?.n ?? 0);
const pad = (s, n) => String(s).padEnd(n);

console.log(
  `BrandOS launch metrics · ${(u.username.split('.')[1] ?? u.hostname).slice(0, 8)} · ${new Date().toISOString().slice(0, 16)}Z\n`
);

// ── Scans by day (homepage scans + account scans), last 14 days ──────────────
const days = await db.query(`
  with d as (select generate_series((now() at time zone 'utc')::date - 13, (now() at time zone 'utc')::date, '1 day')::date as day)
  select d.day,
    (select count(*) from "BrandScans" s where (s.created_at at time zone 'utc')::date = d.day) as public_scans,
    (select count(distinct lower(s.username)) from "BrandScans" s where (s.created_at at time zone 'utc')::date = d.day) as handles,
    (select count(*) from "BrandScan" b where (b.scanned_at at time zone 'utc')::date = d.day) as account_scans,
    (select count(*) from "User" x where (x."createdAt" at time zone 'utc')::date = d.day) as signups
  from d order by d.day`);
console.log('Day          scans  handles  account  signups');
let tot = { s: 0, h: 0, a: 0, u: 0 };
for (const r of days.rows) {
  const day = r.day.toISOString().slice(0, 10);
  console.log(
    `${pad(day, 12)} ${pad(r.public_scans, 6)} ${pad(r.handles, 8)} ${pad(r.account_scans, 8)} ${r.signups}`
  );
  tot = {
    s: tot.s + +r.public_scans,
    h: tot.h + +r.handles,
    a: tot.a + +r.account_scans,
    u: tot.u + +r.signups,
  };
}
console.log(`${pad('14 days', 12)} ${pad(tot.s, 6)} ${pad(tot.h, 8)} ${pad(tot.a, 8)} ${tot.u}\n`);

// ── Accounts ───────────────────────────────────────────────────────────────
const users = await one(`select count(*) n from "User"`);
const withX = await one(
  `select count(distinct "userId") n from "PlatformConnection" where platform = 'x' and status = 'active'`
);
console.log(`Accounts                 ${users}  (${withX} with X connected)`);

// ── Creator Index (044) ──────────────────────────────────────────────────────
if (await exists('IndexEntry')) {
  const listed = await one(`select count(*) n from "IndexEntry" where listed`);
  const left = await one(`select count(*) n from "IndexEntry" where not listed`);
  const week = await one(
    `select count(*) n from "IndexEntry" where "joinedAt" > now() - interval '7 days'`
  );
  const views = (await exists('IndexView'))
    ? await one(`select count(*) n from "IndexView" where "viewedAt" > now() - interval '7 days'`)
    : 0;
  console.log(`Index members (listed)   ${listed}  (+${week} joined in 7 days)`);
  console.log(`Index members who left   ${left}`);
  console.log(`Index page views (7d)    ${views}`);
} else {
  console.log('Index                    migration 044 not applied');
}

// ── Money: founding cards + seats ───────────────────────────────────────────
const cards = await one(
  `select count(*) n from "User" where "subscriptionTier" in ${PAID} and "subscriptionStatus" in ('TRIALING','ACTIVE') and role <> 'admin'`
);
const paying = await one(
  `select count(*) n from "User" where "subscriptionTier" in ${PAID} and "subscriptionStatus" = 'ACTIVE' and role <> 'admin'`
);
console.log(`Cards added (live)       ${cards}  (${paying} already charged)`);
if (await exists('FoundingMember')) {
  const taken = await one(`select count(*) n from "FoundingMember"`);
  console.log(
    `Founding seats left      ${Math.max(0, FOUNDING_SPOTS - taken)} of ${FOUNDING_SPOTS}  (numbered on first real charge)`
  );
} else {
  console.log('Founding seats           migration 038 not applied');
}

await db.end();
