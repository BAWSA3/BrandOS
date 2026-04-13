# Key Rotation Checklist

**Status:** Prep doc — DO NOT execute yet
**Executes during:** Phase 6 of `SECURITY-HARDENING.md`
**Prerequisite:** Staging is green, all hardening phases 1–5 complete and validated in staging
**Estimated time:** 90 min for the rotation pass + 30 min verification
**Window:** Pick a low-traffic 2-hour window. Notify any active beta testers 24h ahead.

---

## Why we rotate everything at once

Every secret in this list has, at some point, been reachable through code paths that did not enforce row-level security. We must assume read of the anon key implies read of every scan. The conservative move is full rotation, not partial.

Rotation order matters: rotate **dependencies before consumers**. For example, rotate Supabase service role before redeploying app code, because the app needs the new key on first request after deploy.

---

## Pre-flight (do these the day before)

- [ ] Confirm staging passed all Phase 5 acceptance criteria
- [ ] Confirm Vercel env groups are split per-environment (no shared values)
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel for production (currently only anon key may be present)
- [ ] Open Vercel dashboard, Supabase dashboard, Stripe dashboard, Resend dashboard, X developer portal in separate browser tabs and stay logged in
- [ ] Have `gh repo view --json url` URL handy to deploy from
- [ ] Run `gitleaks detect --source . --no-banner` and resolve any historical secret leaks before rotating (rotating now while a leak is in git history just means rotating again)
- [ ] Tell beta testers via email or Discord: "We're rotating credentials at [time]. You may be logged out and need to sign in again."
- [ ] Snapshot the current Vercel env to a local encrypted file so you have a rollback reference: `vercel env pull .env.production.snapshot.[date]` then `gpg -c .env.production.snapshot.[date]` then delete the plaintext

---

## Rotation pass — execute top to bottom in one session

### 1. Supabase

- [ ] **Project Settings → API → Reset anon key.** Copy new value.
- [ ] **Project Settings → API → Reset service role key.** Copy new value.
- [ ] Update Vercel env (production):
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Update Vercel env (staging) with the staging Supabase keys (different project, separately rotated).
- [ ] Trigger redeploy on production. Wait for green build.
- [ ] **Verify:** `curl https://[old-anon-key-as-bearer] https://api.supabase.co/...` returns 401.
- [ ] **Verify:** A signed-in test user on production can still load their dashboard.

### 2. Database password (Supabase Postgres)

- [ ] **Project Settings → Database → Reset database password.** Copy.
- [ ] Update Vercel env (production):
  - `DATABASE_URL` — replace `[PASSWORD]` segment
  - `DIRECT_URL` — replace `[PASSWORD]` segment
- [ ] Trigger redeploy. Wait for green build.
- [ ] **Verify:** Cron jobs run successfully on next tick (check Vercel logs).
- [ ] **Verify:** Prisma queries work (test by loading any authenticated page).

### 3. Google Gemini

- [ ] Google Cloud Console → APIs & Services → Credentials → API keys → **Regenerate** the key in use.
- [ ] Old key auto-disables on regeneration. Copy new value.
- [ ] Update Vercel env (production): `GOOGLE_GEMINI_API_KEY`
- [ ] Trigger redeploy.
- [ ] **Verify:** A test scan produces a non-error result on production.

### 4. Anthropic

- [ ] console.anthropic.com → Settings → API Keys → **Create new key**, label it `brandos-prod-2026-04-13`.
- [ ] Update Vercel env: `ANTHROPIC_API_KEY`
- [ ] Trigger redeploy.
- [ ] **Verify:** A paid audit on production returns a valid result.
- [ ] **Delete** the old Anthropic key (after verification confirms new key works).

### 5. Stripe

- [ ] dashboard.stripe.com → Developers → API keys → **Roll** secret key. Copy new value.
- [ ] Update Vercel env: `STRIPE_SECRET_KEY`
- [ ] Webhook signing secret: dashboard.stripe.com → Developers → Webhooks → [your endpoint] → **Roll signing secret**. Copy.
- [ ] Update Vercel env: `STRIPE_WEBHOOK_SECRET`
- [ ] Publishable key: rotate via dashboard. Update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- [ ] Trigger redeploy.
- [ ] **Verify:** Test mode checkout completes end-to-end on staging.
- [ ] **Verify:** Stripe webhook delivery shows 200 OK on a test event.

### 6. Resend

- [ ] resend.com → API Keys → **Delete** old key, **Create** new one labeled `brandos-prod-2026-04-13`.
- [ ] Update Vercel env: `RESEND_API_KEY`
- [ ] Trigger redeploy.
- [ ] **Verify:** Trigger a test email (e.g., the cron `/api/cron/send-emails` or a fresh signup welcome). Check Resend dashboard for delivery.

### 7. SocialData

- [ ] socialdata.tools → Settings → API Keys → regenerate.
- [ ] Update Vercel env: `SOCIALDATA_API_KEY`
- [ ] **Verify:** A scan completes when X bearer is rate-limited (force fallback path in staging).

### 8. X (Twitter) bearer

- [ ] developer.x.com → Project → Keys & tokens → Bearer Token → **Regenerate**.
- [ ] Update Vercel env: `X_BEARER_TOKEN`
- [ ] **Verify:** Tweet fetch route returns data on staging.

### 9. Cloudinary

