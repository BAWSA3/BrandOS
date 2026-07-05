// ============================================================================
// Data-isolation (RLS) acceptance suite — Minimum Launch Bar Phase 1
//
// Run:  node --env-file=.env.local scripts/rls-acceptance.mjs
//       npm run test:rls
//
// Targets whatever database the env file points at. Cross-user tests run inside
// transactions that are ALWAYS rolled back — nothing is persisted. The legacy
// guard test inserts one sentinel row via the anon key and deletes it via the
// privileged connection in cleanup.
//
// What it asserts:
//   A. Anon surface     — base tables locked, public view + PlanLimit readable
//   B. Legacy guard     — anon BrandScans INSERT is value-constrained (mig 010)
//   C. Cross-user RLS   — members see only their workspace; insert needs an
//                         owned, active X connection (simulated via SET ROLE)
// ============================================================================
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const RUN = randomUUID().slice(0, 8);
const SENTINEL = `zz_rls_test_${RUN}`;

const pgUrl =
  process.env.POSTGRES_URL_NON_POOLING || process.env.DIRECT_URL || process.env.DATABASE_URL;
const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!pgUrl || !sbUrl || !anonKey) {
  console.error('Missing DB url / Supabase url / anon key in env.');
  process.exit(1);
}

// Strip sslmode so our explicit ssl option handles Supabase's self-signed chain.
function relaxedUrl(cs) {
  const u = new URL(cs);
  u.searchParams.delete('sslmode');
  u.searchParams.delete('ssl');
  return u.toString();
}

const anon = createClient(sbUrl, anonKey, { auth: { persistSession: false } });
const db = new pg.Client({ connectionString: relaxedUrl(pgUrl), ssl: { rejectUnauthorized: false } });

