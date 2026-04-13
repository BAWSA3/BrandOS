# Phase 0 Execution Runbook

**Goal:** Stand up a 1:1 staging environment that mirrors production for safe security hardening.
**Timebox:** 1–2 days
**Prerequisite:** None (this is the first phase)
**Output:** A green staging URL Jeffrey can deploy hardening changes to without touching production.

---

## What's already done in code (this commit)

- [x] `NEXT_PUBLIC_APP_ENV` added to `.env.example` with `development | preview | staging | production` values
- [x] `src/lib/app-env.ts` — typed helper (`getAppEnv()`, `isProductionEnv()`, `isStagingEnv()`)
- [x] `src/components/EnvBanner.tsx` — sticky top banner that renders for all envs **except production**. Yellow for staging, purple for preview, green for dev. Hidden in prod.
- [x] `src/app/layout.tsx` — `<EnvBanner />` mounted above `<BetaBadge />`
- [x] `docs/KEY-ROTATION-CHECKLIST.md` — Phase 6 prep doc, do not execute yet
- [x] `docs/SECURITY-HARDENING.md` updated with the three resolved decisions (X-only signin, reclaim by email, no partner API)

---

## What Jeffrey needs to do (external dashboards)

Each step has an acceptance check. Don't move on until the check passes.

### Step 1 — Install Vercel CLI (10 min)

```sh
npm i -g vercel
vercel login
vercel link            # link the current repo to the Vercel project
```

**Acceptance:** `vercel whoami` returns Jeffrey's account. `vercel project ls` shows the existing prod project.

> The Vercel CLI unlocks `vercel env pull`, `vercel env add`, `vercel deploy --target=staging`, and the env-pull snapshot used in the rotation checklist. It is required for the rest of Phase 0.

---

### Step 2 — Create staging Supabase project (15 min)

1. supabase.com → New project → name it `brandos-staging` → choose the **same region** as production (matters for latency parity with prod).
2. Save the new project's:
   - Project URL
   - Anon key
   - Service role key
   - Database password
   - Direct + pooled connection strings
3. Run migrations against staging (do NOT copy data):
   ```sh
   DATABASE_URL="<staging_pooled_url>" \
   DIRECT_URL="<staging_direct_url>" \
   npx prisma migrate deploy
   ```
4. Apply the existing Supabase migrations under `supabase-migrations/` in order against staging via the SQL editor or `supabase db push --db-url <staging_direct_url>`.

**Acceptance:** Open staging Supabase Table Editor. `User`, `BrandScans`, and `InviteCode` tables exist. All zero rows.

---

### Step 3 — Create staging Vercel project (15 min)

1. In the Vercel dashboard: New Project → import the same GitHub repo.
2. Name the project `brandos-staging`.
3. **Production branch:** set to `staging` (not `main`). This is critical — pushing to `staging` will deploy to this project's "production" URL, which is your staging environment.
4. Add a custom domain if desired: `staging.mybrandos.app`.

**Acceptance:** `brandos-staging` project exists in Vercel. Production branch = `staging`. Project link confirmed.

---

### Step 4 — Create the staging git branch (5 min)

```sh
git checkout main
git pull
git checkout -b staging
git push -u origin staging
```

**Acceptance:** `staging` branch exists on origin. Vercel triggers a build automatically.

---

### Step 5 — Configure staging env vars in Vercel (30 min)

For the `brandos-staging` Vercel project, set these env vars (all environments: production+preview+development on the staging project):

| Env var | Value source |
|---|---|
| `NEXT_PUBLIC_APP_ENV` | `staging` |
| `NEXT_PUBLIC_SUPABASE_URL` | staging Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | staging Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | staging Supabase service role key |
| `DATABASE_URL` | staging Supabase pooled URL |
| `DIRECT_URL` | staging Supabase direct URL |
| `STRIPE_SECRET_KEY` | Stripe **test mode** secret (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | new test-mode webhook signing secret (Step 6) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe test publishable (`pk_test_...`) |
| `STRIPE_PRICE_*` | new test-mode price IDs (recreate products in test mode) |
| `RESEND_API_KEY` | staging Resend key (Step 7) |
| `EMAIL_FROM` | `staging@mail.staging.mybrandos.app` |
| `ENTERPRISE_NOTIFY_EMAIL` | Jeffrey's personal email (so test inquiries don't hit team@) |
| `ANTHROPIC_API_KEY` | a separate Anthropic key with low spend cap |
| `GOOGLE_GEMINI_API_KEY` | separate Gemini key |
| `X_BEARER_TOKEN` | can reuse prod (read-only) — note in audit log |
| `SOCIALDATA_API_KEY` | separate key with own spend cap |
| `CRON_SECRET` | new random `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | `https://staging.mybrandos.app` |
| `NEXT_PUBLIC_EARLY_ACCESS_MODE` | `true` |
| `NEXT_PUBLIC_ONCHAIN_CHAIN` | `avalanche-fuji` (testnet only) |
| `ONCHAIN_PLATFORM_PRIVATE_KEY` | empty (simulation mode in staging) |