- [ ] cloudinary.com → Settings → Access Keys → **Regenerate** API secret.
- [ ] Update Vercel env: `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- [ ] **Verify:** Image upload flow works (if any user-facing upload exists).

### 10. PostHog

- [ ] PostHog → Project Settings → Project API Key → **Reset**.
- [ ] Update Vercel env: `NEXT_PUBLIC_POSTHOG_KEY`
- [ ] **Verify:** Events still appear in PostHog within 5 min of test interaction.

### 11. CRON_SECRET

- [ ] Generate a new strong secret: `openssl rand -hex 32`
- [ ] Update Vercel env: `CRON_SECRET`
- [ ] **Verify:** Manual trigger of a cron route with the new secret returns 200; with the old secret returns 401.

### 12. Onchain platform private key

- [ ] **Stop and reconsider.** Storing a private key in an env var is not best practice. Options:
  - (a) Move to a hardware wallet (Ledger) and sign offline. Most secure, slowest UX.
  - (b) Move to AWS KMS or Google Cloud KMS for managed signing. Mid-effort, mid-cost.
  - (c) Keep in Vercel env but mark `sensitive: true` and document that this is a temporary state.
- [ ] If keeping in env (option c) for now: generate a new key, fund the new wallet on the target chain, drain the old wallet to the new one, update `ONCHAIN_PLATFORM_PRIVATE_KEY` in Vercel.
- [ ] Add a Phase 9 ticket in `SECURITY-HARDENING.md` to migrate to KMS within 30 days of launch.

### 13. Legacy/partner API keys

- [ ] Delete `BRANDOS_API_KEY` from Vercel env (legacy route is removed in Phase 2).
- [ ] Delete `BRANDOS_PARTNER_API_KEYS` env var.
- [ ] In the DB `ApiKey` table, mark all rows `revoked = true`. Hard-delete after 30 days.

### 14. Sentry DSN

- [ ] sentry.io → Project Settings → Client Keys → **Add new key**, label `brandos-prod-2026-04-13`.
- [ ] Update Vercel env: `SENTRY_DSN` (or whichever DSN env var is in use — confirm).
- [ ] **Verify:** New error appears in Sentry tagged with the new key.
- [ ] Disable old key after 24h grace period (in case any in-flight pages still reference it).

### 15. Other OAuth client secrets — DELETE (no provider apps registered)

Confirmed 2026-04-13: these env var names appear in code but **no developer app exists at the providers**. They are placeholder env names from `.env.example`, never paired with a real OAuth registration. No provider-side cleanup needed. Multi-platform shipping in Q2 — fresh apps will be registered then.

Action: simply remove the env vars from Vercel (production + staging + preview) and any local `.env.local` files. No keys to rotate.

```sh
vercel env rm YOUTUBE_CLIENT_ID production
vercel env rm YOUTUBE_CLIENT_SECRET production
vercel env rm YOUTUBE_REDIRECT_URI production
vercel env rm YOUTUBE_API_KEY production
vercel env rm LINKEDIN_CLIENT_ID production
vercel env rm LINKEDIN_CLIENT_SECRET production
vercel env rm LINKEDIN_REDIRECT_URI production
vercel env rm INSTAGRAM_CLIENT_ID production
vercel env rm INSTAGRAM_CLIENT_SECRET production
vercel env rm INSTAGRAM_REDIRECT_URI production
vercel env rm TIKTOK_CLIENT_KEY production
vercel env rm TIKTOK_CLIENT_SECRET production
vercel env rm TIKTOK_REDIRECT_URI production
vercel env rm THREADS_CLIENT_ID production
vercel env rm THREADS_CLIENT_SECRET production
vercel env rm THREADS_REDIRECT_URI production
```

Repeat for `staging` and `preview` environments.

Also: grep the codebase for any references and delete dead code paths that consume these env vars. They were never reachable in production traffic.

**When Q2 multi-platform work begins:** register fresh OAuth apps at each provider, generate fresh credentials, add to env. Treat as new integration, not a resumption.

### 16. Motion Plus token

- [ ] motion.dev → Account → Tokens → regenerate.
- [ ] Update Vercel env: `MOTION_PLUS_TOKEN`
- [ ] Note: this only matters at install time. No runtime rotation needed unless rebuilding.

---

## Post-rotation verification

- [ ] All cron jobs ran successfully on next tick (check Vercel cron logs)
- [ ] No 5xx spike in Sentry over the next hour
- [ ] Test user flow on production: signup → scan → see card → buy audit → receive email — all green
- [ ] Old Supabase anon key tested via curl returns 401
- [ ] Old Stripe key tested via curl returns 401
- [ ] `gitleaks detect --source . --no-banner` shows no new leaks
- [ ] Email beta testers: "Rotation complete. If you experience issues, please reach out."

---

## Force-invalidate user sessions (final step)

After rotation, all existing Supabase sessions are technically still valid (they were issued under the old anon key but verified with the project's separate JWT secret, which we did not rotate). However, if you want to force everyone to re-auth as a security hygiene measure:

- [ ] Run a one-shot script `scripts/invalidate-all-sessions.ts` that calls `supabase.auth.admin.signOut()` for each user OR rotate the JWT secret in Supabase project settings (this nukes all sessions instantly).
- [ ] Send a notification email: "We rotated security credentials. Please sign in again."

Decision: **rotate the JWT secret** if you have <1000 users. Cleaner than per-user sign-out.

---

## Rollback plan

If something breaks irrecoverably during rotation:

1. Pause traffic at Vercel (use Vercel's "pause" feature on the production deployment).
2. Restore the previous env values from the encrypted snapshot taken in pre-flight.
3. Redeploy.
4. Diagnose the failed step before retrying the rotation.

Do not try to rotate a single key in isolation as the fix — root-cause first.