// ---- tiny test harness ------------------------------------------------------
let passed = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failures.push({ name, message: err.message });
    console.log(`  ✗ ${name}\n      ${err.message}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// ---- fixture seeding (runs as the privileged role, RLS bypassed) ------------
async function seedUserStack(label) {
  const supabaseId = randomUUID();
  const userId = `${SENTINEL}_${label}_${randomUUID().slice(0, 6)}`;
  await db.query(
    `INSERT INTO "User" (id, "supabaseId", "createdAt", "updatedAt") VALUES ($1,$2,now(),now())`,
    [userId, supabaseId],
  );
  const ws = await db.query(
    `INSERT INTO "Workspace" (name, type, owner_user_id, created_at, updated_at)
     VALUES ($1,'personal',$2, now(), now()) RETURNING id`,
    [`${SENTINEL}_${label}`, userId],
  );
  const workspaceId = ws.rows[0].id;
  await db.query(
    `INSERT INTO "WorkspaceMember" (workspace_id, user_id, role) VALUES ($1,$2,'owner')`,
    [workspaceId, userId],
  );
  const connId = `${SENTINEL}_conn_${label}_${randomUUID().slice(0, 6)}`;
  await db.query(
    `INSERT INTO "PlatformConnection"
       ("id","platform","platformUserId","platformUsername","accessToken","scopes","userId","updatedAt","workspace_id","status")
     VALUES ($1,'x',$2,$3,'tok','[]',$4,now(),$5,'active')`,
    [connId, `xid_${label}_${RUN}`, `handle_${label}`, userId, workspaceId],
  );
  return { userId, supabaseId, workspaceId, connId };
}

async function seedScan(stack, username) {
  const r = await db.query(
    `INSERT INTO "BrandScan"
       (user_id, workspace_id, platform_connection_id, x_username, score, archetype, phase_scores, strengths, improvements)
     VALUES ($1,$2,$3,$4,80,'Test','{}'::jsonb,'[]'::jsonb,'[]'::jsonb) RETURNING id`,
    [stack.userId, stack.workspaceId, stack.connId, username],
  );
  return r.rows[0].id;
}

// Simulate a logged-in Supabase user for the current transaction.
async function actAs(stack) {
  await db.query(`SELECT set_config('request.jwt.claims', $1, true)`, [
    JSON.stringify({ sub: stack.supabaseId, role: 'authenticated' }),
  ]);
  await db.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [stack.supabaseId]);
  await db.query(`SET LOCAL ROLE authenticated`);
}

// Run fn inside a rolled-back transaction (never persists).
async function inTxn(fn) {
  await db.query('BEGIN');
  try {
    return await fn();
  } finally {
    await db.query('ROLLBACK').catch(() => {});
    await db.query('RESET ROLE').catch(() => {});
  }
}

async function main() {
  await db.connect();
  const host = sbUrl.replace(/^https:\/\//, '').split('.')[0];
  console.log(`\nRLS acceptance suite  →  ${host}.supabase.co  (run ${RUN})\n`);

  // ---- A. Anon surface (read-only) -----------------------------------------
  console.log('A. Anon read surface');
  await test('BrandScan (Phase 1 base table) is NOT anon-readable', async () => {
    const { error, count } = await anon.from('BrandScan').select('*', { count: 'exact', head: true });
    assert(error || count === 0, `expected block/empty, got count=${count}`);
  });
  await test('Workspace returns zero rows to anon', async () => {
    const { count } = await anon.from('Workspace').select('*', { count: 'exact', head: true });
    assert(count === 0, `expected 0, got ${count}`);
  });
  await test('SecurityAuditLog returns zero rows to anon', async () => {
    const { count } = await anon.from('SecurityAuditLog').select('*', { count: 'exact', head: true });
    assert(count === 0, `expected 0, got ${count}`);
  });
  await test('brand_scans_public_card view is anon-readable', async () => {
    const { error } = await anon.from('brand_scans_public_card').select('*', { count: 'exact', head: true });
    assert(!error, `expected readable, got ${error?.message}`);
  });
  await test('PlanLimit is anon-readable (intended public config)', async () => {
    const { error, count } = await anon.from('PlanLimit').select('*', { count: 'exact', head: true });
    assert(!error && count > 0, `expected readable rows, got count=${count} err=${error?.message}`);
  });

  // ---- B. Legacy BrandScans anon-insert guard (migration 010) --------------
  console.log('\nB. Legacy BrandScans anti-poisoning guard');
  await test('valid anon insert (score 80) is accepted', async () => {
    const { error } = await anon.from('BrandScans').insert({ username: SENTINEL, score: 80, archetype: 'Test' });
    assert(!error, `expected accept, got ${error?.message}`);
  });
  await test('out-of-range score (9999) is rejected', async () => {
    const { error } = await anon.from('BrandScans').insert({ username: SENTINEL, score: 9999, archetype: 'Test' });
    assert(!!error, 'expected rejection but insert succeeded — guard (migration 010) not applied?');
  });
  await test('oversized username is rejected', async () => {
    const { error } = await anon.from('BrandScans').insert({ username: 'x'.repeat(50), score: 50, archetype: 'Test' });
    assert(!!error, 'expected rejection but insert succeeded — guard (migration 010) not applied?');
  });

  // ---- C. Cross-user / cross-workspace isolation (rolled back) -------------
  console.log('\nC. Cross-user isolation (RLS, simulated auth, rolled back)');
  await test('a member sees ONLY their own workspace scans', async () => {
    await inTxn(async () => {
      const a = await seedUserStack('A');
      const b = await seedUserStack('B');
      await seedScan(a, 'alice');
      await seedScan(b, 'bob');
      await actAs(a);
      const r = await db.query(`SELECT count(*)::int AS n FROM "BrandScan"`);
      assert(r.rows[0].n === 1, `A should see 1 scan, saw ${r.rows[0].n}`);
    });
  });
  await test("a member CANNOT read another workspace's scan by id", async () => {
    await inTxn(async () => {
      const a = await seedUserStack('A');
      const b = await seedUserStack('B');
      const bScan = await seedScan(b, 'bob');
      await actAs(a);
      const r = await db.query(`SELECT count(*)::int AS n FROM "BrandScan" WHERE id = $1`, [bScan]);
      assert(r.rows[0].n === 0, `A should not see B's scan, saw ${r.rows[0].n}`);
    });
  });
  await test('insert with an OWNED active X connection is allowed', async () => {
    await inTxn(async () => {
      const a = await seedUserStack('A');
      await actAs(a);
      const r = await db.query(
        `INSERT INTO "BrandScan"
           (user_id, workspace_id, platform_connection_id, x_username, score, archetype, phase_scores, strengths, improvements)
         VALUES ($1,$2,$3,'alice',77,'Test','{}'::jsonb,'[]'::jsonb,'[]'::jsonb) RETURNING id`,
        [a.userId, a.workspaceId, a.connId],
      );
      assert(r.rows.length === 1, 'expected insert to succeed');
    });
  });
  await test("insert referencing ANOTHER user's connection is blocked", async () => {
    await inTxn(async () => {
      const a = await seedUserStack('A');
      const b = await seedUserStack('B');
      await actAs(a);
      let threw = false;
      try {
        await db.query(
          `INSERT INTO "BrandScan"
             (user_id, workspace_id, platform_connection_id, x_username, score, archetype, phase_scores, strengths, improvements)
           VALUES ($1,$2,$3,'alice',77,'Test','{}'::jsonb,'[]'::jsonb,'[]'::jsonb)`,
          [a.userId, a.workspaceId, b.connId],
        );
      } catch {
        threw = true;
      }
      assert(threw, 'expected RLS WITH CHECK violation, but insert was allowed');
    });
  });
  await test('insert spoofing another user_id is blocked', async () => {
    await inTxn(async () => {
      const a = await seedUserStack('A');
      const b = await seedUserStack('B');
      await actAs(a);
      let threw = false;
      try {
        await db.query(
          `INSERT INTO "BrandScan"
             (user_id, workspace_id, platform_connection_id, x_username, score, archetype, phase_scores, strengths, improvements)
           VALUES ($1,$2,$3,'alice',77,'Test','{}'::jsonb,'[]'::jsonb,'[]'::jsonb)`,
          [b.userId, a.workspaceId, a.connId],
        );
      } catch {
        threw = true;
      }
      assert(threw, 'expected RLS WITH CHECK violation, but insert was allowed');
    });
  });
}

async function cleanup() {
  // Remove the one sentinel row left by the accepted anon insert in section B.
  await db.query(`DELETE FROM "BrandScans" WHERE username = $1`, [SENTINEL]).catch(() => {});
}

try {
  await main();
} catch (err) {
  console.error('\nFATAL:', err.message);
  process.exitCode = 1;
} finally {
  await cleanup();
  await db.end().catch(() => {});
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) process.exitCode = 1;
