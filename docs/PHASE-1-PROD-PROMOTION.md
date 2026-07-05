# Phase 1 → Production Promotion Plan

**Status:** PLAN (not yet executed) · **Created:** 2026-06-18 · **Risk:** HIGH (live DB, 6,445 real rows; the env-var-rename trap)

## 0. PROGRESS — RESUME HERE (paused 2026-06-18)

Promotion **paused before the merge** at a clean, safe state. Prod still runs the
OLD code untouched; the Phase 1 DB schema is applied but **dormant** (old code
doesn't read it); a backup exists. Nothing is half-broken.

**✅ Done:**
- **Pre-flight:** backup taken (`~/brandos-prod-backup-2026-06-18.sql`, 6.2 MB, 85 data stmts); app write-path confirmed RLS-safe (BrandScan via service-role Prisma); staging green (`test:rls` 13/13, `test:safety` 21/21).
- **Prod DB connectivity FIXED (incident):** prod DB password was rotated; its connection strings had been pointing at the **direct** host (`db.<ref>.supabase.co`, unreachable from Vercel → `P1001`). Switched `DATABASE_URL`/`DIRECT_URL` to the **Supavisor pooler**. Verified: zero prod errors, Prisma reaching DB. See [[reference-supabase-prod-connection]].
- **Step A (Supabase key env):** prod already has BOTH old + new name-sets (`PUBLISHABLE_KEY`/`SECRET_KEY` alongside `ANON_KEY`/`SERVICE_ROLE_KEY`) — integration synced them. No action needed.
- **Step B (migrations):** `004` → `005` → `011` applied to prod DB and **verified** — all of `has_brandscan_table`, `has_workspace_table`, `has_member_table`, `has_select_policy`, `has_insert_policy`, `has_011_helper` = `true`. (`010` was already on prod.)

**⛔ BLOCKER before the merge (Step D): prod is missing 18 env vars staging uses.**
Triaged:
- 🔴 **Required** (Phase 1 scan/connect-X throws without it): `X_OAUTH_ENCRYPTION_KEY` (generate fresh: `openssl rand -base64 32 | tr '+/' '-_' | tr -d '='`), `NEXT_PUBLIC_APP_URL` = `https://mybrandos.app`, `NEXT_PUBLIC_APP_ENV` = `production`.
- 🟢 **Easy:** `CRON_SECRET` (`openssl rand -hex 32`), `ENTERPRISE_NOTIFY_EMAIL`.
- 🟡 **Stripe (17 vars) — a decision, not a copy:** needs LIVE-mode keys + live price IDs (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_*`). Routes already `503` on prod today, so deferring = status quo. Deferred for now (revenue is gated by the higher-bar posture anyway).

**▶️ To resume:** set the 🔴+🟢 vars on the `brandos` project → then Step C/D (env-aware merge `staging`→`main`) → Step E (verify, incl. confirm the public homepage scan still works = no funnel collapse; `x-brand-score` is NOT `assertCanScan`-gated, so it should stay open) → Step F (remove old Supabase key names). Resume at §3 Step C below.

---

This is the step-by-step, env-aware plan to promote the Phase 1 account model
(workspaces, owned scans, RLS) from `staging` to production (`main` / the
`brandos` Vercel project / `mybrandos.app`). Do NOT improvise this — it's the
riskiest operation in the project. Execute top-to-bottom; each step has a
verification gate. Stop at the first gate that fails.

---

## 1. Why this is dangerous (read first)

Three things must change **together**, or prod breaks:

1. **Code** — 23 commits ahead on `staging`. 40 files use the NEW Supabase env
   names (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`); zero
   use the old ones. Production's `brandos` Vercel project still has the OLD
   names (`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
   → Merging without flipping env first = "Missing Supabase environment
   variables" build/runtime failure (the exact trap in `HANDOFF.md §2`).

2. **Database** — prod DB is still pre-Phase-1: no `BrandScan`, `Workspace`,
   `WorkspaceMember`, `PlatformConnection` Phase-1 columns, no RLS. Migrations
   `004` (account model), `005` (RLS), `011` (RLS recursion fix) must be applied
   to prod. (`010` poisoning guard is ALREADY on prod, verified 2026-06-18.)

3. **Env vars** — must be set in the `brandos` project BEFORE the merge deploys.

The safe trick: make env changes **additive first** (both old + new names present
during the window), so nothing breaks at any single moment, then remove the old
ones only after prod is confirmed green.

---

## 2. Pre-flight (verify BEFORE touching prod) — gate ❑

- [ ] **Confirm the prod target.** Live `BrandScans` row count is in the
  thousands (was 6,445). `vsngdhkkscniprlbkakp` is STAGING — prod is a different
  ref (read it from the `brandos` Vercel project env, or the live bundle).
- [ ] **Back up the prod DB.** Supabase dashboard → Database → Backups → take a
  manual snapshot / PITR checkpoint. Record the timestamp here: __________
- [ ] **Confirm baseline migrations on prod.** Prod must already have `001`/`002`
  (legacy `BrandScans` + its anon policies — it does, since scan recording
  works) and `010` (verified). Run the diagnostic from §6 read-only first.
- [ ] **Confirm the app's write path.** The promoted app still records scans to
  legacy `BrandScans` via the anon key (`scan-tracking.ts`) AND uses
  service-role Prisma for Phase-1 tables (RLS-exempt). Verify no authenticated
  (anon-key) INSERT path depends on the new RLS — if one exists, `011`'s
  `bscan_insert_via_own_xaccount` must be in place first (it is, in `011`).
- [ ] **Decide the env endgame.** Long-term: standardize on the new names
  everywhere (prod + staging). This promotion flips prod to the new names.
- [ ] **Green on staging.** `npm run test:rls` (13/13) and `npm run test:safety`
  (21/21) pass; staging deploy is Ready.

---

## 3. Promotion sequence (execute in order)

### Step A — Add NEW Supabase env vars to the `brandos` (prod) project — gate ❑
Set in ALL env groups (Production, Preview, Development), **alongside** the
existing old-name vars (do not remove old yet):
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = (prod publishable/anon key value)
- `SUPABASE_SECRET_KEY` = (prod service-role/secret key value)
- (`NEXT_PUBLIC_SUPABASE_URL` is unchanged — same name both schemes.)

Gate: `vercel env ls` on `brandos` shows both old and new names present.
Do NOT redeploy yet.

### Step B — Apply Phase-1 migrations to the prod DB — gate ❑
Against the **prod** connection (Supabase SQL editor, or `apply-migration.mjs`
pointed at prod creds), in this exact order:
1. `004_phase1_account_model.sql` (additive — creates tables/enums; safe)
2. `005_phase1_rls_policies.sql` (enables RLS + policies + public-card view)
3. `011_fix_rls_recursion.sql` (SECURITY DEFINER helpers + fixed policies)

(`010` already on prod — do not re-run unless the §6 diagnostic shows it
missing.) `004` is purely additive, so the still-old prod code keeps working
between B and D.

Gate: run the §6 diagnostic — `has_brandscan_table`, `has_workspace_table`,
`has_phase1_rls` all `true`; then run the RLS acceptance suite against prod
(see §6) → 13/13.

### Step C — Final staging verification — gate ❑
`npm run test:rls && npm run test:safety` green; staging deploy Ready.

### Step D — Merge `staging` → `main` — gate ❑
Now env-aware and safe: prod env already has the new names (Step A), prod DB
already has the schema (Step B).
```
git checkout main && git pull
git merge staging          # resolve conflicts if any; expect the env-name + Phase-1 code
git push origin main       # triggers brandos production deploy
```
Gate: the `brandos` production build succeeds (watch the deploy).

### Step E — Verify production health (logged-out) — gate ❑
```
curl -s -o /dev/null -w "%{http_code}\n" https://mybrandos.app/            # 200
curl -s -o /dev/null -w "%{http_code}\n" https://mybrandos.app/tier-list   # 200
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://mybrandos.app/dashboard  # 307 -> /signup
curl -s -o /dev/null -w "%{http_code}\n" https://mybrandos.app/tier-list/somerandomnobody123  # 200
```
Plus authed smoke test: signup → connect X → scan own handle works; scanning a
non-owned handle is 403; anon DB read is empty (run §6 diagnostic on prod).

### Step F — Remove the OLD env vars — gate ❑
ONLY after E is green and stable (give it a few hours / a real scan): delete
`NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` from the
`brandos` project, then redeploy and re-run §5 health checks. Now prod and
staging both use the new names — the rename trap is gone for good.

---

## 4. Rollback

- **Build/runtime breakage after merge (D/E):** in Vercel, instantly promote the
  previous good `brandos` production deployment (Deployments → ⋯ → Promote).
  Then `git revert` the merge commit on `main` and push.
- **Env vars:** keeping BOTH name sets through the window means a rollback deploy
  (old code) still finds the old names. That's the whole point of Step A being
  additive — do not skip it.
- **DB:** `004`/`005`/`011` are additive/policy-only and don't touch legacy
  `BrandScans` data; nothing to roll back for the 6,445 rows. If RLS must be
  backed out, `DROP POLICY` + `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` on the
  Phase-1 tables (they're new/empty, so safe).

---

## 5. Production health checks
See Step E. A `500` on `/tier-list/<user>` = DB unreachable at runtime or an old
deploy still serving.

## 6. Prod DB diagnostic + acceptance (read-only first)
Run this in the prod SQL editor before AND after Step B:
```sql
select
  (select count(*) from "BrandScans")                          as brandscans_rows,   -- thousands = prod
  to_regclass('"BrandScan"')  is not null                      as has_brandscan_table,
  to_regclass('"Workspace"')  is not null                      as has_workspace_table,
  exists(select 1 from pg_policy
         where polname = 'bscan_select_workspace_member')       as has_phase1_rls;
```
After Step B, point `scripts/rls-acceptance.mjs` at prod creds (a `.env.prod`
with the prod URL + keys + `POSTGRES_URL_NON_POOLING`) and run it — expect 13/13.
The cross-user tests roll back (no writes persisted); the one anon-insert
sentinel is cleaned up.

---

## 7. Open questions to resolve during pre-flight
- Does any promoted code path INSERT into the new `BrandScan` via the **anon**
  key (RLS-enforced) rather than service-role Prisma? If yes, exercise it on
  staging first. (Believed no — Prisma/service-role is the write path.)
- Are there OTHER env vars set on `brandos-staging` but missing on `brandos`
  that the 23 commits now require? Diff the two projects' `vercel env ls` before
  Step D. (Supabase is the known one; check for others e.g. `INTERNAL_API_SECRET`
  — already set on both — and any new feature flags.)