CLI shortcut for bulk add (after `vercel link` to the staging project):
```sh
vercel env add NEXT_PUBLIC_APP_ENV staging production
# repeat for each var, scoped to the staging project
```

**Acceptance:** `vercel env ls` for the staging project shows every var above. Production project's env is unchanged.

---

### Step 6 — Stripe test mode + staging webhook (15 min)

1. Stripe dashboard → toggle **Test mode** (top right).
2. Recreate the products and price IDs in test mode (DNA Report, Score Boost, Archetype Deep Dive, subscriptions). Copy each new test price ID into the staging Vercel env.
3. Developers → Webhooks → Add endpoint:
   - URL: `https://staging.mybrandos.app/api/stripe/webhook`
   - Events: same set as production (`checkout.session.completed`, `customer.subscription.*`, `invoice.*`)
4. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET` for the staging Vercel project.

**Acceptance:** Stripe test webhook delivery shows 200 OK on a manually triggered test event.

---

### Step 7 — Resend staging subdomain (15 min)

1. Buy or use existing DNS for `staging.mybrandos.app`.
2. Resend → Domains → Add domain `mail.staging.mybrandos.app`.
3. Add the DNS records Resend provides (SPF, DKIM, DMARC) to your DNS provider.
4. Wait for verification (usually <10 min).
5. Create a new Resend API key labeled `brandos-staging`. Add to staging Vercel env.
6. Set `EMAIL_FROM=BrandOS Staging <staging@mail.staging.mybrandos.app>` in staging env.

**Acceptance:** Resend dashboard shows `mail.staging.mybrandos.app` as Verified. Sending a test email from staging works.

---

### Step 8 — Verify the staging deploy (10 min)

1. Push a no-op commit to `staging` branch, or trigger a redeploy via Vercel dashboard.
2. Visit `https://staging.mybrandos.app` (or whatever domain you configured).
3. Confirm:
   - Yellow `[STAGING]` banner is visible at top
   - Sign-in-with-X flow works (you'll sign into the staging Supabase, not prod)
   - Scanning your own handle produces a result
   - The user record is created in **staging** Supabase, not production
   - No log entries appear in production Sentry from staging traffic

**Acceptance:** End-to-end flow works on staging. Production data is untouched.

---

### Step 9 — Add a Vercel deploy hook for safe staging rollouts (5 min)

So you can promote staging-tested changes to production with confidence:

1. Production Vercel project → Settings → Git → Deploy Hooks → create one named `staging-promotion` for the `staging` branch.
2. Document in your team workflow: changes go to `staging` first, get verified, then merge `staging` → `main`.

**Acceptance:** Deploy hook URL exists. You can trigger a redeploy of the staging project via curl.

---

### Step 10 — Snapshot pre-rotation env (5 min)

```sh
vercel env pull .env.production.snapshot.2026-04-13 --environment=production
gpg -c .env.production.snapshot.2026-04-13
rm .env.production.snapshot.2026-04-13            # plaintext gone
```

Store the encrypted file in 1Password (or similar). This is the rollback reference for Phase 6.

**Acceptance:** Encrypted snapshot exists in 1Password. Plaintext is deleted from disk.

---

## Phase 0 done when

- [x] All 10 steps above pass acceptance
- [x] `staging` branch exists, Vercel `brandos-staging` builds it on push
- [x] Visiting staging URL shows yellow `[STAGING]` banner
- [x] Sign-in-with-X works on staging without polluting prod data
- [x] Stripe test webhook returns 200 on test events
- [x] Encrypted env snapshot stored

Then proceed to Phase 1 (RLS + `user_id` migration) — execute on `staging` branch first, validate, then merge to `main`.
