// MRR snapshot for the monetization agent (docs/monetization/README.md).
// One read-only pass over prod: funnel (scans → signups → cards → paid), MRR,
// cancels, founding seats. Prints a summary and writes
// docs/monetization/snapshots/YYYY-MM-DD.json so every build in BUILD-LEDGER.md
// can be read against a before/after number instead of a feeling.
//
// MRR source: Stripe when STRIPE_SECRET_KEY is in env (authoritative: active,
// non-trialing subscriptions, normalised to monthly). Otherwise an estimate
// from the DB (founding members × $29, other ACTIVE Pro × $39, Agency × $249),
// marked "estimate" in the output.
//
//   node --env-file=.env.prod.local scripts/mrr-snapshot.mjs           (prod)
//   node --env-file=.env.prod.local scripts/mrr-snapshot.mjs --no-write

import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const WRITE = !process.argv.includes('--no-write');
const PRICES = { FOUNDING: 29, PRO: 39, AGENCY: 249 }; // src/lib/plans.ts, docs/LAUNCH-PLAN.md
const FOUNDING_SPOTS = 100;
const PAID = `('PRO','AGENCY','ENTERPRISE')`;

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

const exists = async (table) =>
  (await db.query(`select to_regclass($1) is not null as ok`, [`public."${table}"`])).rows[0].ok;
const one = async (sql) => Number((await db.query(sql)).rows[0]?.n ?? 0);
const inLast = (col, days) => `${col} > now() - interval '${days} days'`;

// ── Funnel, last 7 and 28 days ───────────────────────────────────────────────
const funnel = {};
for (const d of [7, 28]) {
  funnel[`${d}d`] = {
    scans: await one(`select count(*) n from "BrandScans" where ${inLast('created_at', d)}`),
    scannedHandles: await one(
      `select count(distinct lower(username)) n from "BrandScans" where ${inLast('created_at', d)}`
    ),
    signups: await one(`select count(*) n from "User" where ${inLast('"createdAt"', d)}`),
  };
}

// ── Accounts and money (DB) ──────────────────────────────────────────────────
const notAdmin = `role <> 'admin'`;
const accounts = await one(`select count(*) n from "User"`);
const byStatus = Object.fromEntries(
  (
    await db.query(
      `select "subscriptionStatus" s, count(*) n from "User"
       where "subscriptionTier" in ${PAID} and ${notAdmin} group by 1`
    )
  ).rows.map((r) => [r.s, Number(r.n)])
);
const activeByTier = Object.fromEntries(
  (
    await db.query(
      `select "subscriptionTier" t, count(*) n from "User"
       where "subscriptionTier" in ${PAID} and "subscriptionStatus" = 'ACTIVE' and ${notAdmin} group by 1`
    )
  ).rows.map((r) => [r.t, Number(r.n)])
);
const founding = (await exists('FoundingMember'))
  ? await one(`select count(*) n from "FoundingMember"`)
  : null;

// ── MRR ──────────────────────────────────────────────────────────────────────
let mrr = null;
let mrrSource = 'estimate';
let stripeActive = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    let cents = 0;
    stripeActive = 0;
    for await (const sub of stripe.subscriptions.list({ status: 'active', limit: 100 })) {
      stripeActive++;
      for (const item of sub.items.data) {
        const p = item.price;
        if (!p.recurring || p.unit_amount == null) continue;
        const perMonth = { month: 1, year: 1 / 12, week: 52 / 12, day: 365 / 12 }[
          p.recurring.interval
        ];
        cents +=
          p.unit_amount * (item.quantity ?? 1) * (perMonth / (p.recurring.interval_count || 1));
      }
    }
    mrr = Math.round(cents) / 100;
    mrrSource = 'stripe';
  } catch (e) {
    console.error(`Stripe read failed, falling back to DB estimate: ${e.message}`);
  }
}
if (mrr === null) {
  const pro = activeByTier.PRO ?? 0;
  const foundingPaying = Math.min(founding ?? 0, pro);
  mrr =
    foundingPaying * PRICES.FOUNDING +
    (pro - foundingPaying) * PRICES.PRO +
    (activeByTier.AGENCY ?? 0) * PRICES.AGENCY;
}

const cancels28d = await one(
  `select count(*) n from "User" where "subscriptionStatus" = 'CANCELED'
   and "subscriptionTier" in ${PAID} and ${inLast('"updatedAt"', 28)} and ${notAdmin}`
);

await db.end();

const snapshot = {
  takenAt: new Date().toISOString(),
  db: (u.username.split('.')[1] ?? u.hostname).slice(0, 8),
  mrr,
  mrrSource,
  stripeActiveSubscriptions: stripeActive,
  paying: activeByTier,
  subscriptionStatus: byStatus,
  cardsOnFile: (byStatus.TRIALING ?? 0) + (byStatus.ACTIVE ?? 0),
  cancels28d,
  foundingSeatsTaken: founding,
  foundingSeatsLeft: founding === null ? null : Math.max(0, FOUNDING_SPOTS - founding),
  accounts,
  funnel,
};

const f7 = funnel['7d'];
const rate = (a, b) => (b ? `${((a / b) * 100).toFixed(1)}%` : '—');
console.log(`BrandOS MRR snapshot · ${snapshot.db} · ${snapshot.takenAt.slice(0, 16)}Z\n`);
console.log(`MRR                  $${mrr.toFixed(2)}  (${mrrSource})`);
console.log(`Paying (active)      ${JSON.stringify(activeByTier)}`);
console.log(`Cards on file        ${snapshot.cardsOnFile}  (trialing ${byStatus.TRIALING ?? 0})`);
console.log(`Cancels (28d)        ${cancels28d}`);
console.log(`Founding seats left  ${snapshot.foundingSeatsLeft ?? 'migration 038 not applied'}`);
console.log(`Accounts             ${accounts}`);
console.log(
  `7d funnel            ${f7.scans} scans · ${f7.scannedHandles} handles · ${f7.signups} signups (${rate(f7.signups, f7.scannedHandles)} handle→signup)`
);

if (WRITE) {
  const dir = path.join(process.cwd(), 'docs/monetization/snapshots');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${snapshot.takenAt.slice(0, 10)}.json`);
  fs.writeFileSync(file, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`\nWrote ${path.relative(process.cwd(), file)}`);
}
